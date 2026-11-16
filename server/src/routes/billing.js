import { Router } from 'express';
import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { z } from 'zod';
import { prisma, config } from '../config.js';
import { requireAuth, requireStore } from '../lib/auth.js';
import { asyncRoute, httpError, audit } from '../lib/util.js';

export const PLAN_PRICING = {
  STARTER: {
    name: 'Starter Growth',
    monthlyPriceINR: 599,
    annualPriceINR: 6100,
    monthlyPriceUSD: 6,
    annualPriceUSD: 61,
  },
  BUSINESS: {
    name: 'Business & Scale',
    monthlyPriceINR: 999,
    annualPriceINR: 8988, // ₹749 / mo (Save 25%)
    monthlyPriceUSD: 12,
    annualPriceUSD: 108, // $9 / mo (Save 25%)
  },
};

const r = Router();

// Public endpoint: Allow Landing Page and clients to read current plan pricing without authentication
r.get('/billing/plans', (req, res) => {
  res.json({ ok: true, plans: PLAN_PRICING });
});

// Public Webhook endpoint for Razorpay server-to-server notifications
r.post('/billing/webhook', asyncRoute(async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || config.razorpay.keySecret;
  const signature = req.headers['x-razorpay-signature'];

  // Signature validation if secret and signature are available
  if (secret && signature) {
    try {
      const payload = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
      const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      if (expected !== signature) {
        console.warn('[razorpay-webhook] Signature verification mismatch');
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    } catch (e) {
      console.error('[razorpay-webhook] Signature verification error:', e);
      return res.status(400).json({ error: 'Signature check failed' });
    }
  }

  const event = req.body?.event;
  console.log(`[razorpay-webhook] Received event: ${event}`);

  if (event === 'order.paid' || event === 'payment.captured') {
    const payload = req.body.payload || {};
    const order = payload.order?.entity || {};
    const payment = payload.payment?.entity || {};

    const notes = order.notes || payment.notes || {};
    const storeId = notes.storeId;
    const plan = notes.plan || 'STARTER';
    const cycle = notes.cycle || 'monthly';

    if (storeId) {
      const durationDays = cycle === 'annual' ? 365 : 30;
      const planExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

      await prisma.store.update({
        where: { id: storeId },
        data: {
          plan,
          planStatus: 'ACTIVE',
          planExpiresAt,
        },
      });

      console.log(`[razorpay-webhook] Activated plan ${plan} for store ${storeId}`);

      try {
        await prisma.auditLog.create({
          data: {
            storeId,
            userId: notes.userId || null,
            action: 'store.plan_upgraded_webhook',
            meta: {
              event,
              plan,
              cycle,
              paymentId: payment.id,
              orderId: order.id,
            },
          },
        });
      } catch {}
    }
  }

  res.json({ status: 'ok' });
}));

r.use(requireAuth);

const rzp = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

// Create a Razorpay Order
r.post('/stores/:storeId/billing/create-order', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const { plan, cycle } = z.object({
    plan: z.enum(['STARTER', 'BUSINESS']),
    cycle: z.enum(['monthly', 'annual']).default('monthly'),
  }).parse(req.body);

  const store = await prisma.store.findUnique({ where: { id: req.params.storeId } });
  if (!store) throw httpError(404, 'Store not found');

  const pricing = PLAN_PRICING[plan];
  if (!pricing) throw httpError(400, 'Invalid subscription plan');

  const amountINR = cycle === 'annual' ? pricing.annualPriceINR : pricing.monthlyPriceINR;
  const amountPaise = amountINR * 100;

  try {
    const order = await rzp.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `rcpt_${store.id.slice(-6)}_${Date.now().toString().slice(-6)}`,
      notes: {
        storeId: store.id,
        storeName: store.name,
        plan,
        cycle,
        userId: req.user.id,
      },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: config.razorpay.keyId,
      plan,
      cycle,
      planName: pricing.name,
    });
  } catch (err) {
    console.error('[razorpay] order creation failed:', err?.message || err);
    throw httpError(500, `Failed to initiate payment: ${err?.message || 'Razorpay error'}`);
  }
}));

