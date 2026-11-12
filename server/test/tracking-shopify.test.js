// Visitor page tracking in conversations, availability without agent presence, and the Shopify
// customer/last-order lookup (Shopify itself is simulated: no real store is contacted).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start, stop, call, makeUser, makeStore, addMember, visit, say, socket, mods, DAY } from './helpers.js';

let sup, owner, agent, store, other, otherOwner;
const O = 'https://track.test';
const realFetch = globalThis.fetch;
const shopifyCalls = [];
let shopifyReply = null;

before(async () => {
  await start();
  // Only Shopify Admin API calls are intercepted; everything else (the test client) is real.
  globalThis.fetch = async (url, opts) => {
    if (String(url).includes('.myshopify.com/')) {
      shopifyCalls.push({ url: String(url), headers: opts.headers, body: JSON.parse(opts.body) });
      const r = shopifyReply(JSON.parse(opts.body));
      return new Response(JSON.stringify(r.body), { status: r.status || 200, headers: { 'Content-Type': 'application/json' } });
    }
    return realFetch(url, opts);
  };
  sup = await makeUser('super@track.test', { role: 'SUPER_ADMIN' });
  owner = await makeUser('owner@track.test');
  agent = await makeUser('agent@track.test');
  otherOwner = await makeUser('other@track.test');
  store = await makeStore(sup.token, 'Track Store', ['track.test']);
  other = await makeStore(sup.token, 'Other Track', []);
  await addMember(sup.token, store.id, owner.email, 'OWNER');
  await addMember(sup.token, store.id, agent.email, 'AGENT');
  await addMember(sup.token, other.id, otherOwner.email, 'OWNER');
});
after(async () => { globalThis.fetch = realFetch; await stop(); });

const pageview = (token, url, title) => call('POST', `/api/widget/${store.publicKey}/pageview`, { headers: { 'X-Visitor-Token': token, Origin: O }, body: { url, title } });

test('chat is available without any agent online (no presence status)', async () => {
  const v = await visit(store.publicKey, { origin: O });
  assert.equal(v.data.availability.online, true);
  assert.equal(v.data.availability.agentsOnline, undefined);
  assert.equal(v.data.config.retentionDays, 30, 'widget gets the retention period for its notice');
});

test('page views appear in the conversation in order, live, and only for this store', async () => {
  const v = await visit(store.publicKey, { origin: O, url: 'https://track.test/', title: 'Home – Track' });
  const chat = await say(store.publicKey, v.token, 'hi', {}, O);
  const ownerWs = await socket(`/ws/agent?token=${owner.token}`);
  const otherWs = await socket(`/ws/agent?token=${otherOwner.token}`);
  assert.equal((await pageview(v.token, 'https://track.test/cart', 'Your Shopping Cart – Track')).status, 200);
  await pageview(v.token, 'https://track.test/cart', 'Your Shopping Cart – Track'); // immediate repeat is ignored
  await pageview(v.token, 'https://track.test/faq', 'FAQ');
  const live = await ownerWs.waitFor('visitor_page', (d) => d.page?.url === 'https://track.test/faq');
  assert.equal(live.data.page.title, 'FAQ');

  const d = await call('GET', `/api/stores/${store.id}/conversations/${chat.data.conversationId}`, { token: owner.token });
  assert.deepEqual(d.data.pages.map((p) => p.url), ['https://track.test/', 'https://track.test/cart', 'https://track.test/faq']);
  assert.ok(!otherWs.events.some((e) => e.type === 'visitor_page'), 'other store sees no navigation');
  const vw = await call('GET', `/api/widget/${store.publicKey}/conversations/${chat.data.conversationId}/messages?after=0`, { headers: { 'X-Visitor-Token': v.token, Origin: O } });
  assert.ok(!JSON.stringify(vw.data).includes('track.test/cart'), 'visitor never receives their page history');
  await Promise.all([ownerWs.close(), otherWs.close()]);

  // Retention: page views older than the store's retention window are deleted.
  await mods.prisma.visitorPageView.updateMany({ where: { url: 'https://track.test/' }, data: { createdAt: new Date(Date.now() - 31 * DAY) } });
  await mods.retention.sweepPageViews();
  assert.equal(await mods.prisma.visitorPageView.count({ where: { url: 'https://track.test/' } }), 0);
  assert.equal(await mods.prisma.visitorPageView.count({ where: { url: 'https://track.test/faq' } }), 1);
});

