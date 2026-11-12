import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import net from 'node:net';
import nodemailer from 'nodemailer';
import { prisma, config, clock } from '../config.js';
import { decryptJson } from '../lib/crypto.js';
import { enqueue, registerJob } from './jobs.js';
import { toAgents } from '../realtime.js';
import { events } from './events.js';
import './bitrix.js'; // Bitrix24 new-chat alerts (env-configured)

// ---------- Email ----------

export function smtpFor(store) {
  let s = null;
  try { s = store.emailConfig ? decryptJson(store.emailConfig) : null; } catch { s = null; }
  if (s?.host && s?.user) return s;
  return config.smtp.host && config.smtp.user ? config.smtp : null;
}

export const emailConfigured = (store) => !!smtpFor(store);

export const SMTP_HELP = 'Email is not set up. Add SMTP in Store settings → Notifications & SMTP (host, port, security, username, password, from address), or set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS and SMTP_FROM on the server and restart it.';

/**
 * Sends one email now and resolves only when the SMTP server accepted every recipient.
 * Errors carry a user-safe message (never the password).
 */
export async function sendEmailNow(store, { to, subject, text }) {
  const s = smtpFor(store);
  if (!s) throw Object.assign(new Error(SMTP_HELP), { status: 409 });
  const t = nodemailer.createTransport({ host: s.host, port: Number(s.port), secure: s.secure !== false && s.secure !== 'false', auth: { user: s.user, pass: s.pass }, connectionTimeout: 15_000, greetingTimeout: 15_000, socketTimeout: 20_000 });
  let info;
  try {
    info = await t.sendMail({ from: s.from || s.user, to, subject, text });
  } catch (e) {
    const why = e.code === 'EAUTH' ? 'the mail server rejected the username/password'
      : ['ECONNECTION', 'ETIMEDOUT', 'ESOCKET', 'EDNS'].includes(e.code) ? 'could not connect to the mail server (check host, port and security)'
      : e.responseCode ? `the mail server refused it (${e.responseCode})` : 'the mail server returned an error';
    throw Object.assign(new Error(`Email was not sent: ${why}.`), { status: 502 });
  }
  const accepted = (info.accepted || []).map(String);
  if (!accepted.length || (info.rejected || []).length) throw Object.assign(new Error('Email was not sent: the mail server rejected the recipient.'), { status: 502 });
  return { messageId: info.messageId, accepted };
}

const smtpWarned = new Map(); // storeId -> last warning time (log at most hourly per store)

/**
 * Queues an email. Returns false (and queues nothing) when there are no recipients or no SMTP - never
 * pretends to send. A missing SMTP is logged (without content) so the cause is visible in the server log.
 * `dedupeKey` makes repeated events for the same thing queue only one email.
 */
export async function queueEmail(store, to, subject, text, { dedupeKey = null, reason = 'notification' } = {}) {
  const recipients = [...new Set(to.filter(Boolean).map((e) => String(e).trim().toLowerCase()))];
  if (!recipients.length) {
    console.warn(`[email] store ${store.id}: ${reason} not sent - no recipients (enable "Email me" for members or add notification emails)`);
    return false;
  }
  if (!emailConfigured(store)) {
    const last = smtpWarned.get(store.id) || 0;
    if (Date.now() - last > 3_600_000) {
      smtpWarned.set(store.id, Date.now());
      console.warn(`[email] store ${store.id}: ${reason} not sent - SMTP is not configured (store or SMTP_* env)`);
    }
    return false;
  }
  await enqueue('send_email', { storeId: store.id, to: recipients, subject, text, reason }, { storeId: store.id, dedupeKey });
  return true;
}

registerJob('send_email', async ({ storeId, to, subject, text }) => {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) return;
  const s = smtpFor(store);
  if (!s) throw Object.assign(new Error('SMTP not configured'), { permanent: true });
  const t = nodemailer.createTransport({ host: s.host, port: Number(s.port), secure: s.secure !== false && s.secure !== 'false', auth: { user: s.user, pass: s.pass } });
  let info;
  try {
    info = await t.sendMail({ from: s.from || s.user, to: to.join(', '), subject, text });
  } catch (e) {
    // Auth and 5xx won't fix themselves; network/4xx are retried with backoff by the queue.
    if (e.code === 'EAUTH' || (e.responseCode >= 500 && e.responseCode < 600)) e.permanent = true;
    console.error(`[email] store ${storeId}: send failed (${e.code || e.responseCode || 'error'})`);
    throw e;
  }
  // Only "sent" when the mail server accepted it; a fully rejected recipient list is a failure.
  if (!(info.accepted || []).length) throw Object.assign(new Error('All recipients were rejected by the mail server'), { permanent: true });
  if ((info.rejected || []).length) console.warn(`[email] store ${storeId}: ${info.rejected.length} recipient(s) rejected by the mail server`);
});

/**
 * Email setup + recent deliveries for the Notifications page. Shows recipients and subjects only
 * (never message bodies or SMTP passwords).
 */
