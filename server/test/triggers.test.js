import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import { start, stop, call, makeUser, makeStore, addMember, visit, say, socket, cid, mods, sleep } from './helpers.js';

let sup, owner, ownerB, store, storeB;
const ORIGIN = 'https://t.test';
const tpl = async (key) => (await call('GET', '/api/trigger-catalog', { token: owner.token })).data.templates.find((t) => t.key === key).trigger;
const execs = (triggerId) => mods.prisma.triggerExecution.findMany({ where: { triggerId }, orderBy: { createdAt: 'asc' } });
const settle = async () => { await mods.events.idle(); await sleep(30); await mods.events.idle(); };

async function createTrigger(body, token = owner.token, storeId = store.id) {
  const r = await call('POST', `/api/stores/${storeId}/triggers`, { token, body: { name: 'T', description: '', enabled: true, ...body } });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  return r.data;
}

async function visitorWithSocket() {
  const v = await visit(store.publicKey, { origin: ORIGIN });
  const ws = await socket(`/ws/visitor?key=${store.publicKey}&vt=${v.token}`, { Origin: ORIGIN });
  return { ...v, ws };
}

before(async () => {
  await start();
  sup = await makeUser('super@t.test', { role: 'SUPER_ADMIN' });
  owner = await makeUser('owner@t.test');
  ownerB = await makeUser('ownerb@t.test');
  store = await makeStore(sup.token, 'Trigger Store', ['t.test']);
  storeB = await makeStore(sup.token, 'Other Store', []);
  await addMember(sup.token, store.id, owner.email, 'OWNER');
  await addMember(sup.token, storeB.id, ownerB.email, 'OWNER');
});
after(stop);
beforeEach(async () => {
  mods.clock.reset();
  await mods.prisma.trigger.deleteMany({});
  await mods.prisma.job.deleteMany({});
});

test('welcome template: delayed, once per session, proactive message becomes first message', async () => {
  const t = await createTrigger({ ...(await tpl('welcome')), name: 'Welcome' });
  const v = await visitorWithSocket();
  // Page view happened before the socket connected; do another one now.
  await call('POST', `/api/widget/${store.publicKey}/pageview`, { body: { url: 'https://t.test/a' }, headers: { 'X-Visitor-Token': v.token, Origin: ORIGIN } });
  await settle();
  let ex = await execs(t.id);
  assert.equal(ex.length, 1, 'only one scheduled for the session despite 2 page views');
  assert.equal(ex[0].status, 'SCHEDULED');
  assert.equal(await mods.jobs.drain(), 0, 'not due yet');

  mods.clock.advance(31_000);
  await mods.jobs.drain();
  ex = await execs(t.id);
  assert.equal(ex[0].status, 'SUCCEEDED', JSON.stringify(ex[0]));
  const pro = await v.ws.waitFor('proactive');
  assert.match(pro.data.body, /Can we help/);
  assert.deepEqual(pro.data.meta.suggestedReplies, ['Yes, please', 'Just browsing']);
  assert.equal(await mods.prisma.conversation.count({ where: { visitorId: v.data.visitor.id } }), 0, 'no conversation until visitor replies');

  // Reload: pending proactive message is returned with the session.
  const reload = await visit(store.publicKey, { origin: ORIGIN, token: v.token });
  assert.equal(reload.data.proactive.executionId, ex[0].id);
  await settle();
  assert.equal((await execs(t.id)).length, 1, 'no re-run in same session');

  const reply = await say(store.publicKey, v.token, 'Yes, please', { proactiveExecutionId: ex[0].id }, ORIGIN);
  const msgs = await mods.prisma.message.findMany({ where: { conversationId: reply.data.conversationId }, orderBy: { seq: 'asc' } });
  assert.deepEqual(msgs.map((m) => m.senderType), ['BOT', 'VISITOR']);
  assert.equal(msgs[0].triggerId, t.id);
  await v.ws.close();
});

