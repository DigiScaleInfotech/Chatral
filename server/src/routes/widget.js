// Public API used by the embedded widget. Every call: store public key → origin allowlist → visitor token.
import { Router } from 'express';
import express from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { prisma, clock, config } from '../config.js';
import { asyncRoute, httpError, hostOf, randomToken, sha256 } from '../lib/util.js';
import { loadStoreByKey, checkOrigin, getPublishedConfig, DEFAULT_WIDGET_CONFIG, isWithinBusinessHours, cleanPrechatValue } from '../services/stores.js';
import { identifyVisitor, findVisitorByToken, recordPageView, bumpUsage, SESSION_GAP_MS } from '../services/visitors.js';
import { sendVisitorMessage, resumeConversation, findResumable, messagesAfter, visitorView, sendStaffMessage, updateConversation } from '../services/conversations.js';
import { emailConfigured, sendEmailNow } from '../services/notify.js';
import { transcriptText, sendTranscript } from '../services/transcript.js';
import { toAgents } from '../realtime.js';
import { emit } from '../services/events.js';
import { saveUpload, streamAttachment } from '../services/attachments.js';

const r = Router();
// Tests may disable limits (only honoured when NODE_ENV=test).
const noLimit = process.env.NODE_ENV === 'test' && process.env.DISABLE_RATE_LIMIT === 'true';
const limiter = (limit, windowMs = 60_000) => noLimit ? (req, res, next) => next() : rateLimit({ windowMs, limit, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests. Please slow down.' } });

const loadStore = asyncRoute(async (req, res, next) => {
  const store = await loadStoreByKey(req.params.key);
  if (!store) return res.status(404).json({ error: 'Chat is not available' });
  if (!(await checkOrigin(store, req.headers.origin))) return res.status(403).json({ error: 'This website is not allowed to use this chat widget' });
  req.store = store;
  next();
});

const loadVisitor = asyncRoute(async (req, res, next) => {
  const visitor = await findVisitorByToken(req.store.id, req.headers['x-visitor-token']);
  if (!visitor) return res.status(401).json({ error: 'Session expired. Please reload the page.', code: 'VISITOR_UNKNOWN' });
  req.visitor = visitor;
  next();
});

// Banned visitors can still load the page but cannot send anything to the store.
const notBanned = (req, res, next) => (req.visitor.bannedAt ? res.status(403).json({ error: 'You can no longer send messages in this chat.', code: 'VISITOR_BANNED' }) : next());

const pageSchema = z.object({
  token: z.string().max(100).optional().nullable(),
  url: z.string().max(2000).optional(),
  title: z.string().max(500).optional(),
  referrer: z.string().max(2000).optional(),
  device: z.enum(['mobile', 'desktop']).optional(),
});

async function availability(store, cfg) {
  // Agent online/away status is not used: live chat is available whenever business hours allow it.
  const hoursOpen = isWithinBusinessHours(cfg.businessHours);
  return { online: hoursOpen, hoursOpen };
}

/** Last proactive (trigger) message shown this session that hasn't turned into a conversation yet. */
async function pendingProactive(visitor, conv) {
  if (conv) return null;
  const exec = await prisma.triggerExecution.findFirst({
    where: { visitorId: visitor.id, status: 'SUCCEEDED', conversationId: null, createdAt: { gte: visitor.sessionStartedAt } },
    orderBy: { createdAt: 'desc' },
  });
  return exec?.details?.proactive || null;
}

// Stable per-store tag (survives key rotation) used to name the visitor token in browser storage.
export const storeTag = (store) => sha256('tag:' + store.id).slice(0, 16);
r.get('/:key/tag', limiter(60), loadStore, (req, res) => res.json({ tag: storeTag(req.store) }));

// Widget boot: identify/create visitor, return published config + resumable conversation.
// A widget load is NOT qualifying activity: it never extends a conversation's retention deadline.
// Analytics tracking is only active when the store has published widget version AND request is not from the admin preview.
r.post('/:key/session', limiter(60), loadStore, asyncRoute(async (req, res) => {
  const input = pageSchema.parse(req.body);
  const { store } = req;
  const adminOrigin = new URL(config.adminUrl).origin;
  const isAdminPreview = req.headers.origin && req.headers.origin === adminOrigin;
  const isTrackingAllowed = store.publishedVersion != null && !isAdminPreview;

  const { visitor, token, newSession } = await identifyVisitor(store, input.token, { ...input, ip: req.ip, userAgent: req.headers['user-agent'], headers: req.headers });
  // Record page views for analytics (including bot classification for Traffic Quality; business KPIs filter isBot=false)
  const v = isTrackingAllowed
    ? await recordPageView(visitor, input, { newSession, origin: req.headers.origin })
    : visitor;

  if (isTrackingAllowed && !visitor.isBot) {
    await bumpUsage(store.id, 'widgetLoads');
    await prisma.store.update({ where: { id: store.id }, data: { lastWidgetSeenAt: clock.now(), lastWidgetOrigin: hostOf(req.headers.origin) || null } });
  }

  const cfg = await getPublishedConfig(store);
  const conv = await findResumable(store.id, v.id, v.email);
  if (conv && conv.visitorId !== v.id) {
    await prisma.conversation.update({ where: { id: conv.id }, data: { visitorId: v.id } });
    conv.visitorId = v.id;
  }
  const messages = conv ? await messagesAfter(conv.id, Math.max(0, conv.lastSeq - 100), { forVisitor: true }) : [];
  res.json({
    visitorToken: token, // only set when a new identity was issued
    tag: storeTag(store),
    visitor: { id: v.id, name: v.name, email: v.email, attributes: v.attributes || {} },
    // retentionDays: shown to the visitor so they know uploaded files are removed after inactivity.
    config: { ...cfg, retentionDays: store.retentionDays || 30, transcripts: emailConfigured(store), chatLinkId: store.chatLinkId },
    rotatedKey: store.previousKey === req.params.key ? true : undefined,
    availability: await availability(store, cfg),
    conversation: conv ? { id: conv.id, status: conv.status, lastSeq: conv.lastSeq, unreadForVisitor: conv.unreadForVisitor, visitorReadSeq: conv.visitorReadSeq, agentReadSeq: conv.agentReadSeq, messages } : null,
    proactive: await pendingProactive(v, conv),
  });
  if (isTrackingAllowed && !v.isBot) {
    emit('trigger', { storeId: store.id, event: 'page_view', visitorId: v.id, conversationId: conv?.id || null, sourceId: `pv:${randomToken(9)}` });
    toAgents(store.id, 'visitor_page', { visitorId: v.id, url: v.currentUrl });
  }
}));

// SPA / same-session navigation without a full reload.
r.post('/:key/pageview', limiter(120), loadStore, loadVisitor, asyncRoute(async (req, res) => {
  const input = pageSchema.parse(req.body);
  const adminOrigin = new URL(config.adminUrl).origin;
  const isAdminPreview = req.headers.origin && req.headers.origin === adminOrigin;
  const isTrackingAllowed = req.store.publishedVersion != null && !isAdminPreview;

  if (isTrackingAllowed) {
    const newSession = clock.now() - req.visitor.lastSeenAt > SESSION_GAP_MS;
    const v = await recordPageView(req.visitor, input, { newSession, origin: req.headers.origin });
    const conv = await findResumable(req.store.id, v.id);
    emit('trigger', { storeId: req.store.id, event: 'page_view', visitorId: v.id, conversationId: conv?.id || null, sourceId: `pv:${randomToken(9)}` });
    toAgents(req.store.id, 'visitor_page', { visitorId: v.id, url: v.currentUrl, title: v.currentTitle, page: v.lastPageView || null });
  }
  res.json({ ok: true });
}));

r.get('/:key/availability', limiter(60), loadStore, asyncRoute(async (req, res) => {
  res.json(await availability(req.store, await getPublishedConfig(req.store)));
}));

const msgSchema = z.object({
  conversationId: z.string().max(40).optional().nullable(),
  clientMsgId: z.string().min(8).max(64),
  body: z.string().max(5000).default(''),
  attachmentId: z.string().max(40).optional().nullable(),
  proactiveExecutionId: z.string().max(40).optional().nullable(),
  prechat: z.boolean().optional(), // this message carries the pre-chat form details
}).refine((m) => m.body.trim() || m.attachmentId, { message: 'Please type a message' });

r.post('/:key/messages', limiter(30), loadStore, loadVisitor, notBanned, asyncRoute(async (req, res) => {
  const input = msgSchema.parse(req.body);
  let proactive = null;
  if (input.proactiveExecutionId) {
    const exec = await prisma.triggerExecution.findFirst({ where: { id: input.proactiveExecutionId, storeId: req.store.id, visitorId: req.visitor.id, status: 'SUCCEEDED' } });
    proactive = exec?.details?.proactive || null;
  }
  if (input.attachmentId) {
    // Attachment must have been uploaded by this visitor into this store (pending, not yet linked).
    const att = await prisma.attachment.findFirst({ where: { id: input.attachmentId, storeId: req.store.id, conversation: { visitorId: req.visitor.id } } });
    if (!att) throw httpError(400, 'Attachment not found');
  }
  const cfg = input.prechat ? await getPublishedConfig(req.store) : null;
  // Pre-chat: the welcome text becomes the first message of a new chat (unless a trigger message already is).
  if (cfg && !proactive && cfg.messages?.greeting?.trim()) proactive = { body: cfg.messages.greeting.trim(), senderName: cfg.agentName, senderAvatar: cfg.avatarUrl || null, meta: { event: 'welcome' } };
  const { prechat, ...msg } = input;
  const out = await sendVisitorMessage(req.store, req.visitor, { ...msg, body: input.body.trim(), proactive });
  if (cfg && out.created) {
    const wait = (cfg.messages?.afterPrechat ?? DEFAULT_WIDGET_CONFIG.messages.afterPrechat).trim();
    // Skip if a trigger already posted the same text (never show it twice).
    const dup = wait && await prisma.message.findFirst({ where: { conversationId: out.conv.id, senderType: 'BOT', body: wait }, select: { id: true } });
    if (wait && !dup) await sendStaffMessage(req.store.id, out.conv.id, { senderType: 'BOT', senderName: cfg.agentName, senderAvatar: cfg.avatarUrl || null, body: wait, meta: { event: 'after_prechat' } });
  }
  if (input.proactiveExecutionId && proactive && out.created) {
    await prisma.triggerExecution.update({ where: { id: input.proactiveExecutionId }, data: { conversationId: out.conv.id } }).catch(() => {});
  }
  res.status(out.duplicate ? 200 : 201).json({ conversationId: out.conv.id, message: visitorView(out.message), duplicate: out.duplicate, status: out.conv.status });
}));

r.post('/:key/resume', limiter(30), loadStore, loadVisitor, asyncRoute(async (req, res) => {
  const { conversationId } = z.object({ conversationId: z.string().max(40) }).parse(req.body);
  const conv = await resumeConversation(req.store, req.visitor, conversationId);
  if (!conv) return res.status(404).json({ error: 'Conversation no longer exists', code: 'CONVERSATION_GONE' });
  res.json({ id: conv.id, expiresAt: conv.expiresAt });
}));

// Reconnect recovery: everything after the last seq the widget has.
r.get('/:key/conversations/:id/messages', limiter(120), loadStore, loadVisitor, asyncRoute(async (req, res) => {
  const conv = await prisma.conversation.findFirst({ where: { id: req.params.id, storeId: req.store.id, visitorId: req.visitor.id } });
  if (!conv) return res.status(404).json({ error: 'Conversation no longer exists', code: 'CONVERSATION_GONE' });
  const after = Math.max(0, Number(req.query.after) || 0);
  res.json({ status: conv.status, lastSeq: conv.lastSeq, agentReadSeq: conv.agentReadSeq, messages: await messagesAfter(conv.id, after, { forVisitor: true }) });
}));

const contactSchema = z.object({
  name: z.string().trim().max(100).optional(),
  email: z.string().trim().toLowerCase().email('Please enter a valid email').max(200).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional(),
  conversationId: z.string().max(40).optional().nullable(),
});

// Pre-chat form (typed fields from the PUBLISHED config, validated here) or the legacy contact
// shape { name, email, phone } used by the trigger contact form and "Change name".
const legacyContact = z.object({
  name: z.string().trim().max(100).optional(),
  email: z.string().trim().toLowerCase().email().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  conversationId: z.string().max(40).optional().nullable(),
});
const prechatBody = z.object({ values: z.record(z.string().max(40), z.any()), conversationId: z.string().max(40).optional().nullable() });

r.post('/:key/contact', limiter(10), loadStore, loadVisitor, notBanned, asyncRoute(async (req, res) => {
  const visitorData = {};
  const attrs = {};
  let parts = [];
  let input;
  if (req.body && typeof req.body.values === 'object' && req.body.values !== null) {
    input = prechatBody.parse(req.body);
    const cfg = await getPublishedConfig(req.store);
    const fields = cfg.preChatForm?.fields || [];
    for (const f of fields) {
      const v = cleanPrechatValue(f, input.values[f.key]);
      if (v === null) continue;
      if (f.type === 'name') visitorData.name = v;
      else if (f.type === 'email') visitorData.email = v;
      else attrs[f.key] = { label: f.label, type: f.type, value: v };
      parts.push(`${f.label}: ${Array.isArray(v) ? v.join(', ') : v}`);
    }
  } else {
    input = legacyContact.parse(req.body || {});
    if (input.name) visitorData.name = input.name.replace(/[\u0000-\u001f\u007f]/g, '');
    if (input.email) visitorData.email = input.email;
    if (input.phone) attrs.phone = { label: 'Phone', type: 'phone', value: input.phone };
    parts = [input.name && `Name: ${input.name}`, input.email && `Email: ${input.email}`, input.phone && `Phone: ${input.phone}`].filter(Boolean);
  }
  const merged = Object.keys(attrs).length ? { ...(req.visitor.attributes || {}), ...attrs } : undefined;
  const visitor = await prisma.visitor.update({ where: { id: req.visitor.id }, data: { ...visitorData, ...(merged ? { attributes: merged } : {}) } });
  let conv = input.conversationId ? await prisma.conversation.findFirst({ where: { id: input.conversationId, storeId: req.store.id, visitorId: visitor.id } }) : null;
  if (!conv) {
    conv = await findResumable(req.store.id, visitor.id, visitor.email);
    if (conv && conv.visitorId !== visitor.id) {
      await prisma.conversation.update({ where: { id: conv.id }, data: { visitorId: visitor.id } });
      conv.visitorId = visitor.id;
    }
  }
  const isResumed = !input.conversationId && !!conv;
  if (conv && parts.length) {
    const systemText = isResumed
      ? 'Continuing where you left off'
      : `Visitor shared details - ${parts.join(', ')}`;
    await sendStaffMessage(req.store.id, conv.id, { senderType: 'SYSTEM', body: systemText, meta: { event: 'contact', resumed: isResumed } });
  }
  toAgents(req.store.id, 'visitor_updated', { visitorId: visitor.id, name: visitor.name, email: visitor.email, attributes: visitor.attributes || {} });
  res.json({
    ok: true,
    visitor: { id: visitor.id, name: visitor.name, email: visitor.email, attributes: visitor.attributes || {} },
    conversation: conv ? { id: conv.id, status: conv.status, lastSeq: conv.lastSeq } : null,
  });
}));

// The visitor downloads their own conversation as a text file (no email needed). Only their own chat in this store.
r.get('/:key/conversations/:id/transcript', limiter(20), loadStore, loadVisitor, asyncRoute(async (req, res) => {
  const conv = await prisma.conversation.findFirst({ where: { id: req.params.id, storeId: req.store.id, visitorId: req.visitor.id }, include: { visitor: true } });
  if (!conv) throw httpError(404, 'Conversation not found');
  sendTranscript(res, conv, await transcriptText({ conv, store: req.store, forVisitor: true }));
}));

// Email the visitor a copy of their conversation (no internal notes; agents shown as "Customer Support").
// Sent synchronously: success is only reported once the mail server accepted the message.
r.post('/:key/transcript', limiter(3, 15 * 60_000), loadStore, loadVisitor, asyncRoute(async (req, res) => {
  const { email, conversationId } = z.object({ email: z.string().trim().toLowerCase().email('Please enter a valid email').max(200), conversationId: z.string().max(40) }).parse(req.body);
  const conv = await prisma.conversation.findFirst({ where: { id: conversationId, storeId: req.store.id, visitorId: req.visitor.id } });
  if (!conv) throw httpError(404, 'Conversation not found');
  if (!emailConfigured(req.store)) throw httpError(409, 'Email transcripts are not available right now.');
  const cfg = await getPublishedConfig(req.store);
  const rows = await messagesAfter(conv.id, 0, { forVisitor: true, limit: 500 });
  const lines = rows.filter((m) => m.body).map((m) => `[${new Date(m.createdAt).toISOString().slice(0, 16).replace('T', ' ')} UTC] ${m.senderType === 'VISITOR' ? 'You' : m.senderType === 'SYSTEM' ? '-' : m.senderName || cfg.agentName}: ${m.body}`);
  await sendEmailNow(req.store, { to: email, subject: `Your chat transcript - ${cfg.messages?.title || 'Chat'}`, text: `Here is a copy of your conversation.\n\n${lines.join('\n')}\n` });
  res.json({ ok: true });
}));

// The visitor ends the chat: marks it resolved (agents see it); a new message reopens the same chat.
r.post('/:key/conversations/:id/end', limiter(10), loadStore, loadVisitor, asyncRoute(async (req, res) => {
  const conv = await prisma.conversation.findFirst({ where: { id: req.params.id, storeId: req.store.id, visitorId: req.visitor.id } });
  if (!conv) throw httpError(404, 'Conversation not found');
  if (conv.status !== 'RESOLVED') {
    await sendStaffMessage(req.store.id, conv.id, { senderType: 'SYSTEM', body: 'Visitor ended the chat', meta: { event: 'visitor_ended' } });
    await updateConversation(req.store.id, conv.id, { status: 'RESOLVED' }, { visitor: req.visitor.id });
  }
  res.json({ ok: true, status: 'RESOLVED' });
}));

const offlineSchema = z.object({
  name: z.string().trim().min(1, 'Please enter your name').max(100),
  email: z.string().trim().toLowerCase().email('Please enter a valid email').max(200),
  message: z.string().trim().min(1, 'Please type a message').max(5000),
  clientMsgId: z.string().min(8).max(64),
});

r.post('/:key/offline', limiter(5, 15 * 60_000), loadStore, loadVisitor, notBanned, asyncRoute(async (req, res) => {
  const input = offlineSchema.parse(req.body);
  const visitor = await prisma.visitor.update({ where: { id: req.visitor.id }, data: { name: input.name, email: input.email } });
  const out = await sendVisitorMessage(req.store, visitor, { clientMsgId: input.clientMsgId, body: input.message, offline: true });
  if (!out.duplicate) {
    emit('trigger', { storeId: req.store.id, event: 'offline_message', visitorId: visitor.id, conversationId: out.conv.id, sourceId: out.message.id, text: input.message });
    emit('webhook', { storeId: req.store.id, event: 'offline_message.created', data: { conversationId: out.conv.id, name: input.name, email: input.email, message: input.message } });
  }
  res.status(201).json({ conversationId: out.conv.id, message: visitorView(out.message) });
}));

r.post('/:key/uploads', limiter(10, 10 * 60_000), loadStore, loadVisitor, notBanned, express.raw({ type: () => true, limit: '12mb' }), asyncRoute(async (req, res) => {
  if (!(await getPublishedConfig(req.store)).behavior?.fileUpload) throw httpError(403, 'File uploads are turned off for this chat');
  const conv = await findResumable(req.store.id, req.visitor.id);
  if (!conv) throw httpError(400, 'Send a message first, then attach files');
  const att = await saveUpload({ storeId: req.store.id, conversationId: conv.id, filename: req.headers['x-filename'], mime: req.headers['content-type'], buffer: req.body });
  res.status(201).json({ id: att.id, filename: att.filename, mime: att.mime, size: att.size, conversationId: conv.id });
}));

r.get('/:key/files/:id', limiter(120), loadStore, loadVisitor, asyncRoute(async (req, res) => {
  const att = await prisma.attachment.findFirst({ where: { id: req.params.id, storeId: req.store.id, conversation: { visitorId: req.visitor.id } } });
  if (!att) return res.status(404).json({ error: 'File not found' });
  await streamAttachment(att, res);
}));

export default r;

/** Visitor WebSocket events: typing / delivered / read. */
export async function onVisitorEvent(store, visitor, type, data) {
  const conv = data.conversationId ? await prisma.conversation.findFirst({ where: { id: String(data.conversationId), storeId: store.id, visitorId: visitor.id } }) : null;
  if (!conv) return;
  if (type === 'typing') {
    // The draft-text preview is only forwarded when the store allows it.
    // Re-read the store: the socket's copy is from connect time and may predate a newer publish.
    const fresh = await prisma.store.findUnique({ where: { id: store.id } });
    const allowPreview = (await getPublishedConfig(fresh)).behavior?.visitorTypingPreview;
    const preview = allowPreview && typeof data.preview === 'string' ? data.preview.slice(0, 200) : undefined;
    toAgents(store.id, 'typing', { conversationId: conv.id, from: 'visitor', typing: !!data.typing, preview }, conv);
  } else if (type === 'delivered' || type === 'read') {
    const seq = Math.min(Number(data.seq) || 0, conv.lastSeq);
    const field = type === 'read' ? 'visitorReadSeq' : 'visitorDeliveredSeq';
    if (seq <= conv[field]) return;
    const patch = { [field]: seq, ...(type === 'read' ? { unreadForVisitor: 0, ...(seq > conv.visitorDeliveredSeq ? { visitorDeliveredSeq: seq } : {}) } : {}) };
    // Monotonic update (never move backwards under concurrency).
    await prisma.conversation.updateMany({ where: { id: conv.id, [field]: { lt: seq } }, data: patch });
    toAgents(store.id, 'receipt', { conversationId: conv.id, [field]: seq }, conv);
  }
}
