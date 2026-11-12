// Customer Activity Analytics: every number here is computed from VisitorPageView / Visitor /
// Conversation / Message rows that were actually persisted by real requests — no estimates, no
// synthetic fallback values. An empty range returns zeros/empty arrays, not placeholder data.
import { z } from 'zod';
import { DateTime } from 'luxon';
import { prisma, clock, DAY_MS, utc } from '../config.js';
import { httpError } from '../lib/util.js';
import { sourceGroup } from './attribution.js';

const PG_TZ_MAP = { 'Asia/Calcutta': 'Asia/Kolkata' };

/** Same whole-day, store-timezone range parsing as the existing /reports endpoint, plus named
 *  presets (7/30/90 days) so the client doesn't have to compute dates itself. */
export function parseRange(query, storeTimezone) {
  const q = z.object({ from: z.string().date().optional(), to: z.string().date().optional(), days: z.coerce.number().int().optional() }).parse(query);
  const tz = PG_TZ_MAP[storeTimezone] || storeTimezone || 'UTC';
  const day = (iso) => DateTime.fromISO(iso, { zone: tz }).startOf('day');
  const to = q.to ? day(q.to).plus({ days: 1 }).toJSDate() : clock.now();
  const from = q.from ? day(q.from).toJSDate() : new Date(to.getTime() - (q.days && [7, 30, 90].includes(q.days) ? q.days : 30) * DAY_MS);
  if (to - from > 366 * DAY_MS || to <= from) throw httpError(400, 'Choose a range of up to one year');
  return { from, to, tz };
}

const stripQuery = (url) => { try { const u = new URL(url); return `${u.origin}${u.pathname}`; } catch { return (url || '').split('?')[0]; } };

export async function trafficQuality(storeId, from, to) {
  // Query all page views in range to determine session-level traffic breakdown
  const rows = await prisma.visitorPageView.findMany({
    where: { storeId, createdAt: { gte: from, lt: to } },
    select: { visitorId: true, isBot: true, trafficType: true, isLanding: true, newSession: true },
  });

  const humanVisitors = new Set();
  const botVisitors = new Set();
  const unknownVisitors = new Set();

  let humanSessions = 0;
  let botSessions = 0;
  let unknownSessions = 0;

  for (const r of rows) {
    const isNew = r.isLanding || r.newSession;
    if (r.trafficType === 'BOT' || r.isBot) {
      botVisitors.add(r.visitorId);
      if (isNew) botSessions++;
    } else if (r.trafficType === 'UNKNOWN') {
      unknownVisitors.add(r.visitorId);
      if (isNew) unknownSessions++;
    } else {
      humanVisitors.add(r.visitorId);
      if (isNew) humanSessions++;
    }
  }

  // If no sessions flagged as landing, fallback to distinct page view groups
  if (humanSessions === 0 && botSessions === 0 && unknownSessions === 0 && rows.length > 0) {
    for (const r of rows) {
      if (r.trafficType === 'BOT' || r.isBot) botSessions++;
      else if (r.trafficType === 'UNKNOWN') unknownSessions++;
      else humanSessions++;
    }
  }

  const totalSessions = humanSessions + botSessions + unknownSessions;
  const totalVisitors = new Set([...humanVisitors, ...botVisitors, ...unknownVisitors]).size;

  const humanPct = totalSessions > 0 ? Math.round((humanSessions / totalSessions) * 1000) / 10 : 0;
  const botPct = totalSessions > 0 ? Math.round((botSessions / totalSessions) * 1000) / 10 : 0;
  const unknownPct = totalSessions > 0 ? Math.round((unknownSessions / totalSessions) * 1000) / 10 : 0;

  return {
    totalSessions,
    totalVisitors,
    human: {
      sessions: humanSessions,
      visitors: humanVisitors.size,
      percentage: humanPct,
    },
    bot: {
      sessions: botSessions,
      visitors: botVisitors.size,
      percentage: botPct,
    },
    unknown: {
      sessions: unknownSessions,
      visitors: unknownVisitors.size,
      percentage: unknownPct,
    },
    formula: 'Human % = human sessions / total classified sessions × 100; Bot % = bot sessions / total classified sessions × 100; Unknown % = unclassified sessions / total classified sessions × 100',
  };
}