test('chat rescue: condition recheck after delay (agent replied → skipped; no reply → actions run)', async () => {
  const t = await createTrigger({ ...(await tpl('chat_rescue')), name: 'Rescue' });
  const agentWs = await socket(`/ws/agent?token=${owner.token}`);

  // A) agent answers within the delay
  const a = await visitorWithSocket();
  const ca = (await say(store.publicKey, a.token, 'help?', {}, ORIGIN)).data.conversationId;
  await settle();
  await call('POST', `/api/stores/${store.id}/conversations/${ca}/messages`, { token: owner.token, body: { body: 'Hi!', clientMsgId: cid() } });
  // B) nobody answers
  const b = await visitorWithSocket();
  const cb = (await say(store.publicKey, b.token, 'anyone?', {}, ORIGIN)).data.conversationId;
  await settle();

  mods.clock.advance(61_000);
  await mods.jobs.drain();
  const [ea, eb] = [(await mods.prisma.triggerExecution.findFirst({ where: { triggerId: t.id, conversationId: ca } })), (await mods.prisma.triggerExecution.findFirst({ where: { triggerId: t.id, conversationId: cb } }))];
  assert.equal(ea.status, 'SKIPPED');
  assert.match(ea.reason, /no longer match/);
  assert.equal(eb.status, 'SUCCEEDED', JSON.stringify(eb.details));
  const convB = await mods.prisma.conversation.findUnique({ where: { id: cb } });
  assert.equal(convB.priority, 'HIGH');
  const bot = await mods.prisma.message.findFirst({ where: { conversationId: cb, senderType: 'BOT' } });
  assert.deepEqual(bot.meta.form.fields, ['name', 'email']);
  await b.ws.waitFor('message', (d) => d.message.senderType === 'BOT');
  await agentWs.waitFor('notification', (d) => d.kind === 'trigger' && d.conversationId === cb);
  // Email action is reported honestly (no SMTP in tests).
  const notify = eb.details.actions.find((x) => x.type === 'notify');
  assert.equal(notify.emailNote, 'SMTP not configured - email not sent');
  // Expiry not touched by bot message.
  assert.equal(convB.expiresAt.getTime(), convB.lastActivityAt.getTime() + 30 * 86_400_000);
  await Promise.all([a.ws.close(), b.ws.close(), agentWs.close()]);
});

test('idempotency: the same event delivered twice runs once', async () => {
  const t = await createTrigger({ kind: 'ADVANCED', event: 'visitor_message', delaySeconds: 0, match: 'ALL', conditions: [], actions: [{ type: 'add_tags', tags: ['seen'] }], frequency: 'EVERY_TIME', cooldownSeconds: 0 });
  const v = await visit(store.publicKey, { origin: ORIGIN });
  const m = await say(store.publicKey, v.token, 'x', {}, ORIGIN);
  await settle();
  const evt = { storeId: store.id, event: 'visitor_message', visitorId: v.data.visitor.id, conversationId: m.data.conversationId, sourceId: m.data.message.id };
  await Promise.all([mods.engine.dispatch(evt), mods.engine.dispatch(evt), mods.engine.dispatch(evt)]);
  assert.equal((await execs(t.id)).length, 1);
});

