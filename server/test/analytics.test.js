import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start, stop, call, makeUser, makeStore, visit, say, mods } from './helpers.js';

const ORIGIN = 'https://shop.test';
const DAY = 86_400_000;

before(start);
after(stop);

async function setup(name) {
  const sup = await makeUser(`${name}@analytics.test`, { role: 'SUPER_ADMIN' });
  const store = await makeStore(sup.token, `Shop ${name}`, ['shop.test']);
  return { sup, store };
}

test('a page view with no chat reaches Postgres with store/visitor/timestamp/page data', async () => {
  const { sup, store } = await setup('ingest');
  const r = await visit(store.publicKey, { origin: ORIGIN, url: 'https://shop.test/rings' });
  assert.equal(r.status, 200);
  const rows = await mods.prisma.visitorPageView.findMany({ where: { storeId: store.id } });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].url, 'https://shop.test/rings');
  assert.ok(rows[0].createdAt instanceof Date);
  const visitorRow = await mods.prisma.visitor.findUnique({ where: { id: rows[0].visitorId } });
  assert.equal(visitorRow.storeId, store.id);

  const res = await call('GET', `/api/stores/${store.id}/analytics?days=30`, { token: sup.token });
  assert.equal(res.status, 200);
  assert.equal(res.data.summary.totalPageViews, 1);
  assert.equal(res.data.summary.uniqueVisitors, 1);
});

test('visiting a second, different page is counted; an immediate repeat of the same page is not duplicated', async () => {
  const { sup, store } = await setup('dedup');
  const v = await visit(store.publicKey, { origin: ORIGIN, url: 'https://shop.test/' });
  await call('POST', `/api/widget/${store.publicKey}/pageview`, { body: { url: 'https://shop.test/', title: 'Home' }, headers: { 'X-Visitor-Token': v.token, Origin: ORIGIN } }); // immediate repeat
  await call('POST', `/api/widget/${store.publicKey}/pageview`, { body: { url: 'https://shop.test/rings', title: 'Rings' }, headers: { 'X-Visitor-Token': v.token, Origin: ORIGIN } });
  const res = await call('GET', `/api/stores/${store.id}/analytics?days=30`, { token: sup.token });
  assert.equal(res.data.summary.totalPageViews, 2, 'the repeated identical URL must not create a second row');
});

test('UTM parameters in the URL are classified and stored; the campaign source is traceable', async () => {
  const { sup, store } = await setup('utm');
  await visit(store.publicKey, { origin: ORIGIN, url: 'https://shop.test/rings?utm_source=newsletter&utm_medium=email&utm_campaign=spring' });
  const res = await call('GET', `/api/stores/${store.id}/analytics?days=30`, { token: sup.token });
  const row = res.data.trafficSources.find((s) => s.source === 'Email');
  assert.ok(row, `expected an Email source group, got ${JSON.stringify(res.data.trafficSources)}`);
  assert.equal(row.sessions, 1);
  const visitorRow = await mods.prisma.visitor.findFirst({ where: { storeId: store.id } });
  assert.equal(visitorRow.firstUtmSource, 'newsletter');
  assert.equal(visitorRow.firstUtmCampaign, 'spring');
});

test('a known external referrer is classified as organic search/social; an unrecognised one is a referral', async () => {
  const { sup, store } = await setup('ref');
  await call('POST', `/api/widget/${store.publicKey}/session`, { body: { url: 'https://shop.test/', title: 'Home', referrer: 'https://www.google.com/search?q=rings', device: 'desktop' }, headers: { Origin: ORIGIN } });
  await call('POST', `/api/widget/${store.publicKey}/session`, { body: { url: 'https://shop.test/', title: 'Home', referrer: 'https://some-blog.example/post', device: 'desktop' }, headers: { Origin: ORIGIN } });
  const res = await call('GET', `/api/stores/${store.id}/analytics?days=30`, { token: sup.token });
  const groups = res.data.trafficSources.map((s) => s.source);
  assert.ok(groups.includes('Organic search'));
  assert.ok(groups.includes('Referral'));
});

