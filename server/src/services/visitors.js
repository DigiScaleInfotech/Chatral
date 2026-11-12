import { prisma, clock } from '../config.js';
import { sha256, randomToken } from '../lib/util.js';
import geoip from 'geoip-lite';
import { parseUtm, classifySource, sanitizeUrl, sanitizeReferrer } from './attribution.js';
import { classifyVisitorTraffic } from './botDetection.js';

export const SESSION_GAP_MS = 30 * 60_000;

export async function findVisitorByToken(storeId, token) {
  if (typeof token !== 'string' || token.length < 20 || token.length > 100) return null;
  return prisma.visitor.findUnique({ where: { storeId_tokenHash: { storeId, tokenHash: sha256(token) } } });
}

const clip = (s, n) => (typeof s === 'string' ? s.slice(0, n) : null);

/** Approximate { country, city, region, timezone } for an IP from the bundled offline database
 *  (MaxMind GeoLite2-derived, via geoip-lite) — nothing is sent to any third party for this lookup. */
export function locate(ip) {
  const g = typeof ip === 'string' && ip ? geoip.lookup(ip.replace(/^::ffff:/, '')) : null;
  if (!g?.country) return {};
  return { country: g.country, city: g.city || null, region: g.region || null, timezone: g.timezone || null };
}

/**
 * Store-scoped identity. The browser keeps a random token (localStorage key includes the store key);
 * we only store its hash. Unknown/cleared token → a brand-new visitor, never someone else's history.
 * Does NOT touch any conversation retention deadline.
 */
export async function identifyVisitor(store, token, info = {}) {
  const now = clock.now();
  const sanitizedUrl = sanitizeUrl(info.url, { keepUtm: false });
  const sanitizedRef = sanitizeReferrer(info.referrer);
  const page = { currentUrl: clip(sanitizedUrl, 1000), currentTitle: clip(info.title, 300), device: info.device === 'mobile' ? 'mobile' : 'desktop' };
  const utm = parseUtm(info.url);
  const botCheck = classifyVisitorTraffic({ userAgent: info.userAgent, ip: info.ip, headers: info.headers });
  const isBot = botCheck.classification === 'BOT';
  const trafficType = botCheck.classification;

  let visitor = await findVisitorByToken(store.id, token);

  // Bot Session Stitching: bots don't retain localStorage tokens. Reuse recent bot record for the same IP + UserAgent.
  if (!visitor && isBot && (info.ip || info.userAgent)) {
    const recentBot = await prisma.visitor.findFirst({
      where: {
        storeId: store.id,
        isBot: true,
        ...(info.ip ? { ip: info.ip } : {}),
        ...(info.userAgent ? { userAgent: clip(info.userAgent, 500) } : {}),
        lastSeenAt: { gte: new Date(now.getTime() - SESSION_GAP_MS) },
      },
      orderBy: { lastSeenAt: 'desc' },
    });
    if (recentBot) visitor = recentBot;
  }

  if (visitor) {
    const newSession = now - visitor.lastSeenAt > SESSION_GAP_MS;
    visitor = await prisma.visitor.update({
      where: { id: visitor.id },
      data: {
        ...page,
        lastSeenAt: now,
        isBot: isBot || visitor.isBot,
        trafficType: visitor.isBot ? 'BOT' : trafficType,
        ...(newSession || !visitor.country ? locate(info.ip) : {}),
        userAgent: clip(info.userAgent, 500),
        ...(newSession ? {
          sessionStartedAt: now, visits: { increment: 1 }, sessionPageViews: 0, referrer: clip(sanitizedRef, 1000),
          utmSource: utm.source, utmMedium: utm.medium, utmCampaign: utm.campaign,
        } : {}),
        // First-touch is set once and never overwritten; backfilled here only for visitors created
        // before this field existed (landingUrl null but the row already has history).
        ...(!visitor.landingUrl ? { landingUrl: page.currentUrl, firstReferrer: clip(sanitizedRef, 1000), firstUtmSource: utm.source, firstUtmMedium: utm.medium, firstUtmCampaign: utm.campaign } : {}),
      },
    });
    return { visitor, token: null, isNew: false, newSession };
  }
  const fresh = randomToken(32);
  visitor = await prisma.visitor.create({
    data: {
      storeId: store.id, tokenHash: sha256(fresh), ...page, ...locate(info.ip), userAgent: clip(info.userAgent, 500),
      isBot, trafficType,
      referrer: clip(sanitizedRef, 1000), firstSeenAt: now, lastSeenAt: now, sessionStartedAt: now,
      landingUrl: page.currentUrl, firstReferrer: clip(sanitizedRef, 1000),
      firstUtmSource: utm.source, firstUtmMedium: utm.medium, firstUtmCampaign: utm.campaign,
      utmSource: utm.source, utmMedium: utm.medium, utmCampaign: utm.campaign,
    },
  });
  return { visitor, token: fresh, isNew: true, newSession: true };
}

