import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config.js';
import { requireAuth, requireStore, requireSuper } from '../lib/auth.js';
import { asyncRoute, audit, httpError } from '../lib/util.js';
import { triggerSchema, catalog, normalizeConditions } from '../triggers/catalog.js';
import { cancelPendingForTrigger } from '../triggers/engine.js';

const r = Router();
r.use(requireAuth);

r.get('/trigger-catalog', (req, res) => res.json(catalog()));

/** Store-scoped references inside actions must belong to the same store. */
async function validateRefs(storeId, actions) {
  for (const a of actions) {
    if (a.type === 'send_saved_reply' && !(await prisma.savedReply.findFirst({ where: { id: a.savedReplyId, storeId, access: 'PUBLIC' } }))) throw httpError(400, 'Saved reply not found in this store, or it is private (triggers can only use team shortcuts)');
    if (a.type === 'webhook' && !(await prisma.webhook.findFirst({ where: { id: a.webhookId, storeId } }))) throw httpError(400, 'Webhook not found in this store - register it under Settings → Webhooks first');
    if (a.type === 'assign' && a.mode === 'agent' && !(await prisma.storeMember.findUnique({ where: { userId_storeId: { userId: a.agentId, storeId } } }))) throw httpError(400, 'Assigned agent is not a member of this store');
  }
}

r.get('/stores/:storeId/triggers', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const triggers = await prisma.trigger.findMany({ where: { storeId: req.params.storeId }, orderBy: { createdAt: 'desc' } });
  const stats = await prisma.triggerExecution.groupBy({ by: ['triggerId', 'status'], where: { storeId: req.params.storeId }, _count: true });
  res.json(triggers.map((t) => ({ ...t, conditions: normalizeConditions(t.conditions), stats: Object.fromEntries(stats.filter((s) => s.triggerId === t.id).map((s) => [s.status, s._count])) })));
}));

r.get('/stores/:storeId/triggers/:id', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const t = await prisma.trigger.findFirst({ where: { id: req.params.id, storeId: req.params.storeId } });
  if (!t) throw httpError(404, 'Trigger not found');
  res.json({ ...t, conditions: normalizeConditions(t.conditions) });
}));

r.post('/stores/:storeId/triggers', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const input = triggerSchema.parse(req.body);
  await validateRefs(req.params.storeId, input.actions);
  const t = await prisma.trigger.create({ data: { ...input, storeId: req.params.storeId } });
  await audit(req, 'trigger.created', { storeId: t.storeId, target: t.name });
  res.status(201).json(t);
}));

// Main admin: copy this store's triggers (all, or the listed ones) into other stores. A trigger whose name already
// exists in a target store is skipped (never overwritten); one that refers to this store's saved reply, webhook or
// agent is skipped there with the reason, because those don't exist in the other store.
r.post('/stores/:storeId/triggers/copy', requireSuper, asyncRoute(async (req, res) => {
  const { storeIds, triggerIds } = z.object({ storeIds: z.array(z.string().min(1).max(64)).min(1).max(200), triggerIds: z.array(z.string().min(1).max(64)).max(200).optional() }).parse(req.body);
  const source = await prisma.trigger.findMany({ where: { storeId: req.params.storeId, ...(triggerIds ? { id: { in: triggerIds } } : {}) }, orderBy: { createdAt: 'asc' } });
  const targets = await prisma.store.findMany({ where: { id: { in: storeIds.filter((id) => id !== req.params.storeId) } }, select: { id: true, name: true } });
  const report = [];
  for (const store of targets) {
    const existing = new Set((await prisma.trigger.findMany({ where: { storeId: store.id }, select: { name: true } })).map((t) => t.name.trim().toLowerCase()));
    const row = { storeId: store.id, storeName: store.name, copied: [], skipped: [] };
    for (const t of source) {
      if (existing.has(t.name.trim().toLowerCase())) { row.skipped.push({ name: t.name, reason: 'A trigger with this name already exists' }); continue; }
      try {
        const input = triggerSchema.parse({ name: t.name, description: t.description, enabled: t.enabled, kind: t.kind, event: t.event, delaySeconds: t.delaySeconds, timerFrom: t.timerFrom, match: t.match, conditions: t.conditions, actions: t.actions, frequency: t.frequency, cooldownSeconds: t.cooldownSeconds });
        await validateRefs(store.id, input.actions);
        await prisma.trigger.create({ data: { ...input, storeId: store.id } });
        existing.add(t.name.trim().toLowerCase());
        row.copied.push(t.name);
      } catch (e) {
        row.skipped.push({ name: t.name, reason: e.status === 400 || e.name === 'ZodError' ? (e.issues?.[0]?.message || e.message) : 'Could not copy' });
        if (!(e.status === 400 || e.name === 'ZodError')) throw e;
      }
    }
    if (row.copied.length) await audit(req, 'trigger.copied', { storeId: store.id, meta: { from: req.params.storeId, triggers: row.copied } });
    report.push(row);
  }
  res.json({ stores: report });
}));

r.put('/stores/:storeId/triggers/:id', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const input = triggerSchema.parse(req.body);
  await validateRefs(req.params.storeId, input.actions);
  const existing = await prisma.trigger.findFirst({ where: { id: req.params.id, storeId: req.params.storeId } });
  if (!existing) throw httpError(404, 'Trigger not found');
  // New version: anything scheduled under the old definition is cancelled (not run with stale rules).
  const t = await prisma.trigger.update({ where: { id: existing.id }, data: { ...input, version: { increment: 1 } } });
  const cancelled = await cancelPendingForTrigger(t.id, 'Trigger was edited before it ran');
  await audit(req, 'trigger.updated', { storeId: t.storeId, target: t.name, meta: { cancelled } });
  res.json(t);
}));

r.patch('/stores/:storeId/triggers/:id/enabled', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const { enabled } = z.object({ enabled: z.boolean() }).parse(req.body);
  const n = await prisma.trigger.updateMany({ where: { id: req.params.id, storeId: req.params.storeId }, data: { enabled } });
  if (!n.count) throw httpError(404, 'Trigger not found');
  const cancelled = enabled ? 0 : await cancelPendingForTrigger(req.params.id, 'Trigger disabled before it ran');
  await audit(req, enabled ? 'trigger.enabled' : 'trigger.disabled', { storeId: req.params.storeId, target: req.params.id });
  res.json({ enabled, cancelled });
}));

r.delete('/stores/:storeId/triggers/:id', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const t = await prisma.trigger.findFirst({ where: { id: req.params.id, storeId: req.params.storeId } });
  if (!t) throw httpError(404, 'Trigger not found');
  await cancelPendingForTrigger(t.id, 'Trigger deleted');
  await prisma.trigger.delete({ where: { id: t.id } });
  await audit(req, 'trigger.deleted', { storeId: t.storeId, target: t.name });
  res.json({ ok: true });
}));

r.get('/stores/:storeId/trigger-logs', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const f = z.object({ triggerId: z.string().max(40).optional(), status: z.enum(['SCHEDULED', 'RUNNING', 'SUCCEEDED', 'SKIPPED', 'FAILED', 'CANCELLED']).optional(), limit: z.coerce.number().int().min(1).max(200).default(100) }).parse(req.query);
  const rows = await prisma.triggerExecution.findMany({
    where: { storeId: req.params.storeId, ...(f.triggerId ? { triggerId: f.triggerId } : {}), ...(f.status ? { status: f.status } : {}) },
    include: { trigger: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: f.limit,
  });
  res.json(rows);
}));

export default r;
