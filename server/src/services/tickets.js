// Tickets: email support threads. Outbound replies go through the durable job queue with one job per
// message (dedupeKey), so retries never create a second email for the same reply. Delivery status is
// recorded on the message - QUEUED until the SMTP server accepts it, FAILED (with the error) after the
// last attempt. Nothing is marked sent without a real SMTP acceptance.
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { prisma, clock } from '../config.js';
import { httpError } from '../lib/util.js';
import { enqueue, registerJob } from './jobs.js';
import { smtpFor, emailConfigured, SMTP_HELP } from './notify.js';
import { readUpload } from './attachments.js';
import { messagesAfter } from './conversations.js';
import { toAgents } from '../realtime.js';

export const ticketEmailReady = (store) => emailConfigured(store);

export function ticketSummary(t) {
  return {
    id: t.id, number: t.number, subject: t.subject, contactName: t.contactName, contactEmail: t.contactEmail, cc: t.cc,
    status: t.status, priority: t.priority, assigneeId: t.assigneeId, tags: t.tags, conversationId: t.conversationId,
    visitorId: t.visitorId, lastMessageAt: t.lastMessageAt, lastMessagePreview: t.lastMessagePreview, closedAt: t.closedAt, createdAt: t.createdAt,
  };
}

const preview = (body) => body.replace(/\s+/g, ' ').trim().slice(0, 140);
const notify = (t, type = 'ticket') => toAgents(t.storeId, type, { ticket: ticketSummary(t) }, t);

/** Plain-text transcript of a chat (no internal notes), kept on the ticket so it outlives chat retention. */
async function transcript(conversationId) {
  const rows = await messagesAfter(conversationId, 0, { forVisitor: true, limit: 500 });
  return rows
    .filter((m) => m.body)
    .map((m) => `[${new Date(m.createdAt).toISOString().slice(0, 16).replace('T', ' ')}] ${m.senderType === 'VISITOR' ? 'Visitor' : m.senderName || m.senderType}: ${m.body}`)
    .join('\n');
}

async function claimAttachments(tx, storeId, userId, ids, ticketId, messageId) {
  if (!ids?.length) return;
  const n = await tx.ticketAttachment.updateMany({
    where: { id: { in: ids }, storeId, uploadedById: userId, ticketId: null },
    data: { ticketId, messageId },
  });
  if (n.count !== ids.length) throw httpError(400, 'Attachment not found');
}

/**
 * Creates a ticket and queues its first email. Safe to retry with the same requestId: the second call
 * returns the existing ticket and queues nothing.
 */
export async function createTicket(store, user, input) {
  const existing = await prisma.ticket.findUnique({ where: { storeId_requestId: { storeId: store.id, requestId: input.requestId } } });
  if (existing) return { ticket: existing, duplicate: true };
  // Refuse up front rather than creating a ticket whose email can never be sent.
  if (!ticketEmailReady(store)) throw httpError(409, SMTP_HELP);

  let conv = null;
  if (input.conversationId) {
    conv = await prisma.conversation.findFirst({ where: { id: input.conversationId, storeId: store.id }, include: { visitor: true } });
    if (!conv) throw httpError(404, 'Conversation not found');
  }
  const snapshot = conv ? await transcript(conv.id) : null;
  const now = clock.now();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const { ticketSeq } = await tx.store.update({ where: { id: store.id }, data: { ticketSeq: { increment: 1 } }, select: { ticketSeq: true } });
      const ticket = await tx.ticket.create({
        data: {
          storeId: store.id, number: ticketSeq, subject: input.subject, contactName: input.contactName || conv?.visitor?.name || null,
          contactEmail: input.contactEmail, cc: input.cc, priority: input.priority, assigneeId: input.assigneeId ?? null, tags: input.tags,
          conversationId: conv?.id || null, visitorId: conv?.visitorId || null, createdById: user.id, requestId: input.requestId,
          status: 'OPEN', lastMessageAt: now, lastMessagePreview: preview(input.body),
        },
      });
      await tx.ticketMessage.create({
        data: { storeId: store.id, ticketId: ticket.id, senderType: 'SYSTEM', senderName: user.name,
          body: conv ? `Ticket created from ${conv.isOffline ? 'an offline message' : 'a chat'} by ${user.name}.${snapshot ? `\n\nOriginal conversation:\n${snapshot}` : ''}` : `Ticket created by ${user.name}.`,
          createdAt: now },
      });
      const msg = await tx.ticketMessage.create({
        data: { storeId: store.id, ticketId: ticket.id, senderType: 'AGENT', senderId: user.id, senderName: user.name, body: input.body, emailStatus: 'QUEUED', createdAt: new Date(now.getTime() + 1) },
      });
      await claimAttachments(tx, store.id, user.id, input.attachmentIds, ticket.id, msg.id);
      await enqueue('ticket_email', { messageId: msg.id }, { storeId: store.id, dedupeKey: `ticket_email:${msg.id}`, maxAttempts: 5, tx });
      return ticket;
    });
    notify(result, 'ticket_created');
    return { ticket: result, duplicate: false };
  } catch (e) {
    // Two concurrent submits with the same requestId: the loser returns the winner's ticket.
    if (e.code === 'P2002') {
      const t = await prisma.ticket.findUnique({ where: { storeId_requestId: { storeId: store.id, requestId: input.requestId } } });
      if (t) return { ticket: t, duplicate: true };
    }
    throw e;
  }
}