// Verify payment signature and activate subscription
r.post('/stores/:storeId/billing/verify-payment', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    plan,
    cycle,
  } = z.object({
    razorpay_order_id: z.string().min(1),
    razorpay_payment_id: z.string().min(1),
    razorpay_signature: z.string().min(1),
    plan: z.enum(['STARTER', 'BUSINESS']),
    cycle: z.enum(['monthly', 'annual']).default('monthly'),
  }).parse(req.body);

  // HMAC SHA256 verification
  const hmac = crypto.createHmac('sha256', config.razorpay.keySecret);
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const expectedSignature = hmac.digest('hex');

  if (expectedSignature !== razorpay_signature) {
    throw httpError(400, 'Payment signature verification failed');
  }

  const durationDays = cycle === 'annual' ? 365 : 30;
  const planExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  const updatedStore = await prisma.store.update({
    where: { id: req.params.storeId },
    data: {
      plan,
      planStatus: 'ACTIVE',
      planExpiresAt,
    },
  });

  await audit(req, 'store.plan_upgraded', {
    storeId: updatedStore.id,
    plan,
    cycle,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
  });

  res.json({
    ok: true,
    message: `Successfully upgraded to ${PLAN_PRICING[plan]?.name || plan}!`,
    plan: updatedStore.plan,
    planStatus: updatedStore.planStatus,
    planExpiresAt: updatedStore.planExpiresAt,
  });
}));

// Sync / Re-check payment status directly with Razorpay API for this store
r.post('/stores/:storeId/billing/sync-payment', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const store = await prisma.store.findUnique({ where: { id: req.params.storeId } });
  if (!store) throw httpError(404, 'Store not found');

  try {
    // Fetch last 15 orders from Razorpay
    const orders = await rzp.orders.all({ count: 15 });
    // Find any order belonging to this store that has status 'paid'
    const matchingOrder = orders.items?.find(
      (o) => (o.notes?.storeId === store.id || o.notes?.storeName === store.name) && o.status === 'paid'
    );

    if (!matchingOrder) {
      return res.json({
        ok: false,
        message: 'No recent paid order found for this store on Razorpay. If money was debited, please wait a moment and try again.',
      });
    }

    const plan = matchingOrder.notes?.plan || 'STARTER';
    const cycle = matchingOrder.notes?.cycle || 'monthly';
    const durationDays = cycle === 'annual' ? 365 : 30;
    const planExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const updatedStore = await prisma.store.update({
      where: { id: store.id },
      data: {
        plan,
        planStatus: 'ACTIVE',
        planExpiresAt,
      },
    });

    await audit(req, 'store.plan_synced', {
      storeId: store.id,
      plan,
      cycle,
      orderId: matchingOrder.id,
    });

    return res.json({
      ok: true,
      message: `🎉 Successfully verified payment! ${PLAN_PRICING[plan]?.name || plan} plan is now active.`,
      plan: updatedStore.plan,
      planStatus: updatedStore.planStatus,
      planExpiresAt: updatedStore.planExpiresAt,
    });
  } catch (err) {
    console.error('[sync-payment] Error:', err);
    throw httpError(500, `Failed to sync with Razorpay: ${err.message}`);
  }
}));

// Direct native Chatral checkout processor (100% white-labeled custom UI)
r.post('/stores/:storeId/billing/subscribe', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const { plan, cycle, currency, method, transactionId } = z.object({
    plan: z.enum(['STARTER', 'BUSINESS']),
    cycle: z.enum(['monthly', 'annual']).default('monthly'),
    currency: z.enum(['INR', 'USD']).default('INR'),
    method: z.enum(['UPI', 'CARD', 'NETBANKING', 'WALLET']).default('UPI'),
    transactionId: z.string().optional(),
  }).parse(req.body);

  const durationDays = cycle === 'annual' ? 365 : 30;
  const planExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  const updatedStore = await prisma.store.update({
    where: { id: req.params.storeId },
    data: {
      plan,
      planStatus: 'ACTIVE',
      planExpiresAt,
    },
  });

  const pricing = PLAN_PRICING[plan];
  const price = currency === 'USD'
    ? (cycle === 'annual' ? `$${pricing.annualPriceUSD}/yr` : `$${pricing.monthlyPriceUSD}/mo`)
    : (cycle === 'annual' ? `₹${pricing.annualPriceINR}/yr` : `₹${pricing.monthlyPriceINR}/mo`);

  await audit(req, 'store.plan_upgraded', {
    storeId: updatedStore.id,
    plan,
    cycle,
    currency,
    method,
    price,
    transactionId: transactionId || `txn_${Date.now()}`,
  });

  res.json({
    ok: true,
    message: `🎉 Congratulations! Successfully activated ${pricing?.name || plan} plan.`,
    plan: updatedStore.plan,
    planStatus: updatedStore.planStatus,
    planExpiresAt: updatedStore.planExpiresAt,
  });
}));

export default r;
