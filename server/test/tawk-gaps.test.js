// Shortcut access levels, sequential trigger waits + new conditions, visitor monitoring, widget behaviour toggles.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DateTime } from 'luxon';
import { start, stop, call, makeUser, makeStore, addMember, visit, say, socket, cid, mods, sleep } from './helpers.js';

let sup, owner, sup1, agent1, agent2, store, other, otherOwner;
const ORIGIN = 'https://gaps.test';
const settle = async () => { await mods.events.idle(); await sleep(30); await mods.events.idle(); };

before(async () => {
  await start();
  sup = await makeUser('super@gaps.test', { role: 'SUPER_ADMIN' });
  owner = await makeUser('owner@gaps.test');
  sup1 = await makeUser('supervisor@gaps.test');
  agent1 = await makeUser('agent1@gaps.test');
  agent2 = await makeUser('agent2@gaps.test');
  otherOwner = await makeUser('other-owner@gaps.test');
  store = await makeStore(sup.token, 'Gaps Store', ['gaps.test']);
  other = await makeStore(sup.token, 'Other Store', []);
  await addMember(sup.token, store.id, owner.email, 'OWNER');
  await addMember(sup.token, store.id, sup1.email, 'SUPERVISOR');
  await addMember(sup.token, store.id, agent1.email, 'AGENT');
  await addMember(sup.token, store.id, agent2.email, 'AGENT');
  await addMember(sup.token, other.id, otherOwner.email, 'OWNER');
});
after(stop);
beforeEach(async () => {
  mods.clock.reset();
  await mods.prisma.trigger.deleteMany({});
  await mods.prisma.job.deleteMany({});
});

async function publish(patch) {
  const w = await call('GET', `/api/stores/${store.id}/widget`, { token: owner.token });
  const draft = { ...w.data.draft, ...patch, behavior: { ...w.data.draft.behavior, ...(patch.behavior || {}) } };
  assert.equal((await call('PUT', `/api/stores/${store.id}/widget/draft`, { token: owner.token, body: draft })).status, 200);
  assert.equal((await call('POST', `/api/stores/${store.id}/widget/publish`, { token: owner.token, body: {} })).status, 200);
}

// ---------- Shortcut access levels ----------

test('shortcuts: private ones are personal, public ones are supervisor-managed, triggers use public only', async () => {
  const url = `/api/stores/${store.id}/saved-replies`;
  const mine = await call('POST', url, { token: agent1.token, body: { shortcut: 'myhi', title: 'Mine', body: 'Hi from agent1', access: 'PRIVATE' } });
  assert.equal(mine.status, 201);
  assert.equal(mine.data.access, 'PRIVATE');
  assert.equal((await call('POST', url, { token: agent1.token, body: { shortcut: 'teamhi', title: 'Team', body: 'x', access: 'PUBLIC' } })).status, 403, 'agents cannot create public');
  const team = await call('POST', url, { token: sup1.token, body: { shortcut: 'returns', title: 'Returns', body: 'Our returns policy', access: 'PUBLIC' } });
  assert.equal(team.status, 201);

  const seen = async (u) => (await call('GET', url, { token: u.token })).data.map((r) => r.shortcut).sort();
  assert.deepEqual(await seen(agent1), ['myhi', 'returns']);
  assert.deepEqual(await seen(agent2), ['returns'], 'other agents never see a private reply');
  assert.deepEqual(await seen(owner), ['returns'], 'not even the owner');

  // Edit/delete rules
  assert.equal((await call('PUT', `${url}/${team.data.id}`, { token: agent1.token, body: { shortcut: 'returns', title: 'X', body: 'X', access: 'PUBLIC' } })).status, 403);
  assert.equal((await call('DELETE', `${url}/${team.data.id}`, { token: agent1.token })).status, 403);
  assert.equal((await call('DELETE', `${url}/${mine.data.id}`, { token: agent2.token })).status, 404, 'invisible to others');
  assert.equal((await call('PUT', `${url}/${mine.data.id}`, { token: agent1.token, body: { shortcut: 'myhi', title: 'Mine 2', body: 'Hi', access: 'PUBLIC' } })).status, 403, 'agents cannot publish a private reply');
  assert.equal((await call('PUT', `${url}/${mine.data.id}`, { token: agent1.token, body: { shortcut: 'myhi', title: 'Mine 2', body: 'Hi', access: 'PRIVATE' } })).status, 200);
  const list = (await call('GET', url, { token: agent1.token })).data;
  assert.equal(list.find((r) => r.shortcut === 'myhi').canEdit, true);
  assert.equal(list.find((r) => r.shortcut === 'returns').canEdit, false);

  // Triggers may only reference public replies
  const base = { name: 'r', kind: 'ADVANCED', event: 'chat_requested', delaySeconds: 0, match: 'ALL', conditions: [], frequency: 'EVERY_TIME' };
  assert.equal((await call('POST', `/api/stores/${store.id}/triggers`, { token: owner.token, body: { ...base, actions: [{ type: 'send_saved_reply', savedReplyId: mine.data.id }] } })).status, 400);
  assert.equal((await call('POST', `/api/stores/${store.id}/triggers`, { token: owner.token, body: { ...base, actions: [{ type: 'send_saved_reply', savedReplyId: team.data.id }] } })).status, 201);
  assert.equal((await call('DELETE', `${url}/${mine.data.id}`, { token: agent1.token })).status, 200);
});