test('disable / edit / delete cancel pending delayed executions', async () => {
  const body = { kind: 'ADVANCED', event: 'chat_requested', delaySeconds: 120, match: 'ALL', conditions: [], actions: [{ type: 'set_priority', priority: 'URGENT' }], frequency: 'ONCE_PER_CONVERSATION', cooldownSeconds: 0 };
  const t = await createTrigger(body);
  const v = await visit(store.publicKey, { origin: ORIGIN });
  const c1 = (await say(store.publicKey, v.token, 'one', {}, ORIGIN)).data.conversationId;
  await settle();
  assert.equal((await execs(t.id))[0].status, 'SCHEDULED');
  await call('PATCH', `/api/stores/${store.id}/triggers/${t.id}/enabled`, { token: owner.token, body: { enabled: false } });
  const ex = await execs(t.id);
  assert.equal(ex[0].status, 'CANCELLED');
  assert.equal((await mods.prisma.job.findFirst({ where: { dedupeKey: `exec:${ex[0].id}` } })).status, 'CANCELLED');

  // Edit → version bump cancels; even if a stale job ran it would be cancelled by version check.
  await call('PATCH', `/api/stores/${store.id}/triggers/${t.id}/enabled`, { token: owner.token, body: { enabled: true } });
  const v2 = await visit(store.publicKey, { origin: ORIGIN });
  await say(store.publicKey, v2.token, 'two', {}, ORIGIN);
  await settle();
  const pending = (await execs(t.id)).find((e) => e.status === 'SCHEDULED');
  await call('PUT', `/api/stores/${store.id}/triggers/${t.id}`, { token: owner.token, body: { ...body, name: 'T2', actions: [{ type: 'set_priority', priority: 'LOW' }] } });
  assert.equal((await mods.prisma.triggerExecution.findUnique({ where: { id: pending.id } })).status, 'CANCELLED');
  mods.clock.advance(121_000);
  await mods.jobs.drain();
  assert.equal((await mods.prisma.conversation.findUnique({ where: { id: c1 } })).priority, 'NORMAL', 'cancelled action never ran');
});

test('frequency + loop guard limit automated actions', async () => {
  const t = await createTrigger({ kind: 'ADVANCED', event: 'visitor_message', delaySeconds: 0, match: 'ALL', conditions: [], actions: [{ type: 'send_message', text: 'auto' }], frequency: 'EVERY_TIME', cooldownSeconds: 0 });
  const v = await visit(store.publicKey, { origin: ORIGIN });
  for (let i = 0; i < 13; i++) { await say(store.publicKey, v.token, `m${i}`, {}, ORIGIN); await settle(); }
  const ex = await execs(t.id);
  assert.equal(ex.filter((e) => e.status === 'SUCCEEDED').length, 10);
  assert.ok(ex.filter((e) => e.status === 'SKIPPED').every((e) => /Loop guard/.test(e.reason)));

  // Cooldown
  await mods.prisma.trigger.deleteMany({});
  const t2 = await createTrigger({ kind: 'ADVANCED', event: 'visitor_message', delaySeconds: 0, match: 'ALL', conditions: [], actions: [{ type: 'add_tags', tags: ['vip'] }], frequency: 'EVERY_TIME', cooldownSeconds: 600 });
  mods.clock.advance(120_000);
  const v2 = await visit(store.publicKey, { origin: ORIGIN });
  await say(store.publicKey, v2.token, 'a', {}, ORIGIN); await settle();
  await say(store.publicKey, v2.token, 'b', {}, ORIGIN); await settle();
  const e2 = await execs(t2.id);
  assert.deepEqual(e2.map((e) => e.status), ['SUCCEEDED', 'SKIPPED']);
  assert.match(e2[1].reason, /Cooldown/);
});

test('ANY/ALL matching and operators', () => {
  const { conditionsMatch, evalCondition } = mods.engine;
  const values = { 'page.url': 'https://t.test/Checkout/step1', 'visitor.timeOnSite': 45, 'chat.tags': ['vip'], 'agents.available': false, 'agents.status': 'Offline', 'chat.status': 'OPEN' };
  assert.ok(evalCondition({ field: 'page.url', op: 'contains', value: 'checkout' }, values));
  assert.ok(evalCondition({ field: 'page.url', op: 'starts_with', value: 'https://t.test' }, values));
  assert.ok(!evalCondition({ field: 'page.url', op: 'ends_with', value: 'cart' }, values));
  assert.ok(evalCondition({ field: 'visitor.timeOnSite', op: 'gte', value: 45 }, values));
  assert.ok(!evalCondition({ field: 'visitor.timeOnSite', op: 'gt', value: 45 }, values));
  assert.ok(evalCondition({ field: 'chat.tags', op: 'contains', value: 'VIP' }, values));
  assert.ok(evalCondition({ field: 'agents.available', op: 'is_false' }, values));
  assert.ok(evalCondition({ field: 'chat.status', op: 'neq', value: 'RESOLVED' }, values));
  const conds = [{ field: 'visitor.timeOnSite', op: 'gt', value: 100 }, { field: 'agents.available', op: 'is_false' }];
  assert.equal(conditionsMatch({ match: 'ALL', conditions: conds }, values).ok, false);
  assert.equal(conditionsMatch({ match: 'ANY', conditions: conds }, values).ok, true);
});

