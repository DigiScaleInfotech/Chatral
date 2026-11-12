// Customer Activity Analytics & Content Insights — read-only reporting endpoints, store-scoped and
// computed entirely from rows already written by real visitor/agent activity (see services/analytics.js
// and services/contentInsights.js). Same auth/role model as the existing /reports endpoint.
import { Router } from 'express';
import { prisma } from '../config.js';
import { requireAuth, requireStore } from '../lib/auth.js';
import { asyncRoute } from '../lib/util.js';
import { parseRange, pageViewSummary, topPages, landingPages, trafficSources, geoBreakdown, trend, sampleJourneys, trafficQuality } from '../services/analytics.js';
import { analyzeMessages, unansweredFrom, suggestContent } from '../services/contentInsights.js';

const r = Router();
r.use(requireAuth);

async function storeInfo(storeId) {
  const s = await prisma.store.findUnique({ where: { id: storeId }, select: { timezone: true, retentionDays: true } });
  return { timezone: s?.timezone || 'UTC', retentionDays: s?.retentionDays ?? 30 };
}

r.get('/stores/:storeId/analytics', requireStore('SUPERVISOR'), asyncRoute(async (req, res) => {
  const storeId = req.params.storeId;
  const store = await storeInfo(storeId);
  const { from, to, tz } = parseRange(req.query, store.timezone);
  const [summary, quality, pages, landing, sources, geo, dailyTrend, journeys] = await Promise.all([
    pageViewSummary(storeId, from, to),
    trafficQuality(storeId, from, to),
    topPages(storeId, from, to),
    landingPages(storeId, from, to),
    trafficSources(storeId, from, to),
    geoBreakdown(storeId, from, to),
    trend(storeId, from, to, tz),
    sampleJourneys(storeId, from, to),
  ]);

  const now = new Date();
  const retentionCutoff = new Date(now.getTime() - store.retentionDays * 86_400_000);
  const isPartiallyRetained = from < retentionCutoff;

  res.json({
    range: { from, to },
    retention: {
      retentionDays: store.retentionDays,
      cutoff: retentionCutoff.toISOString(),
      partialRetention: isPartiallyRetained,
      notice: isPartiallyRetained
        ? `This store's retention policy is ${store.retentionDays} days. Data prior to ${retentionCutoff.toISOString().slice(0, 10)} has been pruned by the retention policy and is unavailable.`
        : null,
    },
    summary,
    trafficQuality: quality,
    topPages: pages,
    landingPages: landing,
    trafficSources: sources,
    geo,
    trend: dailyTrend,
    journeys,
    notes: {
      visitors: 'Visitors are anonymous browsers (one per device/browser profile), not verified individual people. A visitor who clears cookies or switches device is counted again.',
      geo: 'Country/region/city are approximate, derived from the visitor\'s IP address against an offline database. VPNs, proxies, mobile carriers and corporate networks can place a visitor in the wrong city or region.',
      engagement: 'Time-on-page is not currently measured; only page view counts and sequence/timing between recorded views.',
    },
  });
}));

r.get('/stores/:storeId/analytics/content', requireStore('SUPERVISOR'), asyncRoute(async (req, res) => {
  const storeId = req.params.storeId;
  const store = await storeInfo(storeId);
  const { from, to } = parseRange(req.query, store.timezone);
  const [visitorMessages, conversations] = await Promise.all([
    prisma.message.findMany({ where: { storeId, senderType: 'VISITOR', createdAt: { gte: from, lt: to } }, select: { id: true, body: true, conversationId: true, createdAt: true } }),
    prisma.conversation.findMany({
      where: { storeId, createdAt: { gte: from, lt: to } },
      select: { id: true, createdAt: true, messages: { select: { senderType: true, body: true }, orderBy: { seq: 'asc' } } },
      take: 2000,
    }),
  ]);
  const analysis = analyzeMessages(visitorMessages, { from, to });
  const unanswered = unansweredFrom(conversations);
  const ideas = suggestContent(analysis.topics, { from, to });
  res.json({
    range: { from, to },
    method: 'Keyword/phrase frequency over real visitor messages — not an AI-generated summary (no AI provider is configured for this project).',
    sampleSize: analysis.sampleSize,
    questionCount: analysis.questionCount,
    confidence: analysis.confidence,
    topics: analysis.topics,
    unansweredQuestions: unanswered.slice(0, 20),
    unansweredCount: unanswered.length,
    contentIdeas: ideas,
    insufficientData: analysis.sampleSize < 5,
  });
}));

/** Reset test / dummy / historical analytics data for a store so metrics start fresh from 0. */
r.post('/stores/:storeId/analytics/reset', requireStore('SUPERVISOR'), asyncRoute(async (req, res) => {
  const storeId = req.params.storeId;
  const result = await prisma.$transaction(async (tx) => {
    // 1. Delete all page views recorded for this store
    const deletedViews = await tx.visitorPageView.deleteMany({ where: { storeId } });
    // 2. Delete visitors that have no active conversations
    const deletedVisitors = await tx.visitor.deleteMany({
      where: {
        storeId,
        conversations: { none: {} },
      },
    });
    // 3. For visitors that do have conversations, reset page-view counts
    const updatedVisitors = await tx.visitor.updateMany({
      where: { storeId },
      data: {
        visits: 1,
        sessionPageViews: 0,
        currentUrl: null,
        currentTitle: null,
        landingUrl: null,
        firstReferrer: null,
        referrer: null,
        firstUtmSource: null,
        firstUtmMedium: null,
        firstUtmCampaign: null,
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
      },
    });
    // 4. Reset daily pageViews usage for this store
    await tx.usageDaily.updateMany({
      where: { storeId },
      data: { pageViews: 0 },
    });
    return {
      deletedPageViews: deletedViews.count,
      deletedVisitors: deletedVisitors.count,
      resetVisitors: updatedVisitors.count,
    };
  });
  res.json({ ok: true, ...result });
}));

export default r;