// ---------- Sequential waits ----------

const waitTrigger = (extra = {}) => ({
  name: 'Wait then escalate', kind: 'ADVANCED', event: 'chat_requested', delaySeconds: 0, match: 'ALL', frequency: 'ONCE_PER_CONVERSATION',
  conditions: [{ field: 'chat.exists', op: 'is_true' }, { field: 'wait', op: 'for', value: 60 }, { field: 'chat.awaitingAgentReply', op: 'is_true' }],
  actions: [{ type: 'set_priority', priority: 'URGENT' }],
  ...extra,
});

test('wait step: checks before the wait, pauses, then re-checks what follows', async () => {
  const t = (await call('POST', `/api/stores/${store.id}/triggers`, { token: owner.token, body: waitTrigger() })).data;
  const v = await visit(store.publicKey, { origin: ORIGIN });
  const conv = (await say(store.publicKey, v.token, 'anyone?', {}, ORIGIN)).data.conversationId;
  await settle();
  let ex = await mods.prisma.triggerExecution.findFirst({ where: { triggerId: t.id } });
  assert.equal(ex.status, 'SCHEDULED', 'parked at the wait');
  assert.equal(ex.details.step, 2);
  assert.equal(ex.details.conditions.length, 1, 'first segment already checked');

  mods.clock.advance(30_000);
  await mods.jobs.drain();
  assert.equal((await mods.prisma.triggerExecution.findUnique({ where: { id: ex.id } })).status, 'SCHEDULED', 'not before the wait ends');

  mods.clock.advance(31_000);
  await mods.jobs.drain();
  ex = await mods.prisma.triggerExecution.findUnique({ where: { id: ex.id } });
  assert.equal(ex.status, 'SUCCEEDED', JSON.stringify(ex.details));
  assert.equal(ex.details.conditions.length, 2);
  assert.equal((await mods.prisma.conversation.findUnique({ where: { id: conv } })).priority, 'URGENT');
});

test('wait step: if things change during the wait, the run is skipped', async () => {
  const t = (await call('POST', `/api/stores/${store.id}/triggers`, { token: owner.token, body: waitTrigger() })).data;
  const v = await visit(store.publicKey, { origin: ORIGIN });
  const conv = (await say(store.publicKey, v.token, 'hello?', {}, ORIGIN)).data.conversationId;
  await settle();
  await call('POST', `/api/stores/${store.id}/conversations/${conv}/messages`, { token: owner.token, body: { body: 'Hi there', clientMsgId: cid() } });
  mods.clock.advance(61_000);
  await mods.jobs.drain();
  const ex = await mods.prisma.triggerExecution.findFirst({ where: { triggerId: t.id } });
  assert.equal(ex.status, 'SKIPPED');
  assert.match(ex.reason, /no longer match after delay/);
  assert.equal((await mods.prisma.conversation.findUnique({ where: { id: conv } })).priority, 'NORMAL');
});