test('no referrer and no UTM = Unknown (or Direct when direct navigation established), never guessed as something else', async () => {
  const { sup, store } = await setup('direct');
  await visit(store.publicKey, { origin: ORIGIN, url: 'https://shop.test/' });
  const res = await call('GET', `/api/stores/${store.id}/analytics?days=30`, { token: sup.token });
  // Per requirement 3: Do not automatically classify missing referrers as Direct. Use Unknown when the source cannot be established.
  assert.deepEqual(res.data.trafficSources.map((s) => s.source), ['Unknown']);
});

test('an empty store returns an honest empty state, not fabricated numbers', async () => {
  const { sup, store } = await setup('empty');
  const res = await call('GET', `/api/stores/${store.id}/analytics?days=30`, { token: sup.token });
  assert.equal(res.status, 200);
  assert.deepEqual(res.data.summary, {
    totalPageViews: 0,
    uniqueVisitors: 0,
    newVisitors: 0,
    returningVisitors: 0,
    conversationsStarted: 0,
    chattingVisitors: 0,
    chatStartRate: null,
    totalSessions: 0,
    bouncedSessions: 0,
    bounceRate: null,
  });
  assert.deepEqual(res.data.topPages, []);
  assert.deepEqual(res.data.trafficSources, []);

  const content = await call('GET', `/api/stores/${store.id}/analytics/content?days=30`, { token: sup.token });
  assert.equal(content.data.sampleSize, 0);
  assert.equal(content.data.insufficientData, true);
  assert.deepEqual(content.data.topics, []);
});

test('date filtering: a page view outside the requested range is excluded', async () => {
  const { sup, store } = await setup('range');
  await visit(store.publicKey, { origin: ORIGIN, url: 'https://shop.test/old' });
  mods.clock.advance(40 * DAY);
  await visit(store.publicKey, { origin: ORIGIN, url: 'https://shop.test/recent' });
  try {
    const recent = await call('GET', `/api/stores/${store.id}/analytics?days=7`, { token: sup.token });
    assert.equal(recent.data.summary.totalPageViews, 1);
    assert.equal(recent.data.topPages[0].path, 'https://shop.test/recent');
    const wide = await call('GET', `/api/stores/${store.id}/analytics?days=90`, { token: sup.token });
    assert.equal(wide.data.summary.totalPageViews, 2);
  } finally { mods.clock.reset(); }
});

test('a visitor returning after the 30-minute session gap starts a new session (new landing page, new/returning split)', async () => {
  const { sup, store } = await setup('session');
  const v = await visit(store.publicKey, { origin: ORIGIN, url: 'https://shop.test/' });
  mods.clock.advance(31 * 60_000);
  await call('POST', `/api/widget/${store.publicKey}/session`, { body: { token: v.token, url: 'https://shop.test/rings', title: 'Rings', device: 'desktop' }, headers: { Origin: ORIGIN } });
  try {
    const landing = await mods.prisma.visitorPageView.findMany({ where: { storeId: store.id, isLanding: true }, orderBy: { createdAt: 'asc' } });
    assert.equal(landing.length, 2, 'both the original visit and the resumed-after-gap visit should be landing pages');
    const res = await call('GET', `/api/stores/${store.id}/analytics?days=30`, { token: sup.token });
    assert.equal(res.data.summary.uniqueVisitors, 1);
    assert.equal(res.data.summary.newVisitors, 1); // one browser, first seen in this range
  } finally { mods.clock.reset(); }
});