test('validation: unsupported actions, bad operators and foreign references are rejected', async () => {
  const base = { name: 'x', kind: 'ADVANCED', event: 'chat_requested', delaySeconds: 0, match: 'ALL', conditions: [], frequency: 'EVERY_TIME' };
  const bad = [
    { ...base, actions: [{ type: 'delete_database' }] },
    { ...base, actions: [] },
    { ...base, conditions: [{ field: 'visitor.timeOnSite', op: 'contains', value: 'x' }], actions: [{ type: 'add_tags', tags: ['a'] }] },
    { ...base, conditions: [{ field: 'nope', op: 'eq', value: 1 }], actions: [{ type: 'add_tags', tags: ['a'] }] },
    { ...base, event: 'made_up', actions: [{ type: 'add_tags', tags: ['a'] }] },
    { ...base, actions: [{ type: 'assign', mode: 'agent' }] },
  ];
  for (const b of bad) assert.equal((await call('POST', `/api/stores/${store.id}/triggers`, { token: owner.token, body: b })).status, 400, JSON.stringify(b));
  const reply = await call('POST', `/api/stores/${storeB.id}/saved-replies`, { token: ownerB.token, body: { shortcut: 'hi', title: 'Hi', body: 'Hello from B' } });
  assert.equal((await call('POST', `/api/stores/${store.id}/triggers`, { token: owner.token, body: { ...base, actions: [{ type: 'send_saved_reply', savedReplyId: reply.data.id }] } })).status, 400);
  assert.equal((await call('POST', `/api/stores/${store.id}/triggers`, { token: owner.token, body: { ...base, actions: [{ type: 'assign', mode: 'agent', agentId: ownerB.id }] } })).status, 400);
  // Logs are store-scoped
  assert.equal((await call('GET', `/api/stores/${store.id}/trigger-logs`, { token: ownerB.token })).status, 403);
});

test('approved webhook action delivers a signed request; offline-support uses business hours', async () => {
  const received = [];
  const srv = http.createServer((req, res) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => { received.push({ headers: req.headers, body: b }); res.end('ok'); }); });
  await new Promise((r) => srv.listen(0, r));
  const hook = await call('POST', `/api/stores/${store.id}/webhooks`, { token: owner.token, body: { name: 'CRM', url: `http://127.0.0.1:${srv.address().port}/hook`, events: [] } });
  assert.equal(hook.status, 201);
  // Business hours: enabled with no open slots → always closed.
  const w = await call('GET', `/api/stores/${store.id}/widget`, { token: owner.token });
  const days = Object.fromEntries(Object.keys(w.data.draft.businessHours.days).map((d) => [d, []]));
  await call('PUT', `/api/stores/${store.id}/widget/draft`, { token: owner.token, body: { ...w.data.draft, businessHours: { enabled: true, timezone: 'UTC', days } } });
  await call('POST', `/api/stores/${store.id}/widget/publish`, { token: owner.token, body: {} });

  const off = await tpl('offline_support');
  const t = await createTrigger({ ...off, name: 'Offline', actions: [...off.actions, { type: 'webhook', webhookId: hook.data.id }] });
  const v = await visit(store.publicKey, { origin: ORIGIN });
  assert.equal(v.data.availability.online, false);
  const c = (await say(store.publicKey, v.token, 'hello?', {}, ORIGIN)).data.conversationId;
  await settle();
  const ex = (await execs(t.id))[0];
  assert.equal(ex.status, 'SUCCEEDED', JSON.stringify(ex.details));
  assert.deepEqual((await mods.prisma.conversation.findUnique({ where: { id: c } })).tags, ['after-hours']);
  await mods.jobs.drain();
  assert.equal(received.length, 1);
  const r0 = received[0];
  const expected = 'sha256=' + crypto.createHmac('sha256', hook.data.secret).update(`${r0.headers['x-livechat-timestamp']}.${r0.body}`).digest('hex');
  assert.equal(r0.headers['x-livechat-signature'], expected);
  assert.equal(JSON.parse(r0.body).data.triggerId, t.id);
  srv.close();
});