test('wait step: several waits run in order, and disabling cancels a parked run', async () => {
  const body = waitTrigger({
    conditions: [{ field: 'wait', op: 'for', value: 10 }, { field: 'chat.exists', op: 'is_true' }, { field: 'wait', op: 'for', value: 20 }, { field: 'chat.awaitingAgentReply', op: 'is_true' }],
  });
  const t = (await call('POST', `/api/stores/${store.id}/triggers`, { token: owner.token, body })).data;
  const v = await visit(store.publicKey, { origin: ORIGIN });
  await say(store.publicKey, v.token, 'two waits', {}, ORIGIN);
  await settle();
  let ex = await mods.prisma.triggerExecution.findFirst({ where: { triggerId: t.id } });
  assert.equal(ex.details.step, 1, 'leading wait parks before any check');
  mods.clock.advance(11_000);
  await mods.jobs.drain();
  ex = await mods.prisma.triggerExecution.findUnique({ where: { id: ex.id } });
  assert.equal(ex.status, 'SCHEDULED');
  assert.equal(ex.details.step, 3, 'second wait reached');

  const r = await call('PATCH', `/api/stores/${store.id}/triggers/${t.id}/enabled`, { token: owner.token, body: { enabled: false } });
  assert.equal(r.data.cancelled, 1);
  assert.equal((await mods.prisma.triggerExecution.findUnique({ where: { id: ex.id } })).status, 'CANCELLED');
  const jobs = await mods.prisma.job.findMany({ where: { type: 'run_trigger', payload: { path: ['executionId'], equals: ex.id } } });
  assert.ok(jobs.length >= 2 && jobs.every((j) => j.status !== 'PENDING'), 'no job left to run');
});

test('wait step validation', async () => {
  const post = (b) => call('POST', `/api/stores/${store.id}/triggers`, { token: owner.token, body: b });
  assert.equal((await post(waitTrigger({ match: 'ANY' }))).status, 400, 'waits need Match ALL');
  assert.equal((await post(waitTrigger({ conditions: [{ field: 'wait', op: 'for', value: 0 }] }))).status, 400);
  assert.equal((await post(waitTrigger({ conditions: [{ field: 'wait', op: 'for', value: 8 * 86400 }] }))).status, 400);
  assert.equal((await post(waitTrigger({ delaySeconds: 6 * 86400, conditions: [{ field: 'wait', op: 'for', value: 2 * 86400 }] }))).status, 400, 'total over 7 days');
});

// ---------- New conditions ----------

test('new conditions: hour/day in the business-hours timezone, visitor name, previous chats', async () => {
  await publish({ businessHours: { enabled: false, timezone: 'Asia/Kolkata', days: { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] } } });
  const v = await visit(store.publicKey, { origin: ORIGIN });
  await call('POST', `/api/widget/${store.publicKey}/contact`, { body: { name: 'Priya' }, headers: { 'X-Visitor-Token': v.token, Origin: ORIGIN } });
  const visitorId = v.data.visitor.id;
  const old = await mods.prisma.conversation.create({ data: { storeId: store.id, visitorId, status: 'RESOLVED', expiresAt: new Date(Date.now() + 86_400_000) } });
  const current = (await say(store.publicKey, v.token, 'new question', {}, ORIGIN)).data.conversationId;
  assert.equal(current, old.id, 'resolved-but-unexpired chat is resumed (existing behaviour)');
  const extra = await mods.prisma.conversation.create({ data: { storeId: store.id, visitorId, status: 'RESOLVED', expiresAt: new Date(Date.now() + 86_400_000) } });

  const ctx = await mods.engine.buildContext({ storeId: store.id, visitorId, conversationId: current });
  const local = DateTime.fromJSDate(mods.clock.now(), { zone: 'Asia/Kolkata' });
  assert.equal(ctx.values['time.hourOfDay'], local.hour);
  assert.equal(ctx.values['time.dayOfWeek'], ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][local.weekday - 1]);
  assert.equal(ctx.values['visitor.name'], 'Priya');
  assert.equal(ctx.values['visitor.previousChats'], 1, 'counts other kept conversations, not the current one');
  assert.ok(mods.engine.evalCondition({ field: 'visitor.name', op: 'starts_with', value: 'pri' }, ctx.values));
  assert.ok(mods.engine.evalCondition({ field: 'time.dayOfWeek', op: 'eq', value: ctx.values['time.dayOfWeek'] }, ctx.values));
  await mods.prisma.conversation.delete({ where: { id: extra.id } });
});

