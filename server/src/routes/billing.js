import { Router } from 'express';
import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { z } from 'zod';
import { prisma, config } from '../config.js';
import { requireAuth, requireStore } from '../lib/auth.js';
import { asyncRoute, httpError, audit } from '../lib/util.js';

const r = Router();
r.use(requireAuth);

const rzp = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

export const PLAN_PRICING = {
  STARTER: {
    name: 'Starter Growth',
    monthlyPriceINR: 399,
    annualPriceINR: 3591, // 25% discount
  },
  BUSINESS: {
    name: 'Business & Scale',
    monthlyPriceINR: 999,
    annualPriceINR: 8991, // 25% discount
  },
};

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

export default r;