test('no-reply follow-up fires only if the visitor stays silent', async () => {
  const t = await createTrigger({ ...(await tpl('no_reply_followup')), name: 'Follow-up' });
  const v = await visit(store.publicKey, { origin: ORIGIN });
  const c = (await say(store.publicKey, v.token, 'question', {}, ORIGIN)).data.conversationId;
  await call('POST', `/api/stores/${store.id}/conversations/${c}/messages`, { token: owner.token, body: { body: 'answer', clientMsgId: cid() } });
  await settle();
  mods.clock.advance(301_000);
  await mods.jobs.drain();
  assert.equal((await execs(t.id))[0].status, 'SUCCEEDED');
  assert.ok(await mods.prisma.message.findFirst({ where: { conversationId: c, senderType: 'BOT', body: { contains: 'still there' } } }));

  // Second round: visitor replies in time → skipped.
  await call('POST', `/api/stores/${store.id}/conversations/${c}/messages`, { token: owner.token, body: { body: 'anything else?', clientMsgId: cid() } });
  await settle();
  mods.clock.advance(1801_000); // past cooldown too
  await say(store.publicKey, v.token, 'nope thanks', {}, ORIGIN);
  await mods.jobs.drain();
  const ex = await execs(t.id);
  assert.equal(ex.at(-1).status, 'SKIPPED');
});

test('regression: delayed page_view trigger links to conversation started during delay and evaluates chat.exists correctly', async () => {
  const t = await createTrigger({
    name: 'Proactive only if no chat',
    kind: 'BASIC',
    event: 'page_view',
    delaySeconds: 10,
    match: 'ALL',
    conditions: [
      { field: 'page.url', op: 'contains', value: '/cart' },
      { field: 'chat.exists', op: 'is_false' },
    ],
    actions: [{ type: 'send_message', text: 'Do you need help?' }],
    frequency: 'EVERY_TIME',
    cooldownSeconds: 0,
  });

  const v = await visit(store.publicKey, { origin: ORIGIN, url: 'https://t.test/cart' });
  const ws = await socket(`/ws/visitor?key=${store.publicKey}&vt=${v.token}`, { Origin: ORIGIN });
  await settle();

  let ex = await execs(t.id);
  assert.equal(ex.length, 1);
  assert.equal(ex[0].status, 'SCHEDULED');
  assert.equal(ex[0].conversationId, null);

  const c = (await say(store.publicKey, v.token, 'I have a question about checkout', {}, ORIGIN)).data.conversationId;
  assert.ok(c);

  mods.clock.advance(15_000);
  await mods.jobs.drain();

  ex = await execs(t.id);
  assert.equal(ex[0].status, 'SKIPPED');
  assert.equal(ex[0].conversationId, c, 'execution conversationId was linked to the active conversation');
  assert.match(ex[0].reason, /no longer match/);

  await ws.close();
});