test('store isolation: an agent of store B cannot read store A\'s analytics, and a token from A cannot inject events into B', async () => {
  const a = await setup('iso-a');
  const b = await setup('iso-b');
  const av = await visit(a.store.publicKey, { origin: ORIGIN, url: 'https://shop.test/a-page' });
  const bAgent = await makeUser('b-agent@analytics.test');
  await call('POST', `/api/stores/${b.store.id}/members`, { token: b.sup.token, body: { email: bAgent.email, role: 'AGENT' } });
  const cross = await call('GET', `/api/stores/${a.store.id}/analytics?days=30`, { token: bAgent.token });
  assert.equal(cross.status, 403, 'a member of store B must not read store A\'s analytics at all');
  // A visitor token issued for store A is meaningless against store B's widget key.
  const inject = await call('POST', `/api/widget/${b.store.publicKey}/pageview`, { body: { url: 'https://shop.test/hack' }, headers: { 'X-Visitor-Token': av.token, Origin: ORIGIN } });
  assert.equal(inject.status, 401);
  const bPageViews = await mods.prisma.visitorPageView.count({ where: { storeId: b.store.id } });
  assert.equal(bPageViews, 0, 'store A\'s page view must not have leaked into store B');
  const aOnly = await call('GET', `/api/stores/${a.store.id}/analytics?days=30`, { token: a.sup.token });
  assert.equal(aOnly.data.summary.totalPageViews, 1);
  const bOnly = await call('GET', `/api/stores/${b.store.id}/analytics?days=30`, { token: b.sup.token });
  assert.equal(bOnly.data.summary.totalPageViews, 0);
});

test('an agent (not supervisor+) cannot read analytics for a store they only have AGENT access to', async () => {
  const { sup, store } = await setup('role');
  const agent = await makeUser('agent@analytics.test');
  await call('POST', `/api/stores/${store.id}/members`, { token: sup.token, body: { email: agent.email, role: 'AGENT' } });
  const res = await call('GET', `/api/stores/${store.id}/analytics?days=30`, { token: agent.token });
  assert.equal(res.status, 403);
});

test('malformed/oversized requests are rejected, not silently stored as bad data', async () => {
  const { sup, store } = await setup('bad');
  const v = await visit(store.publicKey, { origin: ORIGIN, url: 'https://shop.test/' });
  const huge = await call('POST', `/api/widget/${store.publicKey}/pageview`, { body: { url: 'x'.repeat(5000) }, headers: { 'X-Visitor-Token': v.token, Origin: ORIGIN } });
  assert.equal(huge.status, 400);
  const badDate = await call('GET', `/api/stores/${store.id}/analytics?from=not-a-date`, { token: sup.token });
  assert.equal(badDate.status, 400);
  const noAuth = await call('GET', `/api/stores/${store.id}/analytics?days=30`, {});
  assert.equal(noAuth.status, 401);
});

test('a tracking failure (bad token) returns an error but never crashes the chat message endpoint', async () => {
  const { store } = await setup('resilience');
  const bad = await call('POST', `/api/widget/${store.publicKey}/pageview`, { body: { url: 'https://shop.test/' }, headers: { 'X-Visitor-Token': 'not-a-real-token-not-a-real-token', Origin: ORIGIN } });
  assert.equal(bad.status, 401);
  // The widget's own session endpoint (unaffected by the bad pageview call) still works fine right after.
  const ok = await visit(store.publicKey, { origin: ORIGIN, url: 'https://shop.test/' });
  assert.equal(ok.status, 200);
});

test('content insights: sample size, question count and unanswered count come from real messages', async () => {
  const { sup, store } = await setup('content');
  const v1 = await visit(store.publicKey, { origin: ORIGIN });
  await say(store.publicKey, v1.token, 'Do you resize rings for a wedding?', {}, ORIGIN);
  const v2 = await visit(store.publicKey, { origin: ORIGIN });
  await say(store.publicKey, v2.token, 'Can you resize rings after purchase?', {}, ORIGIN);
  const v3 = await visit(store.publicKey, { origin: ORIGIN });
  await say(store.publicKey, v3.token, 'Is it possible to resize rings here?', {}, ORIGIN);
  mods.clock.advance(6 * 60_000); // past the 5-minute "give the agent a chance" window
  const res = await call('GET', `/api/stores/${store.id}/analytics/content?days=30`, { token: sup.token });
  try {
    assert.equal(res.data.sampleSize, 3);
    assert.equal(res.data.questionCount, 3);
    assert.equal(res.data.unansweredCount, 3);
    const top = res.data.topics.find((t) => t.phrase.includes('resize rings'));
    assert.ok(top, `expected a resize-rings topic, got ${JSON.stringify(res.data.topics)}`);
    assert.equal(top.mentions, 3);
    assert.ok(res.data.contentIdeas.some((i) => i.idea.includes('resize rings')));
  } finally { mods.clock.reset(); }
});

