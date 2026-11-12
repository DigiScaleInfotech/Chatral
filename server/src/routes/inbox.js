import { Router } from 'express';
import express from 'express';
import { z } from 'zod';
import { prisma, clock } from '../config.js';
import { requireAuth, requireStore, RANK } from '../lib/auth.js';
import { asyncRoute, httpError, audit } from '../lib/util.js';
import { sendStaffMessage, updateConversation, convSummary, messagesAfter } from '../services/conversations.js';
import { saveUpload, streamAttachment } from '../services/attachments.js';
import { toAgents, toVisitor, visitorOnline } from '../realtime.js';
import { enqueue } from '../services/jobs.js';
import { transcriptText, sendTranscript } from '../services/transcript.js';
import { findCustomer, shopifyConnected } from '../services/shopify.js';

const r = Router();
r.use(requireAuth);

/** AGENT role: unassigned or own conversations only. SUPERVISOR+: everything in the store. */
const scope = (req) => (RANK[req.storeRole] >= RANK.SUPERVISOR ? {} : { OR: [{ assigneeId: null }, { assigneeId: req.user.id }] });

async function loadConv(req) {
  const conv = await prisma.conversation.findFirst({ where: { id: req.params.id, storeId: req.params.storeId, ...scope(req) }, include: { visitor: true } });
  if (!conv) throw httpError(404, 'Conversation not found');
  return conv;
}