test('regression: EVERY_TIME trigger with cooldown prevents duplicate scheduled runs while one is pending', async () => {
  const t = await createTrigger({
    name: 'Rate limited page alert',
    kind: 'ADVANCED',
    event: 'page_view',
    delaySeconds: 15,
    match: 'ALL',
    conditions: [],
    actions: [{ type: 'send_message', text: 'Still browsing?' }],
    frequency: 'EVERY_TIME',
    cooldownSeconds: 60,
  });

  const v = await visitorWithSocket();
  await call('POST', `/api/widget/${store.publicKey}/pageview`, { body: { url: 'https://t.test/page1' }, headers: { 'X-Visitor-Token': v.token, Origin: ORIGIN } });
  await settle();

  await call('POST', `/api/widget/${store.publicKey}/pageview`, { body: { url: 'https://t.test/page2' }, headers: { 'X-Visitor-Token': v.token, Origin: ORIGIN } });
  await settle();

  const ex = await execs(t.id);
  assert.equal(ex.length, 1, 'duplicate scheduled run was blocked by cooldown');

  await v.ws.close();
});


test('tawk.to-style conditions: location, software, search, page info, statuses, served', async () => {
  const { buildContext } = mods.engine;
  const v = await visit(store.publicKey, { origin: ORIGIN, url: 'https://t.test/a', title: 'A' });
  const vid = v.data.visitor.id;
  await visit(store.publicKey, { origin: ORIGIN, token: v.token, url: 'https://t.test/b', title: 'B' });
  await mods.prisma.visitor.update({ where: { id: vid }, data: {
    ip: '203.0.113.9', country: 'IN', city: 'Surat', referrer: 'https://www.bing.com/search?q=lab+diamond+ring',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  } });
  const x = (await buildContext({ storeId: store.id, visitorId: vid })).values;
  assert.equal(x['visitor.ip'], '203.0.113.9');
  assert.equal(x['visitor.country'], 'India');
  assert.equal(x['visitor.city'], 'Surat');
  assert.equal(x['visitor.browser'], 'Safari');
  assert.equal(x['visitor.platform'], 'iOS');
  assert.equal(x['visitor.searchEngine'], 'Bing');
  assert.equal(x['visitor.searchTerms'], 'lab diamond ring');
  assert.equal(x['page.previous'], 'https://t.test/a');
  assert.equal(x['page.timeOnPage'], 0);
  assert.equal(x['widget.status'], x['businessHours.open'] ? 'Online' : 'Offline');
  assert.equal(x['chat.served'], false);
  mods.clock.advance(90_000);
  assert.equal((await buildContext({ storeId: store.id, visitorId: vid })).values['page.timeOnPage'], 90);
  mods.clock.reset();
  assert.equal(mods.engine.evalCondition({ field: 'visitor.country', op: 'eq', value: 'india' }, x), true);
  assert.equal(mods.engine.evalCondition({ field: 'visitor.browser', op: 'eq', value: 'Chrome' }, x), false);
});

test('"Still on page" wait: runs only if the visitor stays on the same page; durations are stored in seconds', async () => {
  const t = await createTrigger({ kind: 'ADVANCED', event: 'page_view', delaySeconds: 0, match: 'ALL', frequency: 'EVERY_TIME', cooldownSeconds: 0,
    conditions: [{ field: 'wait_page', op: 'for', value: 7200 }, { field: 'chat.exists', op: 'is_false' }],
    actions: [{ type: 'send_message', text: 'Need help with this page?' }] });
  assert.equal(t.conditions[0].value, 7200, '2 hours = 7200 s');

  const stay = await visitorWithSocket();
  await settle();
  mods.clock.advance(7201_000);
  await mods.jobs.drain();
  const [e1] = (await execs(t.id)).filter((e) => e.visitorId === stay.data.visitor.id);
  assert.equal(e1.status, 'SUCCEEDED');

  mods.clock.reset();
  const leave = await visitorWithSocket();
  await settle();
  await visit(store.publicKey, { origin: ORIGIN, token: leave.token, url: 'https://t.test/other' });
  await settle();
  mods.clock.advance(7201_000);
  await mods.jobs.drain();
  const first = (await execs(t.id)).filter((e) => e.visitorId === leave.data.visitor.id)[0];
  assert.equal(first.status, 'SKIPPED');
  assert.match(first.reason, /left the page/);
  stay.ws.close(); leave.ws.close();
});