export async function pageViewSummary(storeId, from, to) {
  // Requirement 3: Exclude confirmed bots (isBot = false) from human business metrics
  const [totalPageViews, visitorRows, totalConversations, chattingVisitorRows, allViewsForBounce] = await Promise.all([
    prisma.visitorPageView.count({ where: { storeId, isBot: false, createdAt: { gte: from, lt: to } } }),
    prisma.visitorPageView.findMany({ where: { storeId, isBot: false, createdAt: { gte: from, lt: to } }, distinct: ['visitorId'], select: { visitorId: true } }),
    prisma.conversation.count({ where: { storeId, createdAt: { gte: from, lt: to } } }),
    prisma.conversation.findMany({ where: { storeId, createdAt: { gte: from, lt: to } }, distinct: ['visitorId'], select: { visitorId: true } }),
    prisma.visitorPageView.findMany({
      where: { storeId, isBot: false, createdAt: { gte: from, lt: to } },
      select: { visitorId: true, isLanding: true, newSession: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const visitorIds = visitorRows.map((r) => r.visitorId);
  const uniqueVisitors = visitorIds.length;
  let newVisitors = 0;
  if (visitorIds.length) {
    newVisitors = await prisma.visitor.count({ where: { id: { in: visitorIds }, isBot: false, firstSeenAt: { gte: from, lt: to } } });
  }
  const chattingVisitors = chattingVisitorRows.length;

  // Requirement 4: Accurate session-level bounce reporting
  // A bounce is a session with exactly 1 recorded page view and no conversation started.
  const chattingVisitorSet = new Set(chattingVisitorRows.map((r) => r.visitorId));
  const viewsByVisitor = new Map();
  for (const pv of allViewsForBounce) {
    if (!viewsByVisitor.has(pv.visitorId)) viewsByVisitor.set(pv.visitorId, []);
    viewsByVisitor.get(pv.visitorId).push(pv);
  }

  let totalSessions = 0;
  let bouncedSessions = 0;
  const SESSION_GAP_MS = 30 * 60_000;

  for (const [visitorId, views] of viewsByVisitor.entries()) {
    let sessionViews = 0;
    let lastTime = 0;

    for (const pv of views) {
      const pvTime = new Date(pv.createdAt).getTime();
      const isNew = pv.isLanding || pv.newSession || (lastTime > 0 && pvTime - lastTime > SESSION_GAP_MS);

      if (isNew && sessionViews > 0) {
        totalSessions++;
        if (sessionViews === 1 && !chattingVisitorSet.has(visitorId)) {
          bouncedSessions++;
        }
        sessionViews = 0;
      }
      sessionViews++;
      lastTime = pvTime;
    }

    if (sessionViews > 0) {
      totalSessions++;
      if (sessionViews === 1 && !chattingVisitorSet.has(visitorId)) {
        bouncedSessions++;
      }
    }
  }

  const bounceRate = totalSessions > 0 ? Math.round((bouncedSessions / totalSessions) * 1000) / 10 : null;

  return {
    totalPageViews,
    uniqueVisitors,
    newVisitors,
    returningVisitors: uniqueVisitors - newVisitors,
    conversationsStarted: totalConversations, // keep total conversations as a separate metric
    chattingVisitors, // distinct visitors who started conversations
    chatStartRate: uniqueVisitors ? Math.round((chattingVisitors / uniqueVisitors) * 1000) / 10 : null,
    totalSessions,
    bouncedSessions,
    bounceRate,
  };
}

export async function topPages(storeId, from, to, limit = 10) {
  const rows = await prisma.visitorPageView.findMany({ where: { storeId, isBot: false, createdAt: { gte: from, lt: to } }, select: { url: true, title: true } });
  const counts = new Map(); // path -> { title, count }
  for (const r of rows) {
    const path = stripQuery(r.url); // query strings are never surfaced in reports (may carry tracking/session data)
    const e = counts.get(path) || { title: r.title, count: 0 };
    e.count++; counts.set(path, e);
  }
  return [...counts.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, limit).map(([path, v]) => ({ path, title: v.title, views: v.count }));
}

export async function landingPages(storeId, from, to, limit = 10) {
  const rows = await prisma.visitorPageView.findMany({ where: { storeId, isBot: false, isLanding: true, createdAt: { gte: from, lt: to } }, select: { url: true, title: true } });
  const counts = new Map();
  for (const r of rows) {
    const path = stripQuery(r.url);
    const e = counts.get(path) || { title: r.title, count: 0 };
    e.count++; counts.set(path, e);
  }
  return [...counts.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, limit).map(([path, v]) => ({ path, title: v.title, sessions: v.count }));
}

export async function trafficSources(storeId, from, to) {
  const rows = await prisma.visitorPageView.findMany({ where: { storeId, isBot: false, isLanding: true, createdAt: { gte: from, lt: to } }, select: { source: true, visitorId: true } });
  const groups = new Map(); // group label -> { sessions, visitors: Set }
  for (const r of rows) {
    const g = sourceGroup(r.source || 'Unknown');
    const e = groups.get(g) || { sessions: 0, visitors: new Set() };
    e.sessions++; e.visitors.add(r.visitorId); groups.set(g, e);
  }
  return [...groups.entries()].sort((a, b) => b[1].sessions - a[1].sessions).map(([source, v]) => ({ source, sessions: v.sessions, visitors: v.visitors.size }));
}

export async function geoBreakdown(storeId, from, to) {
  const rows = await prisma.visitorPageView.findMany({ where: { storeId, isBot: false, createdAt: { gte: from, lt: to } }, distinct: ['visitorId'], select: { visitorId: true } });
  const ids = rows.map((r) => r.visitorId);
  if (!ids.length) return { countries: [], regions: [], cities: [], unresolved: 0 };
  const visitors = await prisma.visitor.findMany({ where: { id: { in: ids }, isBot: false }, select: { country: true, region: true, city: true } });
  const top = (key, limit = 15) => {
    const m = new Map();
    for (const v of visitors) { if (!v[key]) continue; m.set(v[key], (m.get(v[key]) || 0) + 1); }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([value, count]) => ({ value, count }));
  };
  return {
    countries: top('country'),
    regions: top('region'),
    cities: visitors.filter((v) => v.city).reduce((acc, v) => {
      const k = `${v.city}|${v.region || ''}|${v.country || ''}`;
      const e = acc.find((x) => x.key === k);
      if (e) e.count++; else acc.push({ key: k, city: v.city, region: v.region, country: v.country, count: 1 });
      return acc;
    }, []).sort((a, b) => b.count - a.count).slice(0, 15).map(({ key, ...rest }) => rest),
    unresolved: visitors.filter((v) => !v.country).length, // IP had no match in the offline database (e.g. localhost, private network, VPN range)
  };
}

export async function trend(storeId, from, to, tz) {
  return prisma.$queryRaw`
    SELECT to_char(date_trunc('day', ("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz}), 'YYYY-MM-DD') AS day,
      COUNT(*)::int AS "pageViews", COUNT(DISTINCT "visitorId")::int AS "uniqueVisitors"
    FROM "VisitorPageView" WHERE "storeId" = ${storeId} AND "isBot" = false AND "createdAt" >= ${utc(from)} AND "createdAt" < ${utc(to)}
    GROUP BY 1 ORDER BY 1`;
}

/**
 * A sample of real visitor journeys built BY SESSION, preserving exact page-view order.
 * Groups page views for a visitor into sessions based on session gap (>30 min) or isLanding/newSession flags.
 * Excludes confirmed bot traffic.
 */
export async function sampleJourneys(storeId, from, to, limit = 8) {
  const allViews = await prisma.visitorPageView.findMany({
    where: { storeId, isBot: false, createdAt: { gte: from, lt: to } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, visitorId: true, url: true, title: true, createdAt: true, isLanding: true, newSession: true },
  });

  if (!allViews.length) return [];

  // Segment by visitor and session
  const visitorViews = new Map();
  for (const pv of allViews) {
    if (!visitorViews.has(pv.visitorId)) visitorViews.set(pv.visitorId, []);
    visitorViews.get(pv.visitorId).push(pv);
  }

  const sessions = [];
  const SESSION_GAP_MS = 30 * 60_000;

  for (const [visitorId, views] of visitorViews.entries()) {
    let currentSession = [];
    let lastTime = 0;

    for (const pv of views) {
      const pvTime = new Date(pv.createdAt).getTime();
      const isNew = pv.isLanding || pv.newSession || (lastTime > 0 && pvTime - lastTime > SESSION_GAP_MS);

      if (isNew && currentSession.length > 0) {
        sessions.push({ visitorId, pages: currentSession });
        currentSession = [];
      }

      currentSession.push(pv);
      lastTime = pvTime;
    }

    if (currentSession.length > 0) {
      sessions.push({ visitorId, pages: currentSession });
    }
  }

  // Sort sessions by busiest (most pages in session)
  sessions.sort((a, b) => b.pages.length - a.pages.length);

  return sessions.slice(0, limit).map((s) => ({
    visitorId: s.visitorId,
    pageCount: s.pages.length,
    pages: s.pages.slice(0, 25).map((p) => ({
      path: stripQuery(p.url),
      title: p.title,
      at: p.createdAt,
    })),
  }));
}
