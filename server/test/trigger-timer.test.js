// "Timer starts from": trigger event (original) vs last customer message vs last message in the conversation.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { start, stop, call, makeUser, makeStore, visit, say, cid, mods, sleep } from './helpers.js';

const ORIGIN = 'https://timer.test';
let sup, store, other;
const MIN = 60_000;
const settle = async () => { await mods.events.idle(); await sleep(30); await mods.events.idle(); };
const run = async (ms) => { mods.clock.advance(ms); await mods.jobs.drain(); await settle(); };
const execs = (triggerId, conversationId) => mods.prisma.triggerExecution.findMany({ where: { triggerId, ...(conversationId ? { conversationId } : {}) }, orderBy: { createdAt: 'asc' } });
const bots = (conversationId, text) => mods.prisma.message.count({ where: { conversationId, senderType: 'BOT', body: text } });

const base = (extra = {}) => ({ name: `T ${Math.random()}`, description: '', enabled: true, kind: 'ADVANCED', event: 'chat_requested', delaySeconds: 180, match: 'ALL', frequency: 'ONCE_PER_CONVERSATION', cooldownSeconds: 0, conditions: [{ field: 'chat.served', op: 'is_false' }], actions: [{ type: 'send_message', text: 'Rescue!' }], ...extra });
async function create(body, storeId = store.id) {
  const r = await call('POST', `/api/stores/${storeId}/triggers`, { token: sup.token, body });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  return r.data;
}
async function chat(text = 'hello') {
  const v = await visit(store.publicKey, { origin: ORIGIN });
  const r = await say(store.publicKey, v.token, text, {}, ORIGIN);
  await settle();
  return { token: v.token, convId: r.data.conversationId };
}
const customer = async (c, text) => { await say(store.publicKey, c.token, text, {}, ORIGIN); await settle(); };
const agent = async (c, text) => { await call('POST', `/api/stores/${store.id}/conversations/${c.convId}/messages`, { token: sup.token, body: { body: text, clientMsgId: cid() } }); await settle(); };

before(async () => {
  await start();
  sup = await makeUser('sup@timer.test', { role: 'SUPER_ADMIN' });
  store = await makeStore(sup.token, 'Timer store', ['timer.test']);
  other = await makeStore(sup.token, 'Other timer store', ['timer.test']);
  // The super admin replies as a member (so replies count as agent messages).
  await mods.prisma.storeMember.create({ data: { userId: sup.id, storeId: store.id, role: 'OWNER' } });
});
after(stop);
beforeEach(async () => { mods.clock.reset(); await mods.prisma.trigger.deleteMany({}); await mods.prisma.job.deleteMany({}); });

test('existing triggers keep counting from the event (default EVENT); later messages do not move it', async () => {
  const t = await create(base()); // no timerFrom sent, like every trigger saved before this feature
  assert.equal(t.timerFrom, 'EVENT');
  const c = await chat();
  await run(2 * MIN);
  await customer(c, 'still there?');
  await run(1 * MIN + 1000); // 3 min after the chat started
  const [e] = await execs(t.id, c.convId);
  assert.equal(e.status, 'SUCCEEDED');
  assert.equal(await bots(c.convId, 'Rescue!'), 1);
});

test('Last customer message: 3-minute timer restarts on each customer message (1:38 → 1:41, message at 1:40 → 1:43)', async () => {
  const t = await create(base({ timerFrom: 'LAST_VISITOR' }));
  const c = await chat('first'); // "1:38"
  await run(2 * MIN); // "1:40"
  await customer(c, 'second');
  await run(1 * MIN + 1000); // "1:41": old deadline passed, but the timer was reset
  let [e] = await execs(t.id, c.convId);
  assert.equal(e.status, 'SCHEDULED');
  assert.equal(await bots(c.convId, 'Rescue!'), 0);
  assert.equal(e.scheduledFor.getTime() - (await mods.prisma.conversation.findUnique({ where: { id: c.convId } })).lastVisitorMessageAt.getTime(), 3 * MIN, 'eligible exactly 3 min after the last customer message');
  await run(2 * MIN); // "1:43"
  [e] = await execs(t.id, c.convId);
  assert.equal(e.status, 'SUCCEEDED');
  assert.equal(e.details.timerResets, 1);
  assert.equal(await bots(c.convId, 'Rescue!'), 1);
  assert.equal((await execs(t.id, c.convId)).length, 1, 'one execution, no duplicates');
});

