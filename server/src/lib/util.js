import crypto from 'node:crypto';
import { prisma, clock } from '../config.js';

export const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
export const randomToken = (n = 24) => crypto.randomBytes(n).toString('base64url');
export const newPublicKey = () => 'pk_' + randomToken(18);

// 8-digit id for a store's direct "open chat" link (e.g. #lc-01234567). Zero-padded so it's always 8 digits.
export const newChatLinkId = () => String(crypto.randomInt(0, 1e8)).padStart(8, '0');

// "shop.com", "https://www.shop.com/" and "http://shop.com" all mean the same host.
export const hostOf = (v) => String(v || '').trim().toLowerCase().replace(/^[a-z]+:\/\//, '').split(/[/?#:]/)[0].replace(/^www\./, '');

/**
 * Host of a browser Origin header, or null if it isn't a plain http(s) origin. Strict on purpose:
 * no credentials, no path, scheme must be http/https; trailing dot and leading "www." are dropped
 * and the port is ignored (example.com:8443 matches example.com).
 */
export function originHost(origin) {
  if (typeof origin !== 'string' || origin.length > 300) return null;
  let u;
  try { u = new URL(origin); } catch { return null; }
  if ((u.protocol !== 'https:' && u.protocol !== 'http:') || u.username || u.password) return null;
  if (u.pathname !== '/' || u.search || u.hash) return null;
  const h = u.hostname.toLowerCase().replace(/\.$/, '').replace(/^www\./, '');
  return /^[a-z0-9.-]+$/.test(h) && !h.startsWith('.') ? h : null;
}

export function originAllowed(origin, allowed) {
  const h = originHost(origin);
  if (!h) return false;
  return allowed.some((a) => {
    const ah = hostOf(a);
    if (ah.startsWith('*.')) return h === ah.slice(2) || h.endsWith(ah.slice(1));
    return ah === h;
  });
}

export async function audit(req, action, { storeId = null, target = null, meta = null } = {}) {
  await prisma.auditLog.create({
    data: { storeId, userId: req?.user?.id || null, action, target, meta, ip: req?.ip || null, createdAt: clock.now() },
  });
}

export const httpError = (status, message) => Object.assign(new Error(message), { status });

export const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
