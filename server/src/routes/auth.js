import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { config, prisma } from '../config.js';
import { signToken, requireAuth } from '../lib/auth.js';
import { asyncRoute, audit, httpError } from '../lib/util.js';
import { disconnectUser } from '../realtime.js';
import { emailConfigured, sendEmailNow } from '../services/notify.js';

const r = Router();
// Same cost as real hashes, so an unknown email takes as long as a wrong password.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);
const loginLimiter = process.env.NODE_ENV === 'test' && process.env.DISABLE_RATE_LIMIT === 'true' ? (req, res, next) => next() : rateLimit({ windowMs: 15 * 60_000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many login attempts. Please wait 15 minutes.' } });

r.post('/login', loginLimiter, asyncRoute(async (req, res) => {
  const { email, password } = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(200) }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  const ok = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);
  if (!user || !ok || !user.isActive) {
    await audit(req, 'auth.login_failed', { meta: { email } });
    return res.status(401).json({ error: 'Wrong email or password' });
  }
  req.user = user;
  await audit(req, 'auth.login');
  res.json({ token: signToken(user) });
}));

r.post('/register', loginLimiter, asyncRoute(async (req, res) => {
  const { name, email, password } = z.object({
    name: z.string().trim().min(1, 'Name is required').max(80),
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(200),
  }).parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw httpError(409, 'An account with this email already exists');

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'USER',
    },
  });
  req.user = user;
  await audit(req, 'auth.register');
  res.status(201).json({ token: signToken(user) });
}));

r.post('/forgot-password', loginLimiter, asyncRoute(async (req, res) => {
  const { email } = z.object({
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
  }).parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  let devResetToken;
  if (user && user.isActive) {
    const resetToken = jwt.sign(
      { sub: user.id, v: user.tokenVersion, purpose: 'reset' },
      config.jwtSecret,
      { expiresIn: '15m' },
    );
    const resetUrl = `${config.adminUrl}/login?reset=${encodeURIComponent(resetToken)}`;
    if (emailConfigured(null)) {
      await sendEmailNow(null, {
        to: user.email,
        subject: 'Reset your Chatral password',
        text: `Hi ${user.name},\n\nReset your Chatral password using the link below (valid for 15 minutes):\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
      });
    } else if (config.nodeEnv !== 'production') {
      console.log(`[auth] Password reset link for ${user.email}: ${resetUrl}`);
      devResetToken = resetToken;
    }
    await audit(req, 'auth.forgot_password', { meta: { userId: user.id } });
  }

  res.json({
    ok: true,
    message: 'If an account exists for that email, password reset instructions have been sent.',
    ...(devResetToken ? { devResetToken } : {}),
  });
}));

r.post('/reset-password', loginLimiter, asyncRoute(async (req, res) => {
  const { token, password } = z.object({
    token: z.string().min(1),
    password: z.string().min(8, 'Password must be at least 8 characters').max(200),
  }).parse(req.body);

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw httpError(400, 'Reset link is invalid or has expired');
  }
  if (payload?.purpose !== 'reset' || !payload?.sub) {
    throw httpError(400, 'Reset link is invalid or has expired');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive || user.tokenVersion !== payload.v) {
    throw httpError(400, 'Reset link is invalid or has expired');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, 12), tokenVersion: { increment: 1 } },
  });
  disconnectUser(user.id);
  await prisma.pushDevice.deleteMany({ where: { userId: user.id } });
  req.user = user;
  await audit(req, 'auth.password_reset');
  res.json({ ok: true });
}));

export const meView = (u) => ({
  id: u.id, email: u.email, name: u.name, role: u.role, avatarUrl: u.avatarUrl,
  memberships: u.memberships.map((m) => ({ storeId: m.storeId, role: m.role, presence: m.presence })),
});

r.get('/me', requireAuth, asyncRoute(async (req, res) => {
  const stores = await prisma.store.findMany({
    where: req.user.role === 'SUPER_ADMIN' ? {} : { id: { in: req.user.memberships.map((m) => m.storeId) } },
    select: { id: true, name: true, isActive: true },
    orderBy: { name: 'asc' },
  });
  res.json({ ...meView(req.user), stores });
}));

r.patch('/me', requireAuth, asyncRoute(async (req, res) => {
  const data = z.object({ name: z.string().trim().min(1).max(80).optional(), avatarUrl: z.string().trim().max(500).refine((v) => !v || /^https:\/\//.test(v), 'must start with https://').optional() }).parse(req.body);
  const u = await prisma.user.update({ where: { id: req.user.id }, data, include: { memberships: true } });
  res.json(meView(u));
}));

r.post('/password', requireAuth, asyncRoute(async (req, res) => {
  const { current, next } = z.object({ current: z.string(), next: z.string().min(10, 'must be at least 10 characters').max(200) }).parse(req.body);
  if (!(await bcrypt.compare(current, req.user.passwordHash))) throw httpError(400, 'Current password is wrong');
  // Bumping tokenVersion signs out every other session.
  const u = await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash: await bcrypt.hash(next, 12), tokenVersion: { increment: 1 } } });
  disconnectUser(req.user.id);
  await prisma.pushDevice.deleteMany({ where: { userId: req.user.id } });
  await audit(req, 'auth.password_changed');
  res.json({ token: signToken(u) });
}));

r.post('/logout-all', requireAuth, asyncRoute(async (req, res) => {
  await prisma.user.update({ where: { id: req.user.id }, data: { tokenVersion: { increment: 1 } } });
  disconnectUser(req.user.id);
  await prisma.pushDevice.deleteMany({ where: { userId: req.user.id } });
  await audit(req, 'auth.logout_all');
  res.json({ ok: true });
}));

const pushSchema = z.object({ token: z.string().regex(/^Expo(nent)?PushToken\[[\w-]+\]$/, 'invalid push token'), platform: z.enum(['ios', 'android']) });

// Mobile app: register this phone for push. Re-registering moves the token to the current user.
r.post('/push-devices', requireAuth, asyncRoute(async (req, res) => {
  const { token, platform } = pushSchema.parse(req.body);
  await prisma.pushDevice.upsert({ where: { token }, create: { token, platform, userId: req.user.id }, update: { userId: req.user.id, platform, lastSeenAt: new Date() } });
  res.json({ ok: true });
}));

// Mobile app: unregister on sign-out (only the caller's own tokens).
r.delete('/push-devices', requireAuth, asyncRoute(async (req, res) => {
  const { token } = pushSchema.pick({ token: true }).parse(req.body || {});
  await prisma.pushDevice.deleteMany({ where: { token, userId: req.user.id } });
  res.json({ ok: true });
}));

export default r;