test('an agent reply before the deadline suppresses the rescue (Visitor served Is False)', async () => {
  const t = await create(base({ timerFrom: 'LAST_VISITOR' }));
  const c = await chat();
  await run(1 * MIN);
  await agent(c, 'Hi, how can I help?');
  await run(2 * MIN + 1000);
  const [e] = await execs(t.id, c.convId);
  assert.equal(e.status, 'SKIPPED');
  assert.match(e.reason, /no longer match/);
  assert.equal(await bots(c.convId, 'Rescue!'), 0);
});

test('Last message in conversation: agent replies also restart the timer', async () => {
  const t = await create(base({ timerFrom: 'LAST_MESSAGE', conditions: [], actions: [{ type: 'send_message', text: 'Still there?' }] }));
  const c = await chat();
  await run(2 * MIN);
  await agent(c, 'Checking...');
  await run(1 * MIN + 1000); // 3 min after the customer, 1 min after the agent
  assert.equal((await execs(t.id, c.convId))[0].status, 'SCHEDULED');
  await run(2 * MIN); // 3 min after the agent reply
  assert.equal((await execs(t.id, c.convId))[0].status, 'SUCCEEDED');
  assert.equal(await bots(c.convId, 'Still there?'), 1);
});

test('bot messages do not restart the timer (only customer / agent messages count)', async () => {
  const t = await create(base({ timerFrom: 'LAST_MESSAGE', conditions: [], actions: [{ type: 'send_message', text: 'Ping' }] }));
  const c = await chat();
  await run(1 * MIN);
  await mods.prisma.message.create({ data: { storeId: store.id, conversationId: c.convId, seq: 99, senderType: 'BOT', body: 'automated', createdAt: mods.clock.now() } });
  await run(2 * MIN + 1000);
  assert.equal((await execs(t.id, c.convId))[0].status, 'SUCCEEDED');
});

test('closed conversations and disabled triggers never send', async () => {
  const t = await create(base({ timerFrom: 'LAST_VISITOR' }));
  const closed = await chat();
  await mods.prisma.conversation.update({ where: { id: closed.convId }, data: { status: 'RESOLVED' } });
  const later = await chat();
  await call('PATCH', `/api/stores/${store.id}/triggers/${t.id}/enabled`, { token: sup.token, body: { enabled: false } });
  await run(3 * MIN + 1000);
  const [ec] = await execs(t.id, closed.convId);
  const [el] = await execs(t.id, later.convId);
  assert.ok(['SKIPPED', 'CANCELLED'].includes(ec.status), ec.status);
  assert.equal(el.status, 'CANCELLED');
  assert.equal(await bots(closed.convId, 'Rescue!') + await bots(later.convId, 'Rescue!'), 0);

  const t2 = await create(base({ timerFrom: 'LAST_VISITOR', name: 'closed check' }));
  const c = await chat();
  await run(1 * MIN);
  await mods.prisma.conversation.update({ where: { id: c.convId }, data: { status: 'RESOLVED' } });
  await run(2 * MIN + 1000);
  const [e2] = await execs(t2.id, c.convId);
  assert.equal(e2.status, 'SKIPPED');
  assert.match(e2.reason, /closed/);
});