/** Agent reply (emailed) or internal note. Replying to a closed ticket reopens it. */
export async function addTicketMessage(store, ticket, user, { body, note, clientMsgId, attachmentIds }) {
  const dup = await prisma.ticketMessage.findUnique({ where: { ticketId_clientMsgId: { ticketId: ticket.id, clientMsgId } } });
  if (dup) return { message: dup, ticket, duplicate: true };
  if (!note && !ticketEmailReady(store)) throw httpError(409, SMTP_HELP);
  const now = clock.now();
  try {
    const out = await prisma.$transaction(async (tx) => {
      const message = await tx.ticketMessage.create({
        data: { storeId: store.id, ticketId: ticket.id, senderType: note ? 'NOTE' : 'AGENT', senderId: user.id, senderName: user.name, body, clientMsgId, emailStatus: note ? 'NONE' : 'QUEUED', createdAt: now },
      });
      await claimAttachments(tx, store.id, user.id, attachmentIds, ticket.id, message.id);
      const data = { lastMessageAt: now, lastMessagePreview: preview(body) };
      if (!note && ticket.status === 'CLOSED') Object.assign(data, { status: 'OPEN', closedAt: null });
      const updated = await tx.ticket.update({ where: { id: ticket.id }, data });
      if (!note) await enqueue('ticket_email', { messageId: message.id }, { storeId: store.id, dedupeKey: `ticket_email:${message.id}`, maxAttempts: 5, tx });
      return { message, ticket: updated };
    });
    toAgents(store.id, 'ticket_message', { ticketId: ticket.id, message: out.message }, out.ticket);
    notify(out.ticket);
    return { ...out, duplicate: false };
  } catch (e) {
    if (e.code === 'P2002') {
      const m = await prisma.ticketMessage.findUnique({ where: { ticketId_clientMsgId: { ticketId: ticket.id, clientMsgId } } });
      if (m) return { message: m, ticket, duplicate: true };
    }
    throw e;
  }
}

/** Status / priority / tags / assignee, each change recorded as a SYSTEM line in the thread. */
export async function updateTicket(ticket, patch, user, memberName = (id) => id) {
  const lines = [];
  const data = {};
  if (patch.status && patch.status !== ticket.status) {
    data.status = patch.status;
    data.closedAt = patch.status === 'CLOSED' ? clock.now() : null;
    lines.push(`Status changed to ${patch.status.toLowerCase()}`);
  }
  if (patch.priority && patch.priority !== ticket.priority) { data.priority = patch.priority; lines.push(`Priority set to ${patch.priority.toLowerCase()}`); }
  if (patch.tags) data.tags = [...new Set(patch.tags)];
  if (patch.assigneeId !== undefined && patch.assigneeId !== ticket.assigneeId) {
    data.assigneeId = patch.assigneeId;
    lines.push(patch.assigneeId ? `Assigned to ${await memberName(patch.assigneeId)}` : 'Unassigned');
  }
  if (!Object.keys(data).length) return ticket;
  const updated = await prisma.$transaction(async (tx) => {
    const t = await tx.ticket.update({ where: { id: ticket.id }, data });
    // App clock (like every other thread entry), not the DB default, so ordering never depends on clock skew.
    const at = clock.now();
    for (const body of lines) await tx.ticketMessage.create({ data: { storeId: t.storeId, ticketId: t.id, senderType: 'SYSTEM', senderId: user.id, senderName: user.name, body: `${body} by ${user.name}`, createdAt: at } });
    return t;
  });
  notify(updated);
  // An agent who lost the ticket must drop it from their list.
  if (ticket.assigneeId && ticket.assigneeId !== updated.assigneeId) toAgents(updated.storeId, 'ticket_removed', { ticketId: updated.id, userId: ticket.assigneeId });
  return updated;
}

