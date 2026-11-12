// Removes media (attachments) from conversations whose expiresAt (= lastActivityAt +
// store.retentionDays) has passed. The conversation and its text messages are kept forever -
// only the uploaded file and its row are deleted; the message that carried it is kept with a
// `meta.removedAttachment` marker so the chat still shows what was there.
// Safety:
//  - candidates are locked FOR UPDATE SKIP LOCKED, so two sweepers never take the same row and a
//    conversation currently being written to (visitor message holds the lock) is skipped this round;
//  - expiry is re-checked under the lock inside the same transaction as the delete;
//  - files are removed by durable jobs enqueued in that same transaction (so they're never
//    orphaned by a crash).
import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma, clock, config, utc } from '../config.js';
import { enqueue, registerJob } from './jobs.js';
import { toAgents, toVisitor } from '../realtime.js';
import { visitorView } from './conversations.js';

/** Page-view history older than each store's retention window. */
export async function sweepPageViews() {
  return prisma.$executeRaw`
    DELETE FROM "VisitorPageView" pv USING "Store" s
    WHERE pv."storeId" = s.id AND pv."createdAt" < ${utc(clock.now())} - make_interval(days => s."retentionDays")`;
}

export async function sweepExpired({ batch = 100 } = {}) {
  let deleted = 0;
  await sweepPageViews();
  for (;;) {
    const now = clock.now();
    const removed = await prisma.$transaction(async (tx) => {
      const convs = await tx.$queryRaw`
        SELECT c.id, c."storeId", c."visitorId" FROM "Conversation" c
        WHERE c."expiresAt" <= ${utc(now)}
          AND EXISTS (SELECT 1 FROM "Attachment" a WHERE a."conversationId" = c.id)
        ORDER BY c."expiresAt" LIMIT ${batch}
        FOR UPDATE SKIP LOCKED`;
      if (!convs.length) return [];
      const convIds = convs.map((c) => c.id);
      // Recheck under lock (activity may have landed between an earlier read and now).
      const still = await tx.conversation.findMany({ where: { id: { in: convIds }, expiresAt: { lte: now } }, select: { id: true, storeId: true, visitorId: true } });
      if (!still.length) return [];
      const stillIds = still.map((c) => c.id);
      const files = await tx.attachment.findMany({ where: { conversationId: { in: stillIds } }, select: { id: true, storagePath: true, storeId: true, conversationId: true, filename: true } });
      if (!files.length) return [];
      const updated = [];
      for (const f of files) {
        await enqueue('delete_file', { storagePath: f.storagePath }, { storeId: f.storeId, tx });
        const msg = await tx.message.findFirst({ where: { attachmentId: f.id }, select: { id: true, conversationId: true, meta: true } });
        await tx.attachment.delete({ where: { id: f.id } });
        if (msg) {
          const message = await tx.message.update({
            where: { id: msg.id },
            data: { attachmentId: null, meta: { ...(msg.meta || {}), removedAttachment: { filename: f.filename } } },
          });
          updated.push(message);
        }
      }
      return { convs: still, messages: updated };
    }, { timeout: 60_000 });
    if (!removed.convs?.length) break;
    deleted += removed.convs.length;
    const byStore = {};
    for (const m of removed.messages) (byStore[removed.convs.find((c) => c.id === m.conversationId)?.storeId] ||= []).push(m);
    for (const [storeId, messages] of Object.entries(byStore)) {
      for (const message of messages) toAgents(storeId, 'media_expired', { conversationId: message.conversationId, message });
      await prisma.auditLog.create({ data: { storeId, action: 'retention.media_deleted', meta: { count: messages.length, conversationIds: [...new Set(messages.map((m) => m.conversationId))].slice(0, 50) } } });
    }
    for (const c of removed.convs) {
      for (const m of removed.messages.filter((x) => x.conversationId === c.id && x.senderType !== 'NOTE')) toVisitor(c.visitorId, 'media_expired', { conversationId: c.id, message: visitorView(m) });
    }
    if (removed.convs.length < batch) break;
  }
  return deleted;
}

/** Absolute path inside the upload dir; refuses anything that escapes it. */
export function safeUploadPath(storagePath) {
  const full = path.resolve(config.uploadDir, storagePath);
  if (!full.startsWith(path.resolve(config.uploadDir) + path.sep)) throw Object.assign(new Error('Bad storage path'), { permanent: true });
  return full;
}

registerJob('delete_file', async ({ storagePath }) => {
  await fs.rm(safeUploadPath(storagePath), { force: true });
});

registerJob('retention_sweep', async () => {
  await sweepExpired();
});

/** Schedules one sweep per window (dedupeKey makes concurrent schedulers enqueue it once). */
export async function scheduleSweep() {
  const slot = Math.floor(clock.now().getTime() / (config.retentionSweepMinutes * 60_000));
  await enqueue('retention_sweep', {}, { dedupeKey: `retention:${slot}` });
}
