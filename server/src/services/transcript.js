// Plain-text chat transcript, downloaded by the customer (widget) or by staff (inbox). No email needed.
//   forVisitor: no internal notes; agents appear as "Customer Support" (same rules as everything the visitor sees).
//   staff:      internal notes included and marked; real agent names.
import { DateTime } from 'luxon';
import { prisma } from '../config.js';
import { AGENT_PUBLIC_NAME } from './conversations.js';

const MAX_MESSAGES = 5000;

export async function transcriptText({ conv, store, forVisitor }) {
  const rows = await prisma.message.findMany({
    where: { conversationId: conv.id, ...(forVisitor ? { senderType: { not: 'NOTE' } } : {}) },
    orderBy: { seq: 'asc' },
    take: MAX_MESSAGES,
  });
  const fileIds = rows.map((m) => m.attachmentId).filter(Boolean);
  const files = new Map(fileIds.length
    ? (await prisma.attachment.findMany({ where: { id: { in: fileIds }, conversationId: conv.id }, select: { id: true, filename: true } })).map((f) => [f.id, f.filename])
    : []);
  const zone = store.timezone || 'UTC';
  const when = (d) => DateTime.fromJSDate(d, { zone }).toFormat('yyyy-LL-dd HH:mm');
  const visitorName = conv.visitor?.name || 'Visitor';
  const who = (m) => {
    if (m.senderType === 'VISITOR') return forVisitor ? 'You' : visitorName;
    if (m.senderType === 'AGENT') return forVisitor ? AGENT_PUBLIC_NAME : m.senderName || 'Agent';
    if (m.senderType === 'NOTE') return `[Internal note] ${m.senderName || 'Agent'}`;
    if (m.senderType === 'SYSTEM') return '-';
    return m.senderName || 'Automated';
  };
  const lines = rows.map((m) => {
    const file = m.attachmentId
      ? ` [file: ${files.get(m.attachmentId) || 'attachment'}]`
      : m.meta?.removedAttachment ? ` [file: ${m.meta.removedAttachment.filename || 'attachment'} - no longer available]` : '';
    return `[${when(m.createdAt)}] ${who(m)}: ${m.body || ''}${file}`.trimEnd();
  });
  const header = [
    `Chat transcript - ${store.name}`,
    `Started: ${when(conv.createdAt)} (${zone})`,
    ...(forVisitor ? [] : [`Visitor: ${visitorName}${conv.visitor?.email ? ` <${conv.visitor.email}>` : ''}`, `Conversation: ${conv.id}`]),
    '',
  ];
  return `${header.join('\n')}\n${lines.join('\n')}\n`;
}

export function sendTranscript(res, conv, text) {
  const day = DateTime.fromJSDate(conv.createdAt).toFormat('yyyy-LL-dd');
  res.set('Content-Type', 'text/plain; charset=utf-8')
    .set('Content-Disposition', `attachment; filename="chat-transcript-${day}.txt"`)
    .set('X-Content-Type-Options', 'nosniff')
    .set('Cache-Control', 'no-store')
    .send(text);
}