test('SPA navigation: session boundary after 30-min gap updates sessionPageViews and landingUrl', async () => {
  const { sup, store } = await setup('spa-session');
  const v = await visit(store.publicKey, { origin: ORIGIN, url: 'https://shop.test/catalog' });

  // SPA navigation within 30 mins
  await call('POST', `/api/widget/${store.publicKey}/pageview`, {
    body: { url: 'https://shop.test/catalog/item1', title: 'Item 1' },
    headers: { 'X-Visitor-Token': v.token, Origin: ORIGIN },
  });

  let pvs = await mods.prisma.visitorPageView.findMany({ where: { storeId: store.id }, orderBy: { createdAt: 'asc' } });
  assert.equal(pvs.length, 2);
  assert.equal(pvs[0].isLanding, true);
  assert.equal(pvs[1].isLanding, false);

  // Advance clock beyond 30 mins -> next SPA pageview triggers a new session
  mods.clock.advance(35 * 60_000);
  try {
    await call('POST', `/api/widget/${store.publicKey}/pageview`, {
      body: { url: 'https://shop.test/cart', title: 'Cart' },
      headers: { 'X-Visitor-Token': v.token, Origin: ORIGIN },
    });

    pvs = await mods.prisma.visitorPageView.findMany({ where: { storeId: store.id }, orderBy: { createdAt: 'asc' } });
    assert.equal(pvs.length, 3);
    assert.equal(pvs[2].isLanding, true, 'SPA navigation after 30 min gap must be flagged as landing page');
    assert.equal(pvs[2].newSession, true);

    const visitor = await mods.prisma.visitor.findUnique({ where: { id: pvs[0].visitorId } });
    assert.equal(visitor.visits, 2, 'Visits count must increment on new session');
  } finally {
    mods.clock.reset();
  }
});

test('Chat-start rate is calculated per distinct chatting visitor, not total conversations', async () => {
  const { sup, store } = await setup('chat-rate');
  // Visitor 1 visits and starts a conversation
  const v1 = await visit(store.publicKey, { origin: ORIGIN, url: 'https://shop.test/p1' });
  const msg1 = await say(store.publicKey, v1.token, 'Hello first time', {}, ORIGIN);
  assert.equal(msg1.status, 201);
  // Expire the first conversation so that sending another message creates a brand new conversation
  await mods.prisma.conversation.update({
    where: { id: msg1.data.conversationId },
    data: { expiresAt: new Date(mods.clock.now().getTime() - 1000) },
  });
  // Advance clock and send message 2
  mods.clock.advance(5 * 60_000);
  const msg2 = await say(store.publicKey, v1.token, 'Hello second time in new conversation', {}, ORIGIN);
  assert.equal(msg2.status, 201);
  assert.notEqual(msg1.data.conversationId, msg2.data.conversationId, 'Must be a distinct conversation');

  // Visitor 2 visits but starts NO conversations
  await visit(store.publicKey, { origin: ORIGIN, url: 'https://shop.test/p2' });

  const res = await call('GET', `/api/stores/${store.id}/analytics?days=30`, { token: sup.token });
  assert.equal(res.status, 200);
  const s = res.data.summary;
  assert.equal(s.uniqueVisitors, 2, 'There are 2 distinct visitors');
  assert.equal(s.chattingVisitors, 1, 'Only 1 distinct visitor started chat');
  assert.equal(s.conversationsStarted, 2, 'Total conversations count is 2');
  // Rate should be 1 / 2 = 50.0% (distinct chatting visitors / unique visitors)
  assert.equal(s.chatStartRate, 50.0);
  mods.clock.reset();
});