test('"Visitor sends a message" + Every time: many messages keep ONE pending run that slides, and it sends once', async () => {
  const t = await create(base({ event: 'visitor_message', frequency: 'EVERY_TIME', timerFrom: 'LAST_VISITOR', conditions: [], actions: [{ type: 'send_message', text: 'Need anything else?' }] }));
  const c = await chat('a');
  for (const m of ['b', 'c', 'd']) { await run(1 * MIN); await customer(c, m); }
  assert.equal((await execs(t.id, c.convId)).length, 1, 'one execution for the whole burst');
  await run(3 * MIN + 1000);
  assert.equal(await bots(c.convId, 'Need anything else?'), 1);
});

test('two workers waking the same due execution send only once', async () => {
  const t = await create(base({ timerFrom: 'LAST_VISITOR', conditions: [] }));
  const c = await chat();
  mods.clock.advance(3 * MIN + 1000);
  const [e] = await execs(t.id, c.convId);
  await Promise.all([mods.engine.execute(e.id), mods.engine.execute(e.id), mods.engine.execute(e.id)]);
  await settle();
  assert.equal(await bots(c.convId, 'Rescue!'), 1);
  assert.equal((await execs(t.id, c.convId))[0].status, 'SUCCEEDED');
});

test('validation, persistence, template default, copy keeps the setting, other stores unaffected', async () => {
  const bad = async (body, re) => { const r = await call('POST', `/api/stores/${store.id}/triggers`, { token: sup.token, body }); assert.equal(r.status, 400); assert.match(JSON.stringify(r.data), re); };
  await bad(base({ event: 'page_view', timerFrom: 'LAST_VISITOR' }), /not available for this trigger event/);
  await bad(base({ event: 'agent_message', timerFrom: 'LAST_VISITOR' }), /not available/);
  await bad(base({ timerFrom: 'LAST_VISITOR', delaySeconds: 0 }), /Set a Delay/);
  await bad(base({ kind: 'BASIC', timerFrom: 'LAST_VISITOR' }), /Basic triggers/);
  await bad(base({ timerFrom: 'NOPE' }), /timerFrom|Invalid enum/);

  const t = await create(base({ timerFrom: 'LAST_MESSAGE', event: 'agent_message' }));
  assert.equal((await call('GET', `/api/stores/${store.id}/triggers/${t.id}`, { token: sup.token })).data.timerFrom, 'LAST_MESSAGE');
  const { id, storeId, version, createdAt, updatedAt, stats, ...rest } = t;
  const put = await call('PUT', `/api/stores/${store.id}/triggers/${t.id}`, { token: sup.token, body: { ...rest, name: 'renamed' } });
  assert.equal(put.data.timerFrom, 'LAST_MESSAGE', 'kept across edits');

  const cat = (await call('GET', '/api/trigger-catalog', { token: sup.token })).data;
  assert.equal(cat.templates.find((x) => x.key === 'chat_rescue').trigger.timerFrom, 'LAST_VISITOR');
  assert.deepEqual(cat.timerFrom.find((x) => x.key === 'LAST_VISITOR').events, ['chat_requested', 'visitor_message']);

  const copy = await call('POST', `/api/stores/${store.id}/triggers/copy`, { token: sup.token, body: { storeIds: [other.id], triggerIds: [t.id] } });
  assert.deepEqual(copy.data.stores[0].copied, ['renamed']);
  assert.equal((await mods.prisma.trigger.findFirst({ where: { storeId: other.id, name: 'renamed' } })).timerFrom, 'LAST_MESSAGE');

  // A store-A trigger never runs for store-B chats.
  const a = await create(base({ timerFrom: 'LAST_VISITOR', conditions: [], name: 'A only' }));
  const v = await visit(other.publicKey, { origin: ORIGIN });
  const cb = (await say(other.publicKey, v.token, 'hi from B', {}, ORIGIN)).data.conversationId;
  await settle();
  await run(3 * MIN + 1000);
  assert.equal((await execs(a.id, cb)).length, 0);
  assert.equal(await bots(cb, 'Rescue!'), 0);
});
