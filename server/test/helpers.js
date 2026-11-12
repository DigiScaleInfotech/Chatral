// Integration test harness: real Express + WebSocket server on a random port, real Postgres (TEST_DATABASE_URL).
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import WebSocket from 'ws';

process.env.NODE_ENV = 'test';
process.env.DISABLE_RATE_LIMIT = 'true';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres@localhost:5433/livechat_test';
process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'lc-uploads-'));
process.env.ADMIN_URL = 'http://admin.test/admin';
process.env.ENC_KEY ||= 'a'.repeat(64);
process.env.JWT_SECRET ||= 'test-secret-test-secret-test-secret-0000';

export let base;
export let mods;
let server;
let wss;

export async function start() {
  execSync('npx prisma migrate deploy', { stdio: 'ignore', env: process.env });
  const config = await import('../src/config.js');
  const tables = ['WebhookDelivery', 'Webhook', 'TriggerExecution', 'Trigger', 'Job', 'Attachment', 'Message', 'Conversation', 'Visitor', 'SavedReply', 'WidgetConfig', 'StoreMember', 'UsageDaily', 'AuditLog', 'Store', 'User'];
  await config.prisma.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t}"`).join(', ')} CASCADE`);
  const app = await import('../src/app.js');
  mods = {
    config,
    prisma: config.prisma,
    clock: config.clock,
    jobs: await import('../src/services/jobs.js'),
    retention: await import('../src/services/retention.js'),
    events: await import('../src/services/events.js'),
    engine: await import('../src/triggers/engine.js'),
    bcrypt: (await import('bcryptjs')).default,
  };
  ({ server, wss } = app.createServer());
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
  return mods;
}

export async function stop() {
  (await import('../src/realtime.js')).closeAll();
  await mods.events.idle();
  wss.close();
  await new Promise((r) => server.close(r));
  mods.clock.reset();
  await mods.prisma.$disconnect();
}

export async function call(method, url, { token, body, headers = {}, raw } = {}) {
  const res = await fetch(base + url, {
    method,
    headers: { ...(body !== undefined && !raw ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
  let data = null;
  try { data = await res.json(); } catch { /* binary */ }
  return { status: res.status, data, res };
}

export async function makeUser(email, { role = 'USER', name = email.split('@')[0] } = {}) {
  const user = await mods.prisma.user.create({ data: { email, name, role, passwordHash: await mods.bcrypt.hash('Password-12345', 4) } });
  const { data } = await call('POST', '/api/auth/login', { body: { email, password: 'Password-12345' } });
  return { ...user, token: data.token };
}

export async function makeStore(superToken, name, allowedOrigins = []) {
  const { status, data } = await call('POST', '/api/stores', { token: superToken, body: { name, allowedOrigins } });
  if (status !== 201) throw new Error(`store create ${status} ${JSON.stringify(data)}`);
  return data;
}

export async function addMember(token, storeId, email, role) {
  // The API only adds agents now; legacy roles (still honoured for existing members) are set up directly.
  if (role === 'AGENT') {
    const r = await call('POST', `/api/stores/${storeId}/members`, { token, body: { email, role } });
    if (r.status !== 201) throw new Error(`member ${r.status} ${JSON.stringify(r.data)}`);
    return;
  }
  const user = await mods.prisma.user.findUnique({ where: { email } });
  await mods.prisma.storeMember.create({ data: { userId: user.id, storeId, role } });
}

/** Visitor boot (like the widget does on page load). */
export async function visit(key, { token, origin, url = 'https://shop.test/', title = 'Home', referrer, headers = {} } = {}) {
  const r = await call('POST', `/api/widget/${key}/session`, { body: { token, url, title, referrer, device: 'desktop' }, headers: { ...(origin ? { Origin: origin } : {}), ...headers } });
  return { ...r, token: r.data?.visitorToken || token };
}

let n = 0;
export const cid = () => `c-${Date.now()}-${++n}-${Math.random().toString(36).slice(2, 8)}`;

export function say(key, token, body, extra = {}, origin) {
  return call('POST', `/api/widget/${key}/messages`, { body: { clientMsgId: cid(), body, ...extra }, headers: { 'X-Visitor-Token': token, ...(origin ? { Origin: origin } : {}) } });
}

/** WebSocket client that records every event. */
export function socket(pathAndQuery, headers = {}) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(base.replace('http', 'ws') + pathAndQuery, { headers });
    const events = [];
    const waiters = [];
    ws.on('message', (raw) => {
      const ev = JSON.parse(raw);
      events.push(ev);
      for (const w of [...waiters]) if (w.test(ev)) { waiters.splice(waiters.indexOf(w), 1); w.resolve(ev); }
    });
    ws.on('unexpected-response', (req, res) => reject(Object.assign(new Error(`ws ${res.statusCode}`), { statusCode: res.statusCode })));
    ws.on('error', reject);
    ws.on('open', () => {
      const api = {
        ws, events,
        send: (type, data) => ws.send(JSON.stringify({ type, data })),
        waitFor: (type, pred = () => true, ms = 3000) => {
          const hit = events.find((e) => e.type === type && pred(e.data));
          if (hit) return Promise.resolve(hit);
          return new Promise((res2, rej2) => {
            const w = { test: (e) => e.type === type && pred(e.data), resolve: res2 };
            waiters.push(w);
            setTimeout(() => rej2(new Error(`timeout waiting for ${type}`)), ms);
          });
        },
        close: () => new Promise((r) => { ws.once('close', r); ws.close(); }),
      };
      resolve(api);
    });
  });
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const DAY = 86_400_000;