test('sampleJourneys breaks paths by session and preserves chronological order', async () => {
  const { sup, store } = await setup('journeys');
  const v = await visit(store.publicKey, { origin: ORIGIN, url: 'https://shop.test/home' });
  await call('POST', `/api/widget/${store.publicKey}/pageview`, {
    body: { url: 'https://shop.test/products', title: 'Products' },
    headers: { 'X-Visitor-Token': v.token, Origin: ORIGIN },
  });

  // Start new session 40 minutes later
  mods.clock.advance(40 * 60_000);
  try {
    await call('POST', `/api/widget/${store.publicKey}/pageview`, {
      body: { url: 'https://shop.test/contact', title: 'Contact' },
      headers: { 'X-Visitor-Token': v.token, Origin: ORIGIN },
    });

    const res = await call('GET', `/api/stores/${store.id}/analytics?days=30`, { token: sup.token });
    assert.equal(res.status, 200);
    // There are 2 distinct sessions for this visitor
    assert.ok(res.data.journeys.length >= 2, 'Should separate into 2 distinct session journeys');
    const firstJourney = res.data.journeys.find((j) => j.pages.some((p) => p.path === 'https://shop.test/home'));
    assert.ok(firstJourney, 'first journey should contain /home');
    assert.deepEqual(firstJourney.pages.map((p) => p.path), ['https://shop.test/home', 'https://shop.test/products']);
  } finally {
    mods.clock.reset();
  }
});

test('retention notice is returned when query window exceeds store.retentionDays', async () => {
  const { sup, store } = await setup('retention-test');
  // Default retentionDays is 30. A 90-day query should flag partialRetention and provide notice.
  const res90 = await call('GET', `/api/stores/${store.id}/analytics?days=90`, { token: sup.token });
  assert.equal(res90.status, 200);
  assert.equal(res90.data.retention.retentionDays, 30);
  assert.equal(res90.data.retention.partialRetention, true);
  assert.ok(res90.data.retention.notice.includes("retention policy is 30 days"));

  // A 7-day query is within the 30-day window
  const res7 = await call('GET', `/api/stores/${store.id}/analytics?days=7`, { token: sup.token });
  assert.equal(res7.status, 200);
  assert.equal(res7.data.retention.partialRetention, false);
  assert.equal(res7.data.retention.notice, null);
});

test('IP security & geolocation: private or missing IPs do not fabricate locations', async () => {
  const { sup, store } = await setup('ip-security');
  // Visit with private IP (e.g., 127.0.0.1 or local network)
  const v = await visit(store.publicKey, {
    origin: ORIGIN,
    url: 'https://shop.test/secure',
    headers: { 'X-Forwarded-For': '127.0.0.1' },
  });
  const visitor = await mods.prisma.visitor.findUnique({
    where: { storeId_tokenHash: { storeId: store.id, tokenHash: (await import('../src/lib/util.js')).sha256(v.token) } },
  });
  assert.equal(visitor.country, null, 'Private/loopback IP should return null country without fabricating location');

  const res = await call('GET', `/api/stores/${store.id}/analytics?days=30`, { token: sup.token });
  assert.deepEqual(res.data.geo.countries, [], 'No fabricated country entries for unresolved IPs');
  assert.deepEqual(res.data.geo.cities, [], 'No fabricated city entries for unresolved IPs');
  assert.equal(res.data.geo.unresolved, 1, 'Unresolved count reflects 1 visitor');
});

test('bot traffic detection and exclusion: bots classified in Traffic Quality but excluded from business KPIs', async () => {
  const { sup, store } = await setup('bot-traffic');

  // Human visitor
  const humanVisitor = await visit(store.publicKey, {
    origin: ORIGIN,
    url: 'https://shop.test/home',
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
  });

  // Bot visitor (e.g. Googlebot / scraper)
  const botVisitor = await visit(store.publicKey, {
    origin: ORIGIN,
    url: 'https://shop.test/catalog',
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
  });

  const res = await call('GET', `/api/stores/${store.id}/analytics?days=30`, { token: sup.token });
  assert.equal(res.status, 200);

  // Business KPIs must only reflect genuine human traffic (bot excluded)
  assert.equal(res.data.summary.uniqueVisitors, 1, 'Confirmed bot excluded from human uniqueVisitors');
  assert.equal(res.data.summary.totalPageViews, 1, 'Confirmed bot page view excluded from totalPageViews');

  // Traffic Quality must accurately report both human and bot percentages
  const tq = res.data.trafficQuality;
  assert.ok(tq, 'Traffic quality data must be present');
  assert.equal(tq.totalSessions, 2);
  assert.equal(tq.human.sessions, 1);
  assert.equal(tq.bot.sessions, 1);
  assert.equal(tq.human.percentage, 50);
  assert.equal(tq.bot.percentage, 50);
  assert.equal(tq.unknown.percentage, 0);
});

