// Bitrix24 alert: when a visitor fills the pre-chat form and starts a chat (or leaves an offline message),
// send a chat message to one Bitrix24 user through an inbound webhook (im.message.add).
// Configured only in the environment, never in code: the webhook URL contains a secret.
//   BITRIX24_WEBHOOK_URL  https://<portal>.bitrix24.<tld>/rest/<userId>/<secret>/  (a full method URL is accepted too)
//   BITRIX24_DIALOG_ID    receiving Bitrix24 user id (or chatNNN for a group chat)
import { prisma, config } from '../config.js';
import { enqueue, registerJob } from './jobs.js';
import { events } from './events.js';

export function bitrixConfig() {
  const raw = (process.env.BITRIX24_WEBHOOK_URL || '').trim();
  const dialogId = (process.env.BITRIX24_DIALOG_ID || '').trim();
  if (!raw || !dialogId) return null;
  let u;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== 'https:' && !(u.protocol === 'http:' && !config.isProd)) return null;
  // Accept ".../rest/107/secret/" or ".../rest/107/secret/im.chat.add.json": keep only the base.
  const base = `${u.origin}${u.pathname.replace(/\/[a-z0-9_.]+\.json$/i, '/').replace(/\/?$/, '/')}`;
  return { base, dialogId };
}

/** Plain-text alert. Bitrix24 renders [B]..[/B] and [URL=..]..[/URL] BB-codes. */
export function bitrixMessage({ store, conversation, visitor, offline, firstMessage }) {
  const answers = Object.values(visitor?.attributes || {})
    .filter((a) => a && a.label && a.value != null && a.value !== '')
    .map((a) => `${a.label}: ${Array.isArray(a.value) ? a.value.join(', ') : a.value}`);
  return [
    `[B]${offline ? 'Offline message' : 'New chat'} on ${store.name}[/B]`,
    `Name: ${visitor?.name || '-'}`,
    `Email: ${visitor?.email || '-'}`,
    ...answers,
    `Message: ${(firstMessage ?? conversation.lastMessagePreview ?? '-').slice(0, 1000)}`,
    `Page: ${visitor?.currentUrl || '-'}`,
    `[URL=${config.adminUrl}/inbox?store=${store.id}&c=${conversation.id}]Open in Chatral[/URL]`,
  ].join('\n');
}

events.on('conversation.created', async ({ store, conversation, offline }) => {
  if (!bitrixConfig() || conversation.folder === 'SPAM') return;
  await enqueue('bitrix_notify', { conversationId: conversation.id, offline: !!offline }, { storeId: store.id, dedupeKey: `bitrix:${conversation.id}` });
});

registerJob('bitrix_notify', async ({ conversationId, offline }) => {
  const cfg = bitrixConfig();
  if (!cfg) return; // turned off since the job was queued
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId }, include: { visitor: true, store: { select: { id: true, name: true } } } });
  if (!conversation) return; // deleted meanwhile
  // The customer's opening message (more may have arrived before this job ran).
  const first = await prisma.message.findFirst({ where: { conversationId, senderType: 'VISITOR' }, orderBy: { seq: 'asc' }, select: { body: true } });
  const res = await fetch(`${cfg.base}im.message.add.json`, {
    method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(10_000),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ DIALOG_ID: cfg.dialogId, MESSAGE: bitrixMessage({ store: conversation.store, conversation, visitor: conversation.visitor, offline, firstMessage: first?.body }) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const err = new Error(`Bitrix24 ${res.status}: ${data.error_description || data.error || 'request failed'}`);
    // Bad webhook/permissions won't fix themselves; other errors are retried with backoff.
    if (res.status === 401 || res.status === 403 || ['NO_AUTH_FOUND', 'INVALID_CREDENTIALS', 'insufficient_scope', 'ERROR_METHOD_NOT_FOUND'].includes(data.error)) err.permanent = true;
    console.error('[bitrix24]', err.message);
    throw err;
  }
});