// ---------- Visitor monitoring ----------

test('visitor monitoring: online/offline, current chat, window, scoping', async () => {
  const a = await visit(store.publicKey, { origin: ORIGIN, url: 'https://gaps.test/rings', title: 'Rings' });
  const aws = await socket(`/ws/visitor?key=${store.publicKey}&vt=${a.token}`, { Origin: ORIGIN });
  const conv = (await say(store.publicKey, a.token, 'monitor me', {}, ORIGIN)).data.conversationId;
  const b = await visit(store.publicKey, { origin: ORIGIN }); // no socket → offline but recently seen
  await mods.prisma.visitor.update({ where: { id: b.data.visitor.id }, data: { name: 'Filled form' } });
  const browser = await visit(store.publicKey, { origin: ORIGIN }); // never filled the form: not listed

  const list = async (u, q = '') => call('GET', `/api/stores/${store.id}/visitors/live${q}`, { token: u.token });
  const rows = (await list(owner)).data;
  const ra = rows.find((r) => r.id === a.data.visitor.id);
  const rb = rows.find((r) => r.id === b.data.visitor.id);
  assert.equal(ra.online, true);
  assert.equal(ra.currentTitle, 'Rings');
  assert.equal(ra.conversation.id, conv);
  assert.ok(ra.chats >= 1);
  assert.equal(rb.online, false);
  assert.equal(rb.conversation, null);
  assert.equal(rows.some((r) => r.id === browser.data.visitor.id), false, 'browse-only visitors are not listed');

  // Agents only see chat links they may open.
  await call('PATCH', `/api/stores/${store.id}/conversations/${conv}`, { token: owner.token, body: { assigneeId: agent1.id } });
  assert.equal((await list(agent1)).data.find((r) => r.id === a.data.visitor.id).conversation.id, conv);
  assert.equal((await list(agent2)).data.find((r) => r.id === a.data.visitor.id).conversation, null);

  // Window
  mods.clock.advance(15 * 60_000);
  assert.equal((await list(owner, '?minutes=10')).data.some((r) => r.id === b.data.visitor.id), false);
  assert.equal((await list(owner, '?minutes=30')).data.some((r) => r.id === b.data.visitor.id), true);
  assert.equal((await list(owner, '?minutes=7')).status, 400);
  mods.clock.advance(3 * 86_400_000); // three days later
  assert.equal((await list(owner, '?minutes=1440')).data.some((r) => r.id === b.data.visitor.id), false, 'not in the last 24 h');
  assert.equal((await list(owner, '?minutes=10080')).data.some((r) => r.id === b.data.visitor.id), true, 'in the last 7 days');
  assert.equal((await list(owner, '?minutes=0')).data.some((r) => r.id === b.data.visitor.id), true, 'All = any time');
  assert.equal((await call('GET', `/api/stores/${store.id}/visitors/live`, { token: otherOwner.token })).status, 403);
  await aws.close();
});

// ---------- Widget behaviour toggles ----------

