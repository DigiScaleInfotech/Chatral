import { Router } from 'express';
import express from 'express';
import { z } from 'zod';
import { prisma } from '../config.js';
import { requireAuth, requireStore, RANK } from '../lib/auth.js';
import { asyncRoute, httpError, audit } from '../lib/util.js';
import { writeUpload, streamAttachment } from '../services/attachments.js';
import { createTicket, addTicketMessage, updateTicket, retryTicketEmail, ticketSummary, ticketEmailReady } from '../services/tickets.js';

const r = Router();
r.use(requireAuth);

// Same visibility as chats: AGENT sees unassigned + own tickets, SUPERVISOR+ sees all.
const scope = (req) => (RANK[req.storeRole] >= RANK.SUPERVISOR ? {} : { OR: [{ assigneeId: null }, { assigneeId: req.user.id }] });
const isSupervisor = (req) => RANK[req.storeRole] >= RANK.SUPERVISOR;

async function loadTicket(req, id = req.params.id) {
  const t = await prisma.ticket.findFirst({ where: { id, storeId: req.params.storeId, ...scope(req) } });
  if (!t) throw httpError(404, 'Ticket not found');
  return t;
}
const loadStore = (id) => prisma.store.findUnique({ where: { id } });

async function checkAssignee(req, current, next) {
  if (next === undefined || next === current) return;
  const self = next === req.user.id || (next === null && current === req.user.id);
  if (!self && !isSupervisor(req)) throw httpError(403, 'Only supervisors can assign tickets to other agents');
  if (next && !(await prisma.storeMember.findUnique({ where: { userId_storeId: { userId: next, storeId: req.params.storeId } } }))) throw httpError(400, 'That person is not a member of this store');
}

const memberName = async (id) => (await prisma.user.findUnique({ where: { id }, select: { name: true } }))?.name || 'someone';

const email = z.string().trim().toLowerCase().email('Please enter a valid email address').max(200);
const tags = z.array(z.string().trim().toLowerCase().min(1).max(30)).max(20);
const priority = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);
const status = z.enum(['OPEN', 'PENDING', 'CLOSED']);
const fileIds = z.array(z.string().max(40)).max(10).default([]);