test('plain tawk.to labels; legacy "agents available / visitor connected is true" become "status Equals Online/Offline"', async () => {
  const cat = (await call('GET', '/api/trigger-catalog', { token: owner.token })).data;
  for (const f of cat.fields) assert.ok(!/[()]/.test(f.label), `no bracket text in "${f.label}"`);
  const field = (k) => cat.fields.find((f) => f.key === k);
  assert.equal(field('wait').label, 'Still on site');
  assert.equal(field('wait_page').label, 'Still on page');
  assert.deepEqual(field('agents.status').options, ['Online', 'Offline']);
  assert.equal(field('agents.available'), undefined, 'old field no longer offered');

  // A trigger saved earlier with the old fields (written directly, as an old version would have).
  const t = await mods.prisma.trigger.create({ data: { storeId: store.id, name: 'old', enabled: true, kind: 'ADVANCED', event: 'chat_requested', delaySeconds: 0, match: 'ALL', frequency: 'EVERY_TIME', cooldownSeconds: 0,
    conditions: [{ field: 'agents.available', op: 'is_false' }, { field: 'visitor.online', op: 'is_true' }], actions: [{ type: 'add_tags', tags: ['x'] }] } });
  const got = await call('GET', `/api/stores/${store.id}/triggers/${t.id}`, { token: owner.token });
  assert.deepEqual(got.data.conditions, [{ field: 'agents.status', op: 'eq', value: 'Offline' }, { field: 'visitor.status', op: 'eq', value: 'Online' }]);
  const { evalCondition } = mods.engine;
  assert.ok(evalCondition({ field: 'agents.available', op: 'is_false' }, { 'agents.status': 'Offline' }), 'old saved form still evaluates');
  const saved = await call('PUT', `/api/stores/${store.id}/triggers/${t.id}`, { token: owner.token, body: { name: 'old', enabled: true, kind: 'ADVANCED', event: 'chat_requested', delaySeconds: 0, match: 'ALL', frequency: 'EVERY_TIME', cooldownSeconds: 0,
    conditions: [{ field: 'agents.available', op: 'is_true' }], actions: [{ type: 'add_tags', tags: ['x'] }] } });
  assert.equal(saved.status, 200);
  assert.deepEqual((await mods.prisma.trigger.findUnique({ where: { id: t.id } })).conditions, [{ field: 'agents.status', op: 'eq', value: 'Online' }]);
});

test('a trigger repeating the widget please-wait text does not post it a second time', async () => {
  const wait = (await call('GET', `/api/stores/${store.id}/widget`, { token: owner.token })).data.draft.messages.afterPrechat;
  const t = await createTrigger({ kind: 'ADVANCED', event: 'visitor_message', delaySeconds: 0, match: 'ALL', frequency: 'ONCE_PER_CONVERSATION', cooldownSeconds: 0,
    conditions: [{ field: 'wait', op: 'for', value: 1 }], actions: [{ type: 'send_message', text: wait }] });
  const v = await visit(store.publicKey, { origin: ORIGIN });
  const r = await say(store.publicKey, v.token, 'Name : A\nQuestion : hi', { prechat: true }, ORIGIN);
  await settle();
  mods.clock.advance(2_000);
  await mods.jobs.drain();
  await settle();
  const msgs = await mods.prisma.message.findMany({ where: { conversationId: r.data.conversationId }, orderBy: { seq: 'asc' } });
  assert.equal(msgs.filter((m) => m.body === wait).length, 1, 'please-wait shown once');
  const [e] = await execs(t.id);
  assert.match(JSON.stringify(e.details), /same message was just sent/);
});