/** Re-queues a FAILED email (new job; the message id keeps it a single email thread entry). */
export async function retryTicketEmail(store, message) {
  if (message.emailStatus !== 'FAILED') throw httpError(409, 'Only failed emails can be retried');
  if (!ticketEmailReady(store)) throw httpError(409, 'Email is not set up for this store.');
  await prisma.$transaction(async (tx) => {
    await tx.ticketMessage.update({ where: { id: message.id }, data: { emailStatus: 'QUEUED', emailError: null } });
    await tx.job.updateMany({ where: { dedupeKey: `ticket_email:${message.id}` }, data: { dedupeKey: null } });
    await enqueue('ticket_email', { messageId: message.id }, { storeId: store.id, dedupeKey: `ticket_email:${message.id}`, maxAttempts: 5, tx });
  });
}

const domainOf = (addr) => String(addr || '').split('@')[1] || 'livechat.local';

registerJob('ticket_email', async ({ messageId }, job) => {
  const msg = await prisma.ticketMessage.findUnique({ where: { id: messageId }, include: { ticket: { include: { store: true } }, attachments: true } });
  if (!msg || msg.emailStatus === 'SENT' || msg.emailStatus === 'NONE') return; // idempotent
  const { ticket } = msg;
  const s = smtpFor(ticket.store);
  const fail = async (err) => {
    const final = err.permanent || job.attempts >= job.maxAttempts;
    const updated = await prisma.ticketMessage.update({ where: { id: msg.id }, data: final ? { emailStatus: 'FAILED', emailError: String(err.message).slice(0, 500) } : { emailError: String(err.message).slice(0, 500) } });
    if (final) toAgents(ticket.storeId, 'ticket_message', { ticketId: ticket.id, message: updated }, ticket);
    throw err;
  };
  if (!s) return fail(Object.assign(new Error('SMTP is not configured'), { permanent: true }));

  const from = s.from || s.user;
  const messageIdHeader = msg.emailMessageId || `<ticket-${ticket.id}-${msg.id}.${crypto.randomBytes(4).toString('hex')}@${domainOf(from)}>`;
  const earlier = await prisma.ticketMessage.findMany({ where: { ticketId: ticket.id, emailStatus: 'SENT', NOT: { emailMessageId: null } }, orderBy: { createdAt: 'asc' }, select: { emailMessageId: true } });
  const refs = earlier.map((m) => m.emailMessageId);
  const files = await Promise.all(msg.attachments.map(async (a) => ({ filename: a.filename, contentType: a.mime, content: await readUpload(a.storagePath) })));
  try {
    const t = nodemailer.createTransport({ host: s.host, port: Number(s.port), secure: s.secure !== false && s.secure !== 'false', auth: { user: s.user, pass: s.pass } });
    await t.sendMail({
      from: `"${ticket.store.name.replace(/"/g, '')}" <${from}>`,
      to: ticket.contactName ? `"${ticket.contactName.replace(/"/g, '')}" <${ticket.contactEmail}>` : ticket.contactEmail,
      cc: ticket.cc.length ? ticket.cc.join(', ') : undefined,
      subject: `${refs.length ? 'Re: ' : ''}[#${ticket.number}] ${ticket.subject}`,
      text: msg.body,
      messageId: messageIdHeader,
      ...(refs.length ? { inReplyTo: refs[refs.length - 1], references: refs.join(' ') } : {}),
      attachments: files,
    });
  } catch (e) {
    // Bad recipient / auth errors won't fix themselves; anything else (network, 4xx) is retried.
    // (4xx replies, including a rejected recipient with 451, are temporary and retried with backoff.)
    if ((e.responseCode >= 500 && e.responseCode < 600) || e.code === 'EAUTH') e.permanent = true;
    return fail(e);
  }
  const updated = await prisma.ticketMessage.update({ where: { id: msg.id }, data: { emailStatus: 'SENT', emailError: null, emailMessageId: messageIdHeader, sentAt: clock.now() } });
  toAgents(ticket.storeId, 'ticket_message', { ticketId: ticket.id, message: updated }, ticket);
});

