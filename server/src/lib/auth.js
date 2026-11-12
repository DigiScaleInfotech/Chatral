import jwt from 'jsonwebtoken';
import { config, prisma } from '../config.js';

export const signToken = (user) => jwt.sign({ sub: user.id, v: user.tokenVersion }, config.jwtSecret, { expiresIn: '7d' });

export async function userFromToken(token) {
  try {
    const { sub, v } = jwt.verify(token, config.jwtSecret);
    const user = await prisma.user.findUnique({ where: { id: sub }, include: { memberships: true } });
    if (!user || !user.isActive || user.tokenVersion !== v) return null;
    return user;
  } catch {
    return null;
  }
}

export async function requireAuth(req, res, next) {
  const user = await userFromToken((req.headers.authorization || '').replace(/^Bearer /, ''));
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  req.user = user;
  next();
}

export const isSuper = (user) => user.role === 'SUPER_ADMIN';

// Higher number = more power. SUPER sits above every store role.
export const RANK = { AGENT: 1, SUPERVISOR: 2, ADMIN: 3, OWNER: 4, SUPER: 5 };

export function storeRole(user, storeId) {
  if (isSuper(user)) return 'SUPER';
  return user.memberships.find((m) => m.storeId === storeId)?.role || null;
}

export const hasRole = (user, storeId, min) => {
  const r = storeRole(user, storeId);
  return !!r && RANK[r] >= RANK[min];
};

/** Middleware: caller needs at least `min` on req.params.storeId. Every store-scoped route goes through this. */
export const requireStore = (min = 'AGENT') => (req, res, next) => {
  const role = storeRole(req.user, req.params.storeId);
  if (!role || RANK[role] < RANK[min]) return res.status(403).json({ error: 'Forbidden' });
  req.storeRole = role;
  next();
};

export const requireSuper = (req, res, next) => (isSuper(req.user) ? next() : res.status(403).json({ error: 'Forbidden' }));

/** Store ids the user can access (null = all). */
export const visibleStoreIds = (user) => (isSuper(user) ? null : user.memberships.map((m) => m.storeId));