test('"Visitor page path" identifies the home page regardless of query strings', async () => {
  const { pathOf, evalCondition } = mods.engine;
  assert.equal(pathOf('https://crownmoissanite.com/?srsltid=abc'), '/');
  assert.equal(pathOf('https://crownmoissanite.com'), '/');
  assert.equal(pathOf('https://crownmoissanite.com/collections/most-loved-rings/'), '/collections/most-loved-rings');
  assert.equal(pathOf(''), '');
  const home = { field: 'page.path', op: 'eq', value: '/' };
  assert.ok(evalCondition(home, { 'page.path': pathOf('https://s.test/?x=1') }));
  assert.ok(!evalCondition(home, { 'page.path': pathOf('https://s.test/collections/a') }));
});

test('main admin copies a store\'s triggers to other stores: same names skipped, store-specific references skipped', async () => {
  const s2 = await makeStore(sup.token, 'Copy target', []);
  const welcome = await createTrigger({ name: 'Welcome message', kind: 'BASIC', event: 'page_view', delaySeconds: 2, match: 'ALL', frequency: 'ONCE_PER_VISITOR', cooldownSeconds: 0,
    conditions: [{ field: 'page.path', op: 'eq', value: '/' }], actions: [{ type: 'send_message', text: 'Welcome!' }] });
  await createTrigger({ name: 'Rescue', kind: 'ADVANCED', event: 'chat_requested', delaySeconds: 0, match: 'ALL', frequency: 'ONCE_PER_CONVERSATION', cooldownSeconds: 0,
    conditions: [{ field: 'wait', op: 'for', value: 120 }, { field: 'chat.served', op: 'is_false' }], actions: [{ type: 'send_message', text: 'Sorry for the wait' }] });
  await createTrigger({ name: 'Assign Ann', kind: 'ADVANCED', event: 'chat_requested', delaySeconds: 0, match: 'ALL', frequency: 'EVERY_TIME', cooldownSeconds: 0,
    conditions: [], actions: [{ type: 'assign', mode: 'agent', agentId: owner.id }] });
  await mods.prisma.trigger.create({ data: { storeId: s2.id, name: 'rescue', enabled: true, kind: 'ADVANCED', event: 'chat_requested', delaySeconds: 0, match: 'ALL', frequency: 'EVERY_TIME', cooldownSeconds: 0, conditions: [], actions: [{ type: 'add_tags', tags: ['mine'] }] } });

  assert.equal((await call('POST', `/api/stores/${store.id}/triggers/copy`, { token: owner.token, body: { storeIds: [s2.id] } })).status, 403, 'store owners cannot');
  const r = await call('POST', `/api/stores/${store.id}/triggers/copy`, { token: sup.token, body: { storeIds: [s2.id, store.id] } });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.stores.length, 1, 'the source store itself is ignored');
  const row = r.data.stores[0];
  assert.deepEqual(row.copied, ['Welcome message']);
  assert.deepEqual(row.skipped.map((x) => x.name).sort(), ['Assign Ann', 'Rescue']);
  assert.match(row.skipped.find((x) => x.name === 'Assign Ann').reason, /not a member/);
  const copied = await mods.prisma.trigger.findFirst({ where: { storeId: s2.id, name: 'Welcome message' } });
  assert.deepEqual(copied.conditions, welcome.conditions);
  assert.notEqual(copied.id, welcome.id);
  assert.equal((await mods.prisma.trigger.findFirst({ where: { storeId: s2.id, name: 'rescue' } })).actions[0].tags[0], 'mine', 'existing trigger untouched');
  // Running it again copies nothing new.
  const again = await call('POST', `/api/stores/${store.id}/triggers/copy`, { token: sup.token, body: { storeIds: [s2.id] } });
  assert.deepEqual(again.data.stores[0].copied, []);
});