export async function recordPageView(visitor, info = {}, { newSession = false, origin = null } = {}) {
  const now = clock.now();
  const sanitizedUrl = sanitizeUrl(info.url, { keepUtm: false });
  const sanitizedRef = sanitizeReferrer(info.referrer);
  const utm = parseUtm(info.url);
  const updateData = {
    lastSeenAt: now,
    currentUrl: clip(sanitizedUrl, 1000) ?? visitor.currentUrl,
    currentTitle: clip(info.title, 300) ?? visitor.currentTitle,
  };
  if (newSession) {
    // If visitor.sessionStartedAt was already set to 'now' in identifyVisitor (within 2 seconds),
    // identifyVisitor already set sessionStartedAt and bumped visits. Otherwise (e.g. from /pageview SPA navigation), update them here.
    const alreadyBumpedInIdentify = Math.abs(now.getTime() - new Date(visitor.sessionStartedAt || 0).getTime()) < 2000;
    if (!alreadyBumpedInIdentify) {
      updateData.sessionStartedAt = now;
      updateData.visits = { increment: 1 };
    }
    updateData.sessionPageViews = 1;
    updateData.referrer = clip(sanitizedRef, 1000);
    updateData.utmSource = utm.source;
    updateData.utmMedium = utm.medium;
    updateData.utmCampaign = utm.campaign;
  } else {
    updateData.sessionPageViews = { increment: 1 };
  }

  const v = await prisma.visitor.update({
    where: { id: visitor.id },
    data: updateData,
  });
  if (!v.isBot) await bumpUsage(visitor.storeId, 'pageViews');
  // Navigation history: skip an immediate repeat of the same URL (reloads, SPA re-renders).
  if (v.currentUrl) {
    const last = await prisma.visitorPageView.findFirst({ where: { visitorId: v.id }, orderBy: { createdAt: 'desc' } });
    if (!last || last.url !== v.currentUrl || now - last.createdAt > 30_000 || newSession) {
      const source = classifySource({
        utmSource: v.utmSource,
        utmMedium: v.utmMedium,
        referrer: v.referrer,
        ownOrigin: origin,
        pageUrl: v.currentUrl,
        direct: false,
      });
      v.lastPageView = await prisma.visitorPageView.create({
        data: {
          storeId: v.storeId,
          visitorId: v.id,
          url: v.currentUrl,
          title: v.currentTitle,
          createdAt: now,
          isLanding: newSession,
          source,
          newSession,
          isBot: v.isBot,
          trafficType: v.trafficType || 'HUMAN',
        },
      });
    }
  }
  return v;
}

export async function bumpUsage(storeId, field) {
  if (field !== 'widgetLoads' && field !== 'pageViews') {
    throw new Error(`Invalid usage field: ${field}`);
  }
  const day = clock.now().toISOString().slice(0, 10);
  await prisma.$executeRawUnsafe(
    `INSERT INTO "UsageDaily" ("storeId", day, "${field}") VALUES ($1, $2::date, 1)
     ON CONFLICT ("storeId", day) DO UPDATE SET "${field}" = "UsageDaily"."${field}" + 1`,
    storeId, day,
  );
}
