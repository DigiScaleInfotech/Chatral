// Reports are computed from stored rows only (no estimates). `from` and `to` are whole days
// (both inclusive) in the store's timezone.
import { Router } from 'express';
import { z } from 'zod';
import { DateTime } from 'luxon';
import { prisma, clock, DAY_MS, utc } from '../config.js';
import { requireAuth, requireStore } from '../lib/auth.js';
import { asyncRoute, httpError } from '../lib/util.js';

const r = Router();
r.use(requireAuth);

r.get('/stores/:storeId/reports', requireStore('SUPERVISOR'), asyncRoute(async (req, res) => {
  const q = z.object({ from: z.string().date().optional(), to: z.string().date().optional() }).parse(req.query);
  const storeId = req.params.storeId;
  const storeRow = await prisma.store.findUnique({ where: { id: storeId }, select: { timezone: true } });
  const rawTz = storeRow?.timezone || 'UTC';
  const PG_TZ_MAP = { 'Asia/Calcutta': 'Asia/Kolkata' };
  const tz = PG_TZ_MAP[rawTz] || rawTz;
  const day = (iso) => DateTime.fromISO(iso, { zone: tz }).startOf('day');
  const to = q.to ? day(q.to).plus({ days: 1 }).toJSDate() : clock.now();
  const from = q.from ? day(q.from).toJSDate() : new Date(to.getTime() - 30 * DAY_MS);
  if (to - from > 366 * DAY_MS || to <= from) throw httpError(400, 'Choose a range of up to one year');
  const inRange = { storeId, createdAt: { gte: from, lt: to } };

  const [byStatus, offline, missed, msgs, timing, perDay, agentRows, members, trig, usage, visitors] = await Promise.all([
    prisma.conversation.groupBy({ by: ['status'], where: inRange, _count: true }),
    prisma.conversation.count({ where: { ...inRange, isOffline: true } }),
    prisma.conversation.count({ where: { ...inRange, firstResponseAt: null, isOffline: false } }),
    prisma.message.groupBy({ by: ['senderType'], where: inRange, _count: true }),
    prisma.$queryRaw`
      SELECT
        AVG(EXTRACT(EPOCH FROM ("firstResponseAt" - "createdAt")))::float AS "avgFirstResponse",
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("firstResponseAt" - "createdAt")))::float AS "medianFirstResponse",
        AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt"))) FILTER (WHERE "resolvedAt" IS NOT NULL)::float AS "avgResolution",
        COUNT(*) FILTER (WHERE "firstResponseAt" IS NOT NULL)::int AS "answered"
      FROM "Conversation" WHERE "storeId" = ${storeId} AND "createdAt" >= ${utc(from)} AND "createdAt" < ${utc(to)}`,
    prisma.$queryRaw`
      SELECT to_char(date_trunc('day', ("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz}), 'YYYY-MM-DD') AS day, COUNT(*)::int AS conversations
      FROM "Conversation" WHERE "storeId" = ${storeId} AND "createdAt" >= ${utc(from)} AND "createdAt" < ${utc(to)}
      GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw`
      SELECT m."senderId" AS "userId", COUNT(*)::int AS messages, COUNT(DISTINCT m."conversationId")::int AS conversations
      FROM "Message" m WHERE m."storeId" = ${storeId} AND m."senderType" = 'AGENT' AND m."createdAt" >= ${utc(from)} AND m."createdAt" < ${utc(to)}
      GROUP BY m."senderId"`,
    prisma.storeMember.findMany({ where: { storeId }, include: { user: { select: { name: true, email: true } } } }),
    prisma.triggerExecution.groupBy({ by: ['triggerId', 'status'], where: inRange, _count: true }),
    prisma.usageDaily.aggregate({ where: { storeId, day: { gte: from, lt: to } }, _sum: { widgetLoads: true, pageViews: true } }),
    prisma.visitor.count({ where: { storeId, lastSeenAt: { gte: from, lt: to } } }),
  ]);

  const agentFirst = await prisma.$queryRaw`
    SELECT "assigneeId" AS "userId", AVG(EXTRACT(EPOCH FROM ("firstResponseAt" - "createdAt")))::float AS "avgFirstResponse",
      COUNT(*) FILTER (WHERE status = 'RESOLVED')::int AS resolved
    FROM "Conversation" WHERE "storeId" = ${storeId} AND "createdAt" >= ${utc(from)} AND "createdAt" < ${utc(to)} AND "assigneeId" IS NOT NULL
    GROUP BY "assigneeId"`;
  const triggers = await prisma.trigger.findMany({ where: { storeId, id: { in: [...new Set(trig.map((t) => t.triggerId))] } }, select: { id: true, name: true } });
  const t0 = timing[0] || {};

  // Audience: who started chats in the range. Location is approximate (IP); answers come from pre-chat choice fields
  // (e.g. a "Gender" or "Age group" question), so they exist only when the store asks them.
  const chatVisitors = await prisma.visitor.findMany({
    where: { storeId, conversations: { some: inRange } },
    select: { country: true, city: true, attributes: true },
  });
  const top = (counts, n = 10) => [...counts.entries()].sort((x, y) => y[1] - x[1]).slice(0, n);
  const countries = new Map(); const cities = new Map(); const answers = new Map();
  for (const v of chatVisitors) {
    const c = v.country || 'Unknown';
    countries.set(c, (countries.get(c) || 0) + 1);
    if (v.city) { const k = `${v.city}|${v.country || ''}`; cities.set(k, (cities.get(k) || 0) + 1); }
    for (const a of Object.values(v.attributes || {})) {
      if (!a || a.type !== 'select' || typeof a.value !== 'string' || !a.label) continue;
      const q = answers.get(a.label) || new Map();
      q.set(a.value, (q.get(a.value) || 0) + 1);
      answers.set(a.label, q);
    }
  }

  res.json({
    range: { from, to },
    conversations: {
      total: byStatus.reduce((a, b) => a + b._count, 0),
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
      offline, missed, answered: t0.answered || 0,
      avgFirstResponseSec: t0.avgFirstResponse, medianFirstResponseSec: t0.medianFirstResponse, avgResolutionSec: t0.avgResolution,
      perDay,
    },
    messages: Object.fromEntries(msgs.map((m) => [m.senderType, m._count])),
    agents: members.map((m) => {
      const a = agentRows.find((x) => x.userId === m.userId) || {};
      const f = agentFirst.find((x) => x.userId === m.userId) || {};
      return { userId: m.userId, name: m.user.name, email: m.user.email, role: m.role, presence: m.presence, messages: a.messages || 0, conversations: a.conversations || 0, resolved: f.resolved || 0, avgFirstResponseSec: f.avgFirstResponse ?? null };
    }),
    triggers: triggers.map((t) => ({ id: t.id, name: t.name, ...Object.fromEntries(trig.filter((x) => x.triggerId === t.id).map((x) => [x.status, x._count])) })),
    audience: {
      visitors: chatVisitors.length,
      countries: top(countries).map(([country, count]) => ({ country, count })),
      cities: top(cities).map(([k, count]) => { const [city, country] = k.split('|'); return { city, country, count }; }),
      answers: [...answers.entries()].map(([question, m]) => ({ question, values: top(m, 20).map(([value, count]) => ({ value, count })) })),
    },
    usage: { widgetLoads: usage._sum.widgetLoads || 0, pageViews: usage._sum.pageViews || 0, activeVisitors: visitors },
  });
}));

// Platform overview for super admins: per-store usage.
r.get('/platform/usage', asyncRoute(async (req, res) => {
  if (req.user.role !== 'SUPER_ADMIN') throw httpError(403, 'Forbidden');
  const since = new Date(clock.now().getTime() - 30 * DAY_MS);
  const rows = await prisma.$queryRaw`
    SELECT s.id, s.name, s."isActive", s."widgetEnabled",
      (SELECT COUNT(*)::int FROM "Conversation" c WHERE c."storeId" = s.id AND c."createdAt" >= ${utc(since)}) AS conversations,
      (SELECT COUNT(*)::int FROM "Message" m WHERE m."storeId" = s.id AND m."createdAt" >= ${utc(since)}) AS messages,
      (SELECT COALESCE(SUM(u."widgetLoads"),0)::int FROM "UsageDaily" u WHERE u."storeId" = s.id AND u.day >= ${utc(since)}) AS "widgetLoads",
      (SELECT COUNT(*)::int FROM "StoreMember" sm WHERE sm."storeId" = s.id) AS members
    FROM "Store" s ORDER BY s.name`;
  res.json(rows);
}));

export default r;