const listSchema = z.object({
  status: z.enum(['OPEN', 'PENDING', 'RESOLVED', 'ALL']).default('OPEN'),
  folder: z.enum(['INBOX', 'TRASH', 'SPAM']).default('INBOX'),
  assignee: z.enum(['me', 'unassigned', 'any']).or(z.string().max(40)).default('any'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  tag: z.string().max(30).optional(),
  q: z.string().trim().max(100).optional(),
  cursor: z.string().max(40).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

r.get('/stores/:storeId/conversations', requireStore('AGENT'), asyncRoute(async (req, res) => {
  const f = listSchema.parse(req.query);
  const where = { storeId: req.params.storeId, folder: f.folder, AND: [scope(req)] };
  if (f.status !== 'ALL') where.status = f.status;
  if (f.assignee === 'me') where.assigneeId = req.user.id;
  else if (f.assignee === 'unassigned') where.assigneeId = null;
  else if (f.assignee !== 'any') where.assigneeId = f.assignee;
  if (f.priority) where.priority = f.priority;
  if (f.tag) where.tags = { has: f.tag.toLowerCase() };
  if (f.q) {
    where.AND.push({ OR: [
      { visitor: { name: { contains: f.q, mode: 'insensitive' } } },
      { visitor: { email: { contains: f.q, mode: 'insensitive' } } },
      { messages: { some: { body: { contains: f.q, mode: 'insensitive' } } } },
      { id: f.q },
    ] });
  }
  const rows = await prisma.conversation.findMany({
    where, include: { visitor: true }, orderBy: [{ lastMessageAt: 'desc' }, { id: 'desc' }], take: f.limit + 1,
    ...(f.cursor ? { cursor: { id: f.cursor }, skip: 1 } : {}),
  });
  const counts = await prisma.conversation.groupBy({ by: ['status'], where: { storeId: req.params.storeId, folder: f.folder, AND: [scope(req)] }, _count: true });
  const folders = await prisma.conversation.groupBy({ by: ['folder'], where: { storeId: req.params.storeId, AND: [scope(req)] }, _count: true });
  const unread = await prisma.conversation.aggregate({ where: { storeId: req.params.storeId, folder: 'INBOX', status: { not: 'RESOLVED' }, unreadForAgent: { gt: 0 }, AND: [scope(req)] }, _count: true });
  res.json({
    items: rows.slice(0, f.limit).map((c) => ({ ...convSummary(c), visitorOnline: visitorOnline(c.visitorId) })),
    nextCursor: rows.length > f.limit ? rows[f.limit - 1].id : null,
    counts: Object.fromEntries(counts.map((c) => [c.status, c._count])),
    folderCounts: Object.fromEntries(folders.map((c) => [c.folder, c._count])),
    unreadConversations: unread._count,
  });
}));

r.get('/stores/:storeId/conversations/:id', requireStore('AGENT'), asyncRoute(async (req, res) => {
  const conv = await loadConv(req);
  const after = Math.max(0, Number(req.query.after) || 0);
  const messages = await messagesAfter(conv.id, after || Math.max(0, conv.lastSeq - 300));
  const attachments = await prisma.attachment.findMany({ where: { conversationId: conv.id }, select: { id: true, filename: true, mime: true, size: true } });
  const visitorHistory = await prisma.conversation.count({ where: { storeId: conv.storeId, visitorId: conv.visitorId } });
  // Pages visited since shortly before this chat began (same store + visitor only).
  const pages = await prisma.visitorPageView.findMany({
    where: { storeId: conv.storeId, visitorId: conv.visitorId, createdAt: { gte: new Date(conv.createdAt.getTime() - 60 * 60_000) } },
    orderBy: { createdAt: 'asc' }, take: 300, select: { id: true, url: true, title: true, createdAt: true },
  });
  const v = conv.visitor;
  // Readable assignee even if they're not in the member list (e.g. removed from the store).
  const assignee = conv.assigneeId ? await prisma.user.findUnique({ where: { id: conv.assigneeId }, select: { id: true, name: true } }) : null;
  res.json({
    assignee: assignee ? { id: assignee.id, name: assignee.name } : null,
    conversation: { ...convSummary(conv), visitorOnline: visitorOnline(conv.visitorId) },
    visitor: { id: v.id, name: v.name, email: v.email, currentUrl: v.currentUrl, currentTitle: v.currentTitle, referrer: v.referrer, device: v.device, visits: v.visits, attributes: v.attributes || {}, bannedAt: v.bannedAt, banReason: v.banReason, firstSeenAt: v.firstSeenAt, lastSeenAt: v.lastSeenAt, sessionPageViews: v.sessionPageViews, conversations: visitorHistory },
    messages, attachments, pages,
  });
}));

const sendSchema = z.object({
  body: z.string().max(5000).default(''),
  clientMsgId: z.string().min(8).max(64),
  note: z.boolean().default(false),
  attachmentId: z.string().max(40).optional().nullable(),
}).refine((m) => m.body.trim() || m.attachmentId, { message: 'Please type a message' });

r.post('/stores/:storeId/conversations/:id/messages', requireStore('AGENT'), asyncRoute(async (req, res) => {
  const conv = await loadConv(req);
  const input = sendSchema.parse(req.body);
  if (input.attachmentId && !(await prisma.attachment.findFirst({ where: { id: input.attachmentId, conversationId: conv.id } }))) throw httpError(400, 'Attachment not found');
  // A store member replying to an unassigned chat takes it. Super admins who are not members of this
  // store don't (they can't be assignees: the assign endpoint only accepts members).
  if (!input.note && !conv.assigneeId && (await prisma.storeMember.findUnique({ where: { userId_storeId: { userId: req.user.id, storeId: conv.storeId } } }))) {
    await updateConversation(conv.storeId, conv.id, { assigneeId: req.user.id }, { user: req.user.id });
  }
  const out = await sendStaffMessage(conv.storeId, conv.id, {
    senderType: input.note ? 'NOTE' : 'AGENT', senderId: req.user.id, senderName: req.user.name, senderAvatar: req.user.avatarUrl,
    body: input.body.trim(), clientMsgId: input.clientMsgId, attachmentId: input.attachmentId,
  });
  res.status(out.duplicate ? 200 : 201).json({ message: out.message, duplicate: out.duplicate });
}));

const patchSchema = z.object({
  status: z.enum(['OPEN', 'PENDING', 'RESOLVED']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(20),
  assigneeId: z.string().max(40).nullable(),
}).partial();

r.patch('/stores/:storeId/conversations/:id', requireStore('AGENT'), asyncRoute(async (req, res) => {
  const conv = await loadConv(req);
  const input = patchSchema.parse(req.body);
  if (input.assigneeId !== undefined && input.assigneeId !== conv.assigneeId) {
    const self = input.assigneeId === req.user.id || (input.assigneeId === null && conv.assigneeId === req.user.id);
    if (!self && RANK[req.storeRole] < RANK.SUPERVISOR) throw httpError(403, 'Only supervisors can assign chats to other agents');
    if (input.assigneeId && !(await prisma.storeMember.findUnique({ where: { userId_storeId: { userId: input.assigneeId, storeId: conv.storeId } } }))) throw httpError(400, 'That person is not a member of this store');
  }
  if (input.tags) input.tags = [...new Set(input.tags)];
  const updated = await updateConversation(conv.storeId, conv.id, input, { user: req.user.id });
  res.json(convSummary(updated));
}));

r.post('/stores/:storeId/conversations/:id/read', requireStore('AGENT'), asyncRoute(async (req, res) => {
  const conv = await loadConv(req);
  await prisma.conversation.update({ where: { id: conv.id }, data: { unreadForAgent: 0, agentReadSeq: conv.lastSeq } });
  toAgents(conv.storeId, 'conversation', { conversation: { ...convSummary(conv), unreadForAgent: 0, agentReadSeq: conv.lastSeq } }, conv);
  // Visitor sees "Seen" on their messages.
  toVisitor(conv.visitorId, 'receipt', { conversationId: conv.id, agentReadSeq: conv.lastSeq });
  res.json({ ok: true });
}));

// Staff download a chat as text (internal notes included and marked). Same visibility as opening the chat.
r.get('/stores/:storeId/conversations/:id/transcript', requireStore('AGENT'), asyncRoute(async (req, res) => {
  const conv = await loadConv(req);
  const store = await prisma.store.findUnique({ where: { id: conv.storeId } });
  await audit(req, 'conversation.transcript_downloaded', { storeId: conv.storeId, target: conv.id });
  sendTranscript(res, conv, await transcriptText({ conv, store, forVisitor: false }));
}));

r.delete('/stores/:storeId/conversations/:id', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const conv = await loadConv(req);
  if (conv.folder === 'INBOX') throw httpError(409, 'Move the chat to Trash or Spam before deleting it permanently');
  const files = await prisma.attachment.findMany({ where: { conversationId: conv.id }, select: { storagePath: true } });
  await prisma.$transaction(async (tx) => {
    for (const f of files) await enqueue('delete_file', { storagePath: f.storagePath }, { storeId: conv.storeId, tx });
    await tx.conversation.delete({ where: { id: conv.id } });
  });
  toAgents(conv.storeId, 'conversations_deleted', { ids: [conv.id] });
  await audit(req, 'conversation.deleted', { storeId: conv.storeId, target: conv.id });
  res.json({ ok: true });
}));

const bulkSchema = z.object({
  ids: z.array(z.string().max(40)).min(1).max(100),
  action: z.enum(['assign', 'status', 'folder', 'delete']),
  assigneeId: z.string().max(40).nullable().optional(),
  status: z.enum(['OPEN', 'PENDING', 'RESOLVED']).optional(),
  folder: z.enum(['INBOX', 'TRASH', 'SPAM']).optional(),
}).refine((b) => b.action === 'delete' || (b.action === 'assign' ? b.assigneeId !== undefined : b.action === 'status' ? !!b.status : !!b.folder), { message: 'Choose a value for this action' });

/**
 * One action on many chats. Chats the caller can't see are skipped (reported, not touched).
 * Moving to Trash/Spam (or restoring) needs SUPERVISOR+; assignment follows the single-chat rules.
 */
r.post('/stores/:storeId/conversations/bulk', requireStore('AGENT'), asyncRoute(async (req, res) => {
  const b = bulkSchema.parse(req.body);
  const storeId = req.params.storeId;
  if (b.action === 'delete' && RANK[req.storeRole] < RANK.ADMIN) throw httpError(403, 'Only admins can delete chats permanently');
  if (b.action === 'folder' && RANK[req.storeRole] < RANK.SUPERVISOR) throw httpError(403, 'Only supervisors can move chats to Trash or Spam');
  if (b.action === 'assign' && b.assigneeId) {
    if (b.assigneeId !== req.user.id && RANK[req.storeRole] < RANK.SUPERVISOR) throw httpError(403, 'Only supervisors can assign chats to other agents');
    if (!(await prisma.storeMember.findUnique({ where: { userId_storeId: { userId: b.assigneeId, storeId } } }))) throw httpError(400, 'That person is not a member of this store');
  }
  const rows = await prisma.conversation.findMany({ where: { id: { in: b.ids }, storeId, AND: [scope(req)] } });
  const done = [];
  if (b.action === 'delete') {
    // Permanent delete, like the single-chat delete: only chats already in Trash or Spam, with their files.
    const ids = rows.filter((c) => c.folder !== 'INBOX').map((c) => c.id);
    if (ids.length) {
      const files = await prisma.attachment.findMany({ where: { conversationId: { in: ids } }, select: { storagePath: true } });
      await prisma.$transaction(async (tx) => {
        for (const f of files) await enqueue('delete_file', { storagePath: f.storagePath }, { storeId, tx });
        await tx.conversation.deleteMany({ where: { id: { in: ids }, storeId } });
      });
      toAgents(storeId, 'conversations_deleted', { ids });
    }
    done.push(...ids);
  } else if (b.action === 'folder') {
    const ids = rows.filter((c) => c.folder !== b.folder).map((c) => c.id);
    if (ids.length) await prisma.conversation.updateMany({ where: { id: { in: ids }, storeId }, data: { folder: b.folder, folderChangedAt: clock.now() } });
    done.push(...ids);
    if (ids.length) toAgents(storeId, 'conversations_moved', { ids, folder: b.folder });
  } else {
    for (const c of rows) {
      if (b.action === 'assign') {
        // An agent may only unassign chats that are theirs.
        if (b.assigneeId === null && c.assigneeId && c.assigneeId !== req.user.id && RANK[req.storeRole] < RANK.SUPERVISOR) continue;
        if (c.assigneeId === b.assigneeId) continue;
        await updateConversation(storeId, c.id, { assigneeId: b.assigneeId }, { user: req.user.id });
      } else {
        if (c.status === b.status) continue;
        await updateConversation(storeId, c.id, { status: b.status }, { user: req.user.id });
      }
      done.push(c.id);
    }
  }
  await audit(req, `conversation.bulk_${b.action}`, { storeId, meta: { count: done.length, ids: done, value: b.assigneeId ?? b.status ?? b.folder } });
  res.json({ updated: done, skipped: b.ids.filter((id) => !rows.some((c) => c.id === id)) });
}));

const banSchema = z.object({ reason: z.string().trim().max(200).optional().nullable() });

/** Ban: the visitor can still browse but every send endpoint returns 403 (see widget routes). */
r.post('/stores/:storeId/visitors/:visitorId/ban', requireStore('SUPERVISOR'), asyncRoute(async (req, res) => {
  const { reason } = banSchema.parse(req.body || {});
  const v = await prisma.visitor.findFirst({ where: { id: req.params.visitorId, storeId: req.params.storeId } });
  if (!v) throw httpError(404, 'Visitor not found');
  const updated = await prisma.visitor.update({ where: { id: v.id }, data: { bannedAt: v.bannedAt || clock.now(), bannedById: req.user.id, banReason: reason || null } });
  toAgents(v.storeId, 'visitor_banned', { visitorId: v.id, bannedAt: updated.bannedAt, banReason: updated.banReason });
  await audit(req, 'visitor.banned', { storeId: v.storeId, target: v.id, meta: { reason: reason || null } });
  res.json({ visitorId: v.id, bannedAt: updated.bannedAt, banReason: updated.banReason });
}));

r.delete('/stores/:storeId/visitors/:visitorId/ban', requireStore('SUPERVISOR'), asyncRoute(async (req, res) => {
  const v = await prisma.visitor.findFirst({ where: { id: req.params.visitorId, storeId: req.params.storeId } });
  if (!v) throw httpError(404, 'Visitor not found');
  await prisma.visitor.update({ where: { id: v.id }, data: { bannedAt: null, bannedById: null, banReason: null } });
  toAgents(v.storeId, 'visitor_banned', { visitorId: v.id, bannedAt: null, banReason: null });
  await audit(req, 'visitor.unbanned', { storeId: v.storeId, target: v.id });
  res.json({ visitorId: v.id, bannedAt: null });
}));

r.post('/stores/:storeId/conversations/:id/uploads', requireStore('AGENT'), express.raw({ type: () => true, limit: '12mb' }), asyncRoute(async (req, res) => {
  const conv = await loadConv(req);
  const att = await saveUpload({ storeId: conv.storeId, conversationId: conv.id, filename: req.headers['x-filename'], mime: req.headers['content-type'], buffer: req.body });
  res.status(201).json({ id: att.id, filename: att.filename, mime: att.mime, size: att.size });
}));

r.get('/stores/:storeId/files/:fileId', requireStore('AGENT'), asyncRoute(async (req, res) => {
  const att = await prisma.attachment.findFirst({ where: { id: req.params.fileId, storeId: req.params.storeId } });
  if (!att) throw httpError(404, 'File not found');
  req.params.id = att.conversationId;
  await loadConv(req); // same visibility rules as the conversation
  await streamAttachment(att, res);
}));

// Visitor monitoring: visitors seen within the window (5/10/30/60 min). `online` = widget connected now.
// Their current (non-resolved, unexpired) chat is included only when the caller may open it.
r.get('/stores/:storeId/visitors/live', requireStore('AGENT'), asyncRoute(async (req, res) => {
  // Window in minutes: 5 min … 30 days, or 0 = any time.
  const { minutes } = z.object({ minutes: z.coerce.number().refine((m) => [5, 10, 30, 60, 1440, 10080, 43200, 0].includes(m), 'choose a listed time window').default(10) }).parse(req.query);
  const storeId = req.params.storeId;
  const since = minutes ? new Date(clock.now().getTime() - minutes * 60_000) : new Date(0);
  // Only visitors who filled the form (name/email) or started a chat; people who just browse aren't listed.
  const engaged = { OR: [{ name: { not: null } }, { email: { not: null } }, { conversations: { some: {} } }] };
  const rows = await prisma.visitor.findMany({ where: { storeId, lastSeenAt: { gte: since }, ...engaged }, orderBy: { lastSeenAt: 'desc' }, take: 1000 });
  const ids = rows.map((v) => v.id);
  const [open, totals] = await Promise.all([
    prisma.conversation.findMany({
      where: { storeId, visitorId: { in: ids }, folder: 'INBOX', status: { not: 'RESOLVED' }, expiresAt: { gt: clock.now() }, AND: [scope(req)] },
      orderBy: { lastMessageAt: 'desc' },
      select: { id: true, visitorId: true, status: true, assigneeId: true, unreadForAgent: true, lastMessageAt: true },
    }),
    prisma.conversation.groupBy({ by: ['visitorId'], where: { storeId, visitorId: { in: ids } }, _count: true }),
  ]);
  res.json(rows.map((v) => ({
    id: v.id, name: v.name, email: v.email, currentUrl: v.currentUrl, currentTitle: v.currentTitle, referrer: v.referrer, device: v.device, country: v.country, city: v.city,
    visits: v.visits, sessionStartedAt: v.sessionStartedAt, sessionPageViews: v.sessionPageViews, lastSeenAt: v.lastSeenAt,
    online: visitorOnline(v.id),
    chats: totals.find((t) => t.visitorId === v.id)?._count || 0,
    conversation: open.find((c) => c.visitorId === v.id) || null,
  })));
}));

// Shopify customer + last order for a chat's visitor (or another email). Same visibility as the chat.
r.get('/stores/:storeId/conversations/:id/shopify', requireStore('AGENT'), asyncRoute(async (req, res) => {
  const conv = await loadConv(req);
  const store = await prisma.store.findUnique({ where: { id: conv.storeId } });
  if (!shopifyConnected(store)) return res.json({ connected: false });
  const email = String(req.query.email || conv.visitor.email || '').trim();
  if (!email) return res.json({ connected: true, email: null, customer: null });
  res.json({ connected: true, email, customer: await findCustomer(store, email) });
}));

export default r;
