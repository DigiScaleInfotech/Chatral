import { prisma, clock, DAY_MS } from '../config.js';
import { httpError } from '../lib/util.js';
import { toAgents, toVisitor } from '../realtime.js';
import { emit } from './events.js';
import { enqueue } from './jobs.js';

export const deadline = (store, at) => new Date(at.getTime() + (store.retentionDays || 30) * DAY_MS);

/** Name customers see for every agent reply (typed or saved reply); agents' real names stay internal. */
export const AGENT_PUBLIC_NAME = 'Customer Support';

/** What the visitor may see: no internal notes, no agent ids or names. */
export const visitorView = (m) => ({
  id: m.id, seq: m.seq, conversationId: m.conversationId, senderType: m.senderType,
  senderName: m.senderType === 'AGENT' ? AGENT_PUBLIC_NAME : m.senderName,
  senderAvatar: m.senderType === 'AGENT' ? null : m.senderAvatar, body: m.body, meta: m.meta, clientMsgId: m.senderType === 'VISITOR' ? m.clientMsgId : null,
  attachmentId: m.attachmentId, createdAt: m.createdAt,
});

export const convSummary = (c) => ({
  id: c.id, storeId: c.storeId, visitorId: c.visitorId, status: c.status, priority: c.priority, assigneeId: c.assigneeId, tags: c.tags,
  isOffline: c.isOffline, folder: c.folder, lastSeq: c.lastSeq, lastMessageAt: c.lastMessageAt, lastMessagePreview: c.lastMessagePreview,
  unreadForAgent: c.unreadForAgent, unreadForVisitor: c.unreadForVisitor, visitorDeliveredSeq: c.visitorDeliveredSeq,
  visitorReadSeq: c.visitorReadSeq, agentReadSeq: c.agentReadSeq, expiresAt: c.expiresAt, lastActivityAt: c.lastActivityAt,
  createdAt: c.createdAt, resolvedAt: c.resolvedAt, firstResponseAt: c.firstResponseAt,
  visitor: c.visitor ? { id: c.visitor.id, name: c.visitor.name, email: c.visitor.email, currentUrl: c.visitor.currentUrl, device: c.visitor.device } : undefined,
});

const preview = (s) => String(s || '').replace(/\s+/g, ' ').slice(0, 140);

/** Latest conversation of this visitor that has not expired (eligible to resume). Can search by visitorId or visitor email. */
export function findResumable(storeId, visitorId, email = null, tx = prisma) {
  // Any folder: a returning visitor always continues their previous chat (Trash → back to Inbox, Spam stays Spam).
  const normalizedEmail = typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null;
  const where = normalizedEmail
    ? {
        storeId,
        expiresAt: { gt: clock.now() },
        OR: [
          { visitorId },
          { visitor: { email: { equals: normalizedEmail, mode: 'insensitive' } } },
        ],
      }
    : { storeId, visitorId, expiresAt: { gt: clock.now() } };

  return tx.conversation.findFirst({
    where,
    orderBy: { lastActivityAt: 'desc' },
  });
}

/** Row lock (waits for a concurrent cleanup/send on the same conversation). Returns null if gone/expired. */
async function lockConversation(tx, id, storeId) {
  const rows = await tx.$queryRaw`SELECT id FROM "Conversation" WHERE id = ${id} AND "storeId" = ${storeId} FOR UPDATE`;
  if (!rows.length) return null;
  const conv = await tx.conversation.findUnique({ where: { id } });
  return conv && conv.expiresAt > clock.now() ? conv : null;
}