export async function emailStatus(store) {
  const own = (() => { try { return store.emailConfig ? decryptJson(store.emailConfig) : null; } catch { return null; } })();
  const source = own?.host && own?.user ? 'store' : config.smtp.host && config.smtp.user ? 'platform' : null;
  const s = smtpFor(store);
  const members = (await recipientsFor(store.id, 'all_agents')).filter((m) => m.emailNotify).map((m) => m.user.email);
  const recipients = [...new Set([...members, ...store.notifyEmails])];
  const jobs = await prisma.job.findMany({ where: { storeId: store.id, type: 'send_email' }, orderBy: { createdAt: 'desc' }, take: 20 });
  const STATE = { PENDING: 'queued', RUNNING: 'sending', DONE: 'sent', FAILED: 'failed', CANCELLED: 'cancelled' };
  return {
    configured: !!s, source, from: s ? (s.from || s.user) : null,
    newChat: store.emailOnNewChat, offlineMessage: store.emailOnOffline,
    recipients,
    undeliverable: recipients.filter((e) => /@(example\.(com|org|net|test)|.*\.(test|invalid|example|localhost))$/i.test(e)),
    deliveries: jobs.map((j) => ({
      id: j.id, at: j.createdAt, status: j.status === 'PENDING' && j.attempts > 0 ? 'retrying' : STATE[j.status], attempts: j.attempts,
      subject: j.payload?.subject || '', to: j.payload?.to || [], error: j.status === 'DONE' ? null : (j.lastError || '').slice(0, 200).replace(/pass(word)?\S*/gi, '***'),
    })),
  };
}

/** Store members matching a notify target (same store only). */
export async function recipientsFor(storeId, target, conv = null) {
  const where = { storeId };
  if (target === 'admins') where.role = { in: ['OWNER', 'ADMIN'] };
  if (target === 'online_agents') where.presence = 'ONLINE';
  if (target === 'assignee') {
    if (!conv?.assigneeId) return [];
    where.userId = conv.assigneeId;
  }
  const rows = await prisma.storeMember.findMany({ where, include: { user: { select: { id: true, email: true, isActive: true } } } });
  return rows.filter((r) => r.user.isActive);
}

// New chat / offline message emails to the team.
events.on('conversation.created', async ({ store, conversation, offline }) => {
  const s = await prisma.store.findUnique({ where: { id: store.id } });
  if (!(offline ? s.emailOnOffline : s.emailOnNewChat)) return;
  const members = (await recipientsFor(store.id, 'all_agents')).filter((m) => m.emailNotify).map((m) => m.user.email);
  const v = conversation.visitor;
  await queueEmail(s, [...members, ...s.notifyEmails],
    `${offline ? 'Offline message' : 'New chat'} on ${s.name}`,
    `${v?.name || 'A visitor'}${v?.email ? ` <${v.email}>` : ''} ${offline ? 'left a message' : 'started a chat'}.\n\n"${conversation.lastMessagePreview || ''}"\n\nPage: ${v?.currentUrl || '-'}\nOpen inbox: ${config.adminUrl}/inbox?store=${s.id}&c=${conversation.id}`, { dedupeKey: `notify:${offline ? 'offline' : 'chat'}:${conversation.id}`, reason: offline ? 'offline-message email' : 'new-chat email' });
  toAgents(store.id, 'notification', { kind: offline ? 'offline_message' : 'new_chat', conversationId: conversation.id, text: conversation.lastMessagePreview || '' });
});

// ---------- Webhooks ----------

const PRIVATE = [/^10\./, /^127\./, /^169\.254\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./, /^0\./, /^::1$/, /^f[cd]/i, /^fe80/i];

/** Blocks webhooks to internal addresses (SSRF) in production. */
export async function assertPublicUrl(raw) {
  const u = new URL(raw);
  if (u.protocol !== 'https:' && !(u.protocol === 'http:' && !config.isProd)) throw Object.assign(new Error('Webhook URL must use https://'), { status: 400, permanent: true });
  if (!config.isProd) return;
  const addrs = net.isIP(u.hostname) ? [{ address: u.hostname }] : await dns.lookup(u.hostname, { all: true });
  if (addrs.some((a) => PRIVATE.some((re) => re.test(a.address)))) throw Object.assign(new Error('Webhook URL resolves to a private address'), { status: 400, permanent: true });
}

export const signPayload = (secret, ts, body) => 'sha256=' + crypto.createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex');

registerJob('webhook', async ({ webhookId, event, data }) => {
  const hook = await prisma.webhook.findUnique({ where: { id: webhookId } });
  if (!hook || !hook.enabled) return;
  const secret = decryptJson(hook.secret);
  const body = JSON.stringify({ event, storeId: hook.storeId, at: clock.now().toISOString(), data });
  const ts = Math.floor(Date.now() / 1000).toString();
  let status = null;
  try {
    await assertPublicUrl(hook.url);
    const res = await fetch(hook.url, {
      method: 'POST', body, redirect: 'manual', signal: AbortSignal.timeout(10_000),
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'LiveChat-Webhooks/1.0', 'X-Livechat-Event': event, 'X-Livechat-Timestamp': ts, 'X-Livechat-Signature': signPayload(secret, ts, body) },
    });
    status = res.status;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await prisma.webhookDelivery.create({ data: { webhookId, event, status: 'SUCCESS', httpStatus: status } });
  } catch (e) {
    await prisma.webhookDelivery.create({ data: { webhookId, event, status: 'FAILED', httpStatus: status, error: String(e.message).slice(0, 500) } });
    throw e;
  }
});

export async function queueWebhook(webhook, event, data) {
  await enqueue('webhook', { webhookId: webhook.id, event, data }, { storeId: webhook.storeId, maxAttempts: 6 });
}

// Subscribed (event-based) webhooks.
events.on('webhook', async ({ storeId, event, data }) => {
  const hooks = await prisma.webhook.findMany({ where: { storeId, enabled: true, events: { has: event } } });
  for (const h of hooks) await queueWebhook(h, event, data);
});
export const WEBHOOK_EVENTS = ['conversation.created', 'message.created', 'conversation.resolved', 'offline_message.created'];