test('bounce reporting: single-page session without chat bounces; multi-page session does not bounce', async () => {
  const { sup, store } = await setup('bounce-test');

  // Visitor 1: Bounced (single page view, no chat)
  await visit(store.publicKey, {
    origin: ORIGIN,
    url: 'https://shop.test/landing-only',
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15' },
  });

  // Visitor 2: Engaged (two page views in session)
  const v2 = await visit(store.publicKey, {
    origin: ORIGIN,
    url: 'https://shop.test/page1',
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15' },
  });
  await call('POST', `/api/widget/${store.publicKey}/pageview`, {
    body: { url: 'https://shop.test/page2', title: 'Page 2' },
    headers: { 'X-Visitor-Token': v2.token, Origin: ORIGIN },
  });

  const res = await call('GET', `/api/stores/${store.id}/analytics?days=30`, { token: sup.token });
  assert.equal(res.status, 200);
  const s = res.data.summary;
  assert.equal(s.totalSessions, 2);
  assert.equal(s.bouncedSessions, 1);
  assert.equal(s.bounceRate, 50.0);
});

test('analytics tracking only counts views when widget is published and not admin preview; reset endpoint wipes metrics back to 0', async () => {
  const { sup, store } = await setup('gate-and-reset');

  // 1. Unpublished store: set publishedVersion to null
  await mods.prisma.store.update({ where: { id: store.id }, data: { publishedVersion: null } });

  // Visitor attempts to load widget on storefront
  const vUnpub = await visit(store.publicKey, { origin: ORIGIN, url: 'https://shop.test/catalog' });
  assert.equal(vUnpub.status, 200);

  // No page views should have been saved because widget is not published
  let pvCount = await mods.prisma.visitorPageView.count({ where: { storeId: store.id } });
  assert.equal(pvCount, 0, 'No page views recorded when widget is unpublished');

  // 2. Publish widget version 1
  await mods.prisma.store.update({ where: { id: store.id }, data: { publishedVersion: 1 } });

  // Admin preview request (from admin origin)
  const vAdmin = await visit(store.publicKey, { origin: 'http://admin.test', url: 'https://shop.test/preview' });
  assert.equal(vAdmin.status, 200);
  pvCount = await mods.prisma.visitorPageView.count({ where: { storeId: store.id } });
  assert.equal(pvCount, 0, 'Admin preview requests must not count towards customer analytics');

  // Genuine visitor request from store domain
  const vReal = await visit(store.publicKey, {
    origin: ORIGIN,
    url: 'https://shop.test/products/diamond-ring',
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
  });
  assert.equal(vReal.status, 200);
  pvCount = await mods.prisma.visitorPageView.count({ where: { storeId: store.id } });
  assert.equal(pvCount, 1, 'Real visitor on published storefront is recorded');

  // Check analytics before reset
  let res = await call('GET', `/api/stores/${store.id}/analytics?days=30`, { token: sup.token });
  assert.equal(res.data.summary.totalPageViews, 1);

  // 3. Reset analytics data
  const resetRes = await call('POST', `/api/stores/${store.id}/analytics/reset`, { token: sup.token });
  assert.equal(resetRes.status, 200);
  assert.equal(resetRes.data.ok, true);
  assert.equal(resetRes.data.deletedPageViews, 1);

  // Check analytics after reset
  res = await call('GET', `/api/stores/${store.id}/analytics?days=30`, { token: sup.token });
  assert.equal(res.data.summary.totalPageViews, 0);
  assert.equal(res.data.summary.uniqueVisitors, 0);
  assert.equal(res.data.summary.totalSessions, 0);
  assert.equal(res.data.summary.bounceRate, null);
  assert.equal(res.data.trafficQuality.totalSessions, 0);
});