test('shopify: admin-only settings, domain validation, token never returned', async () => {
  const S = `/api/stores/${store.id}/integrations/shopify`;
  assert.equal((await call('PUT', S, { token: agent.token, body: { domain: 'x.myshopify.com', token: 'shpat_test_000000' } })).status, 403);
  assert.equal((await call('PUT', S, { token: owner.token, body: { domain: 'evil.example.com', token: 'shpat_test_000000' } })).status, 400);
  const saved = await call('PUT', S, { token: owner.token, body: { domain: 'https://Track-Shop.myshopify.com/admin', token: 'shpat_test_000000' } });
  assert.equal(saved.status, 200);
  assert.deepEqual(saved.data, { domain: 'track-shop.myshopify.com', connected: true });
  assert.ok(!JSON.stringify((await call('GET', S, { token: owner.token })).data).includes('shpat'));
  const row = await mods.prisma.store.findUnique({ where: { id: store.id } });
  assert.ok(row.shopifyToken && !row.shopifyToken.includes('shpat'), 'stored encrypted');
});

test('shopify: customer + last order for the visitor email; errors and isolation', async () => {
  const v = await visit(store.publicKey, { origin: O });
  const chat = await say(store.publicKey, v.token, 'where is my order?', {}, O);
  const convId = chat.data.conversationId;
  const L = (q = '', token = owner.token, storeId = store.id) => call('GET', `/api/stores/${storeId}/conversations/${convId}/shopify${q}`, { token });

  const noEmail = await L();
  assert.deepEqual(noEmail.data, { connected: true, email: null, customer: null });

  shopifyReply = () => ({ body: { data: { customers: { nodes: [{
    id: 'gid://shopify/Customer/99', legacyResourceId: '99', displayName: 'John R Campbell', defaultEmailAddress: { emailAddress: 'john@x.test' },
    defaultPhoneNumber: null, createdAt: '2026-05-31T17:13:00Z', numberOfOrders: '2', amountSpent: { amount: '450.00', currencyCode: 'USD' },
    tags: ['Shop'], state: 'ENABLED',
    lastOrder: { id: 'gid://shopify/Order/7', legacyResourceId: '7', name: '#1007', createdAt: '2026-09-01T10:00:00Z', displayFinancialStatus: 'PAID',
      displayFulfillmentStatus: 'FULFILLED', totalPriceSet: { shopMoney: { amount: '250.00', currencyCode: 'USD' } }, lineItems: { nodes: [{ title: 'Diamond ring', quantity: 1 }] } },
  }] } } } });
  const r = await L('?email=John%40x.test');
  assert.equal(r.status, 200);
  const call0 = shopifyCalls.at(-1);
  assert.equal(call0.url, 'https://track-shop.myshopify.com/admin/api/2026-07/graphql.json');
  assert.equal(call0.headers['X-Shopify-Access-Token'], 'shpat_test_000000');
  assert.equal(call0.body.variables.q, 'email:"john@x.test"');
  assert.equal(r.data.customer.name, 'John R Campbell');
  assert.equal(r.data.customer.ordersCount, 2);
  assert.equal(r.data.customer.lastOrder.name, '#1007');
  assert.deepEqual(r.data.customer.lastOrder.items, [{ title: 'Diamond ring', quantity: 1 }]);
  assert.equal(r.data.customer.lastOrder.adminUrl, 'https://admin.shopify.com/store/track-shop/orders/7');

  shopifyReply = () => ({ body: { data: { customers: { nodes: [] } } } });
  assert.equal((await L('?email=nobody%40x.test')).data.customer, null);
  shopifyReply = () => ({ status: 401, body: { errors: 'Invalid API key' } });
  const bad = await L('?email=john%40x.test');
  assert.equal(bad.status, 502);
  assert.match(bad.data.error, /rejected the access token/);
  assert.equal((await L('?email=not-an-email')).status, 400);
  assert.equal((await L('', otherOwner.token, other.id)).status, 404, "another store can't look up this chat");
  assert.deepEqual((await call('GET', `/api/stores/${other.id}/integrations/shopify`, { token: otherOwner.token })).data, { domain: null, connected: false });
});