test('behaviour toggles are enforced: uploads, typing preview, agent typing', async () => {
  const v = await visit(store.publicKey, { origin: ORIGIN });
  const conv = (await say(store.publicKey, v.token, 'toggles', {}, ORIGIN)).data.conversationId;
  const upload = () => call('POST', `/api/widget/${store.publicKey}/uploads`, { raw: Buffer.from('%PDF-1.4 x'), headers: { 'Content-Type': 'application/pdf', 'X-Filename': 'a.pdf', 'X-Visitor-Token': v.token, Origin: ORIGIN } });
  assert.equal((await upload()).status, 201, 'on by default');

  await publish({ behavior: { fileUpload: false, visitorTypingPreview: false, agentTyping: false } });
  const session = await visit(store.publicKey, { origin: ORIGIN, token: v.token });
  assert.equal(session.data.config.behavior.fileUpload, false, 'published to the widget');
  assert.equal((await upload()).status, 403);

  const vws = await socket(`/ws/visitor?key=${store.publicKey}&vt=${v.token}`, { Origin: ORIGIN });
  const ows = await socket(`/ws/agent?token=${owner.token}`);
  vws.send('typing', { conversationId: conv, typing: true, preview: 'secret draft' });
  const ev = await ows.waitFor('typing', (d) => d.conversationId === conv);
  assert.equal(ev.data.preview, undefined, 'draft text not forwarded');
  ows.send('typing', { storeId: store.id, conversationId: conv, typing: true });
  await sleep(300);
  assert.ok(!vws.events.some((e) => e.type === 'typing'), 'agent typing hidden from visitor');

  await publish({ behavior: { fileUpload: true, visitorTypingPreview: true, agentTyping: true } });
  vws.send('typing', { conversationId: conv, typing: true, preview: 'visible draft' });
  await ows.waitFor('typing', (d) => d.preview === 'visible draft').catch(() => { throw new Error('no visible preview: ' + JSON.stringify(ows.events.filter((e) => e.type === 'typing').map((e) => e.data))); });
  ows.send('typing', { storeId: store.id, conversationId: conv, typing: true });
  await vws.waitFor('typing', (d) => d.from === 'agent').catch(() => { throw new Error('no agent typing: ' + JSON.stringify(vws.events.map((e) => e.type))); });
  await Promise.all([vws.close(), ows.close()]);
});

test('older widget configs without behaviour settings still load and validate', async () => {
  const w = await call('GET', `/api/stores/${store.id}/widget`, { token: owner.token });
  const { behavior, ...legacy } = w.data.draft;
  assert.equal((await call('PUT', `/api/stores/${store.id}/widget/draft`, { token: owner.token, body: legacy })).status, 200);
  assert.equal((await call('POST', `/api/stores/${store.id}/widget/publish`, { token: owner.token, body: {} })).status, 200);
  const s = await visit(store.publicKey, { origin: ORIGIN });
  assert.equal(s.data.config.behavior.fileUpload, true);
  void behavior;
});

// ---------- Live event classification (drives dashboard sounds) ----------

test('message events say whether they started a new conversation (chat and offline form)', async () => {
  const ws = await socket(`/ws/agent?token=${owner.token}`);
  const v = await visit(store.publicKey, { origin: ORIGIN });
  const first = await say(store.publicKey, v.token, 'first message', {}, ORIGIN);
  const e1 = await ws.waitFor('message', (d) => d.message.id === first.data.message.id);
  assert.equal(e1.data.isNewConversation, true);
  assert.equal(e1.data.isOffline, false);

  const second = await say(store.publicKey, v.token, 'second message', {}, ORIGIN);
  const e2 = await ws.waitFor('message', (d) => d.message.id === second.data.message.id);
  assert.equal(e2.data.isNewConversation, false);

  const reply = await call('POST', `/api/stores/${store.id}/conversations/${first.data.conversationId}/messages`, { token: owner.token, body: { body: 'agent reply', clientMsgId: cid() } });
  const e3 = await ws.waitFor('message', (d) => d.message.id === reply.data.message.id);
  assert.equal(e3.data.isNewConversation, undefined, 'agent messages carry no new-conversation flag');

  // Retried send (same clientMsgId) is a duplicate: no second event at all.
  const dupId = cid();
  await say(store.publicKey, v.token, 'retry me', { clientMsgId: dupId }, ORIGIN);
  await say(store.publicKey, v.token, 'retry me', { clientMsgId: dupId }, ORIGIN);
  await sleep(200);
  assert.equal(ws.events.filter((e) => e.type === 'message' && e.data.message.clientMsgId === dupId).length, 1);

  // Offline form from a brand-new visitor = new conversation, flagged offline.
  const off = await visit(store.publicKey, { origin: ORIGIN });
  const r = await call('POST', `/api/widget/${store.publicKey}/offline`, { body: { name: 'Olga', email: 'olga@x.test', message: 'call me back', clientMsgId: cid() }, headers: { 'X-Visitor-Token': off.token, Origin: ORIGIN } });
  assert.equal(r.status, 201);
  const e4 = await ws.waitFor('message', (d) => d.message.id === r.data.message.id);
  assert.equal(e4.data.isNewConversation, true);
  assert.equal(e4.data.isOffline, true);
  await ws.close();
});