const listSchema = z.object({
  status: z.enum(['OPEN', 'PENDING', 'CLOSED', 'ALL']).default('OPEN'),
  assignee: z.enum(['me', 'unassigned', 'any']).or(z.string().max(40)).default('any'),
  priority: priority.optional(),
  tag: z.string().max(30).optional(),
  q: z.string().trim().max(100).optional(),
  conversationId: z.string().max(40).optional(),
  cursor: z.string().max(40).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

r.get('/stores/:storeId/tickets', requireStore('AGENT'), asyncRoute(async (req, res) => {
  const f = listSchema.parse(req.query);
  const storeId = req.params.storeId;
  const where = { storeId, AND: [scope(req)] };
  if (f.status !== 'ALL') where.status = f.status;
  if (f.assignee === 'me') where.assigneeId = req.user.id;
  else if (f.assignee === 'unassigned') where.assigneeId = null;
  else if (f.assignee !== 'any') where.assigneeId = f.assignee;
  if (f.priority) where.priority = f.priority;
  if (f.tag) where.tags = { has: f.tag.toLowerCase() };
  if (f.conversationId) where.conversationId = f.conversationId;
  if (f.q) {
    const num = /^#?(\d{1,9})$/.exec(f.q);
    where.AND.push({ OR: [
      { subject: { contains: f.q, mode: 'insensitive' } },
      { contactEmail: { contains: f.q, mode: 'insensitive' } },
      { contactName: { contains: f.q, mode: 'insensitive' } },
      { messages: { some: { body: { contains: f.q, mode: 'insensitive' }, senderType: { not: 'SYSTEM' } } } },
      ...(num ? [{ number: Number(num[1]) }] : []),
    ] });
  }
  const rows = await prisma.ticket.findMany({
    where, orderBy: [{ lastMessageAt: 'desc' }, { id: 'desc' }], take: f.limit + 1,
    ...(f.cursor ? { cursor: { id: f.cursor }, skip: 1 } : {}),
  });
  const counts = await prisma.ticket.groupBy({ by: ['status'], where: { storeId, AND: [scope(req)] }, _count: true });
  res.json({
    items: rows.slice(0, f.limit).map(ticketSummary),
    nextCursor: rows.length > f.limit ? rows[f.limit - 1].id : null,
    counts: Object.fromEntries(counts.map((c) => [c.status, c._count])),
    emailReady: ticketEmailReady(await loadStore(storeId)),
  });
}));

r.get('/stores/:storeId/tickets/:id', requireStore('AGENT'), asyncRoute(async (req, res) => {
  const t = await loadTicket(req);
  const [messages, attachments] = await Promise.all([
    prisma.ticketMessage.findMany({ where: { ticketId: t.id }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    prisma.ticketAttachment.findMany({ where: { ticketId: t.id }, select: { id: true, messageId: true, filename: true, mime: true, size: true } }),
  ]);
  res.json({ ticket: ticketSummary(t), messages, attachments, emailReady: ticketEmailReady(await loadStore(t.storeId)) });
}));

const createSchema = z.object({
  requestId: z.string().min(8).max(64),
  contactName: z.string().trim().max(100).optional().nullable(),
  contactEmail: email,
  cc: z.array(email).max(10).default([]),
  subject: z.string().trim().min(1, 'Please enter a subject').max(200),
  body: z.string().trim().min(1, 'Please write a message').max(10000),
  priority: priority.default('NORMAL'),
  tags: tags.default([]),
  assigneeId: z.string().max(40).optional().nullable(),
  conversationId: z.string().max(40).optional().nullable(),
  attachmentIds: fileIds,
});

r.post('/stores/:storeId/tickets', requireStore('AGENT'), asyncRoute(async (req, res) => {
  const input = createSchema.parse(req.body);
  input.tags = [...new Set(input.tags)];
  input.cc = [...new Set(input.cc)].filter((c) => c !== input.contactEmail);
  await checkAssignee(req, null, input.assigneeId ?? undefined);
  if (input.conversationId) {
    // The agent must be allowed to see the chat they are turning into a ticket.
    const conv = await prisma.conversation.findFirst({ where: { id: input.conversationId, storeId: req.params.storeId, ...scope(req) } });
    if (!conv) throw httpError(404, 'Conversation not found');
  }
  const out = await createTicket(await loadStore(req.params.storeId), req.user, input);
  if (!out.duplicate) await audit(req, 'ticket.created', { storeId: req.params.storeId, target: out.ticket.id, meta: { number: out.ticket.number, fromConversation: input.conversationId || null } });
  res.status(out.duplicate ? 200 : 201).json({ ticket: ticketSummary(out.ticket), duplicate: out.duplicate });
}));

const msgSchema = z.object({
  body: z.string().trim().min(1, 'Please write a message').max(10000),
  note: z.boolean().default(false),
  clientMsgId: z.string().min(8).max(64),
  attachmentIds: fileIds,
});

r.post('/stores/:storeId/tickets/:id/messages', requireStore('AGENT'), asyncRoute(async (req, res) => {
  const t = await loadTicket(req);
  const input = msgSchema.parse(req.body);
  if (input.note && input.attachmentIds.length) throw httpError(400, 'Attachments can only be sent with a reply');
  const out = await addTicketMessage(await loadStore(t.storeId), t, req.user, input);
  res.status(out.duplicate ? 200 : 201).json({ message: out.message, ticket: ticketSummary(out.ticket), duplicate: out.duplicate });
}));

r.post('/stores/:storeId/tickets/:id/messages/:messageId/retry', requireStore('AGENT'), asyncRoute(async (req, res) => {
  const t = await loadTicket(req);
  const m = await prisma.ticketMessage.findFirst({ where: { id: req.params.messageId, ticketId: t.id } });
  if (!m) throw httpError(404, 'Message not found');
  await retryTicketEmail(await loadStore(t.storeId), m);
  await audit(req, 'ticket.email_retried', { storeId: t.storeId, target: m.id });
  res.json({ ok: true });
}));

const patchSchema = z.object({ status, priority, tags, assigneeId: z.string().max(40).nullable() }).partial();

r.patch('/stores/:storeId/tickets/:id', requireStore('AGENT'), asyncRoute(async (req, res) => {
  const t = await loadTicket(req);
  const input = patchSchema.parse(req.body);
  await checkAssignee(req, t.assigneeId, input.assigneeId);
  const updated = await updateTicket(t, input, req.user, memberName);
  if (input.status && input.status !== t.status) await audit(req, 'ticket.status', { storeId: t.storeId, target: t.id, meta: { from: t.status, to: input.status } });
  res.json(ticketSummary(updated));
}));

const bulkSchema = z.object({
  ids: z.array(z.string().max(40)).min(1).max(100),
  patch: z.object({ status, priority, assigneeId: z.string().max(40).nullable() }).partial()
    .refine((p) => Object.keys(p).length > 0, 'Choose a change to apply'),
});

/** Applies one change to many tickets; tickets the caller can't see are reported, not touched. */
r.post('/stores/:storeId/tickets/bulk', requireStore('AGENT'), asyncRoute(async (req, res) => {
  const { ids, patch } = bulkSchema.parse(req.body);
  const rows = await prisma.ticket.findMany({ where: { id: { in: ids }, storeId: req.params.storeId, ...scope(req) } });
  const updated = [];
  for (const t of rows) {
    await checkAssignee(req, t.assigneeId, patch.assigneeId);
    updated.push(ticketSummary(await updateTicket(t, patch, req.user, memberName)));
  }
  await audit(req, 'ticket.bulk_update', { storeId: req.params.storeId, meta: { count: updated.length, patch } });
  res.json({ updated, skipped: ids.filter((id) => !rows.some((t) => t.id === id)) });
}));

r.post('/stores/:storeId/tickets/uploads', requireStore('AGENT'), express.raw({ type: () => true, limit: '12mb' }), asyncRoute(async (req, res) => {
  const file = await writeUpload({ storeId: req.params.storeId, filename: req.headers['x-filename'], mime: req.headers['content-type'], buffer: req.body });
  const att = await prisma.ticketAttachment.create({ data: { storeId: req.params.storeId, uploadedById: req.user.id, ...file } });
  res.status(201).json({ id: att.id, filename: att.filename, mime: att.mime, size: att.size });
}));

r.get('/stores/:storeId/ticket-files/:fileId', requireStore('AGENT'), asyncRoute(async (req, res) => {
  const att = await prisma.ticketAttachment.findFirst({ where: { id: req.params.fileId, storeId: req.params.storeId } });
  if (!att) throw httpError(404, 'File not found');
  if (att.ticketId) await loadTicket(req, att.ticketId);
  else if (att.uploadedById !== req.user.id) throw httpError(404, 'File not found');
  await streamAttachment(att, res);
}));

export default r;