/** Serialises all writes for one visitor so two first-messages can't create two conversations. */
const lockVisitor = (tx, visitorId) => tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'v:' + visitorId}))`;

/**
 * Visitor message. Persisted before we acknowledge. Idempotent on clientMsgId.
 * Resumes the eligible conversation (same id + history) or creates one; a qualifying visitor
 * message is the ONLY thing besides explicit resume that moves lastActivityAt/expiresAt.
 */
export async function sendVisitorMessage(store, visitor, { conversationId, clientMsgId, body, attachmentId = null, proactive = null, offline = false, meta = null }) {
  const now = clock.now();
  const result = await prisma.$transaction(async (tx) => {
    await lockVisitor(tx, visitor.id);
    let conv = null;
    if (conversationId) {
      conv = await lockConversation(tx, conversationId, store.id);
      if (conv && conv.visitorId !== visitor.id) {
        // If the conversation belongs to another visitor record with the same email, allow resuming it
        const otherVisitor = await tx.visitor.findUnique({ where: { id: conv.visitorId }, select: { email: true } });
        const sameEmail = visitor.email && otherVisitor?.email && visitor.email.trim().toLowerCase() === otherVisitor.email.trim().toLowerCase();
        if (sameEmail) {
          // Re-link conversation to current active visitor session
          await tx.conversation.update({ where: { id: conv.id }, data: { visitorId: visitor.id } });
          conv.visitorId = visitor.id;
        } else {
          conv = null;
        }
      }
    }
    if (!conv) {
      const r = await findResumable(store.id, visitor.id, visitor.email, tx);
      if (r) {
        conv = await lockConversation(tx, r.id, store.id);
        if (conv && conv.visitorId !== visitor.id) {
          // Update conversation's visitorId so it matches current active visitor token/session
          await tx.conversation.update({ where: { id: conv.id }, data: { visitorId: visitor.id } });
          conv.visitorId = visitor.id;
        }
      }
    }
    if (conv && clientMsgId) {
      const dup = await tx.message.findUnique({ where: { conversationId_clientMsgId: { conversationId: conv.id, clientMsgId } } });
      if (dup) return { conv, message: dup, duplicate: true };
    }
    let created = false;
    let reopened = false;
    if (!conv) {
      conv = await tx.conversation.create({
        data: { storeId: store.id, visitorId: visitor.id, isOffline: offline, createdAt: now, lastActivityAt: now, expiresAt: deadline(store, now), lastMessageAt: now },
      });
      created = true;
      // Proactive trigger message shown before the chat existed becomes the first message.
      if (proactive) {
        conv = await tx.conversation.update({ where: { id: conv.id }, data: { lastSeq: 1 } });
        await tx.message.create({ data: { storeId: store.id, conversationId: conv.id, seq: 1, senderType: 'BOT', senderName: proactive.senderName, senderAvatar: proactive.senderAvatar, body: proactive.body, triggerId: proactive.triggerId, meta: proactive.meta ?? undefined, createdAt: new Date(now.getTime() - 1) } });
      }
    } else if (conv.status === 'RESOLVED') reopened = true;
    // A visitor writing into a chat an agent put in Trash brings it back to the Inbox.
    const restored = !created && conv.folder === 'TRASH';

    const seq = conv.lastSeq + 1;
    const message = await tx.message.create({
      data: { storeId: store.id, conversationId: conv.id, seq, senderType: 'VISITOR', senderId: visitor.id, senderName: visitor.name || 'Visitor', body, clientMsgId, attachmentId, meta: meta ?? undefined, createdAt: now },
    });
    conv = await tx.conversation.update({
      where: { id: conv.id },
      data: {
        lastSeq: seq, lastActivityAt: now, expiresAt: deadline(store, now), lastMessageAt: now, lastMessagePreview: preview(body || 'Attachment'),
        lastVisitorMessageAt: now, unreadForAgent: { increment: 1 },
        ...(reopened ? { status: 'OPEN', resolvedAt: null } : {}),
        ...(offline ? { isOffline: true } : {}),
        ...(restored ? { folder: 'INBOX', folderChangedAt: now } : {}),
      },
      include: { visitor: true },
    });
    return { conv, message, created, reopened, restored, duplicate: false };
  });

  if (!result.duplicate) {
    const fullConv = result.conv.visitor ? result.conv : await prisma.conversation.findUnique({ where: { id: result.conv.id }, include: { visitor: true } });
    // isNewConversation: this message created the conversation (first chat message or offline-form
    // submission). Lets dashboards classify it without guessing from timestamps. Additive field.
    toAgents(store.id, 'message', { conversation: convSummary(fullConv), message: result.message, isNewConversation: !!result.created, isOffline: !!offline }, fullConv);
    if (fullConv.folder !== 'SPAM') enqueue('push_message', { conversationId: fullConv.id, messageId: result.message.id, isNew: !!result.created }, { storeId: store.id, dedupeKey: `push:${result.message.id}` }).catch((e) => console.error('push enqueue', e));
    toVisitor(visitor.id, 'message', { message: visitorView(result.message) });
    if (result.restored) toAgents(store.id, 'conversations_moved', { ids: [fullConv.id], folder: 'INBOX' });
    // Spam: the message is stored and visible in Spam, but runs no triggers, webhooks or alerts.
    if (fullConv.folder === 'SPAM') return result;
    if (result.created) emit('conversation.created', { store, conversation: fullConv, offline });
    if (result.created || result.reopened) emit('trigger', { storeId: store.id, event: 'chat_requested', visitorId: visitor.id, conversationId: fullConv.id, sourceId: result.message.id });
    emit('trigger', { storeId: store.id, event: 'visitor_message', visitorId: visitor.id, conversationId: fullConv.id, sourceId: result.message.id, text: body });
    emit('webhook', { storeId: store.id, event: result.created ? 'conversation.created' : 'message.created', data: { conversationId: fullConv.id, messageId: result.message.id, senderType: 'VISITOR', body } });
  }
  return result;
}

/** Explicit resumption by the visitor (re-opening the chat window on an existing conversation). */
export async function resumeConversation(store, visitor, conversationId) {
  const now = clock.now();
  return prisma.$transaction(async (tx) => {
    await lockVisitor(tx, visitor.id);
    const conv = await lockConversation(tx, conversationId, store.id);
    if (!conv) return null;
    if (conv.visitorId !== visitor.id) {
      const otherVisitor = await tx.visitor.findUnique({ where: { id: conv.visitorId }, select: { email: true } });
      const sameEmail = visitor.email && otherVisitor?.email && visitor.email.trim().toLowerCase() === otherVisitor.email.trim().toLowerCase();
      if (sameEmail) {
        await tx.conversation.update({ where: { id: conv.id }, data: { visitorId: visitor.id } });
      } else {
        return null;
      }
    }
    return tx.conversation.update({ where: { id: conv.id }, data: { lastActivityAt: now, expiresAt: deadline(store, now) } });
  });
}

/** Agent / bot / system / note messages. None of these touch the retention deadline. */
export async function sendStaffMessage(storeId, conversationId, { senderType, senderId = null, senderName = null, senderAvatar = null, body, clientMsgId = null, attachmentId = null, meta = null, triggerId = null }) {
  const now = clock.now();
  const result = await prisma.$transaction(async (tx) => {
    const conv = await lockConversation(tx, conversationId, storeId);
    if (!conv) throw httpError(404, 'Conversation not found');
    if (clientMsgId) {
      const dup = await tx.message.findUnique({ where: { conversationId_clientMsgId: { conversationId, clientMsgId } } });
      if (dup) return { conv, message: dup, duplicate: true };
    }
    const seq = conv.lastSeq + 1;
    const message = await tx.message.create({
      data: { storeId, conversationId, seq, senderType, senderId, senderName, senderAvatar, body, clientMsgId, attachmentId, meta: meta ?? undefined, triggerId, createdAt: now },
    });
    const visible = senderType !== 'NOTE';
    const updated = await tx.conversation.update({
      where: { id: conv.id },
      data: {
        lastSeq: seq,
        ...(visible ? { lastMessageAt: now, lastMessagePreview: preview(body || 'Attachment'), unreadForVisitor: { increment: senderType === 'SYSTEM' ? 0 : 1 } } : {}),
        ...(senderType === 'AGENT' ? { lastAgentMessageAt: now, unreadForAgent: 0, agentReadSeq: seq, ...(conv.firstResponseAt ? {} : { firstResponseAt: now }), ...(conv.status === 'PENDING' ? {} : {}) } : {}),
      },
      include: { visitor: true },
    });
    return { conv: updated, message, duplicate: false };
  });
  if (!result.duplicate) {
    toAgents(storeId, 'message', { conversation: convSummary(result.conv), message: result.message }, result.conv);
    if (senderType !== 'NOTE') toVisitor(result.conv.visitorId, 'message', { message: visitorView(result.message) });
    if (senderType === 'AGENT') {
      emit('trigger', { storeId, event: 'agent_message', visitorId: result.conv.visitorId, conversationId, sourceId: result.message.id });
      emit('webhook', { storeId, event: 'message.created', data: { conversationId, messageId: result.message.id, senderType, body } });
    }
  }
  return result;
}

export async function updateConversation(storeId, id, data, actor = null) {
  const before = await prisma.conversation.findFirst({ where: { id, storeId } });
  if (!before) throw httpError(404, 'Conversation not found');
  const patch = { ...data };
  if (data.status === 'RESOLVED' && before.status !== 'RESOLVED') patch.resolvedAt = clock.now();
  if (data.status && data.status !== 'RESOLVED') patch.resolvedAt = null;
  const conv = await prisma.conversation.update({ where: { id }, data: patch, include: { visitor: true } });
  // Agents who could see it before an assignment change must also learn about it.
  toAgents(storeId, 'conversation', { conversation: convSummary(conv) }, conv.assigneeId === before.assigneeId ? conv : null);
  if (data.status && data.status !== before.status) {
    toVisitor(conv.visitorId, 'conversation', { id: conv.id, status: conv.status });
    if (data.status === 'RESOLVED') {
      emit('trigger', { storeId, event: 'conversation_resolved', visitorId: conv.visitorId, conversationId: id, sourceId: `${id}:resolved:${conv.resolvedAt.getTime()}` });
      emit('webhook', { storeId, event: 'conversation.resolved', data: { conversationId: id } });
    }
  }
  if (data.assigneeId !== undefined && data.assigneeId !== before.assigneeId) {
    const who = data.assigneeId ? await prisma.user.findUnique({ where: { id: data.assigneeId }, select: { name: true } }) : null;
    await sendStaffMessage(storeId, id, { senderType: 'SYSTEM', body: who ? `${who.name} joined the chat` : 'Chat unassigned', meta: { event: 'assignment', by: actor } });
  }
  return conv;
}

/** Messages after `afterSeq` (reconnect recovery). Visitors never get notes. */
export async function messagesAfter(conversationId, afterSeq = 0, { forVisitor = false, limit = 500 } = {}) {
  const rows = await prisma.message.findMany({
    where: { conversationId, seq: { gt: afterSeq }, ...(forVisitor ? { senderType: { not: 'NOTE' } } : {}) },
    orderBy: { seq: 'asc' },
    take: limit,
  });
  return forVisitor ? rows.map(visitorView) : rows;
}
