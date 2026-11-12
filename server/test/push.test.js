import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { start, stop, call, makeUser, makeStore, addMember, visit, say, mods } from './helpers.js';

// The Expo Push API is simulated: only requests to EXPO_URL are intercepted, everything else
// (the test's own API calls) goes to the real local server. No real network is used.
let EXPO_URL;
let sent = [];
let reply = (batch) => ({ status: 200, body: { data: batch.map(() => ({ status: 'ok', id: 'x' })) } });
const realFetch = globalThis.fetch;

before(async () => {
  await start();
  ({ EXPO_URL } = await import('../src/services/push.js'));
  globalThis.fetch = async (url, opts) => {
    if (String(url) !== EXPO_URL) return realFetch(url, opts);
    const batch = JSON.parse(opts.body);
    sent.push(...batch);
    const r = reply(batch);
    return new Response(JSON.stringify(r.body), { status: r.status, headers: { 'Content-Type': 'application/json' } });
  };
});
after(async () => { globalThis.fetch = realFetch; await stop(); });
beforeEach(() => { sent = []; reply = (batch) => ({ status: 200, body: { data: batch.map(() => ({ status: 'ok', id: 'x' })) } }); });

const ORIGIN = 'https://push-shop.test';
const tok = (s) => `ExponentPushToken[${s}]`;
const register = (u, token, platform = 'android') => call('POST', '/api/auth/push-devices', { token: u.token, body: { token, platform } });

async function setup(name) {
  const sup = await makeUser(`${name}-sup@push.test`, { role: 'SUPER_ADMIN' });
  const store = await makeStore(sup.token, `Push ${name}`, ['push-shop.test']);
  const a1 = await makeUser(`${name}-a1@push.test`);
  const a2 = await makeUser(`${name}-a2@push.test`);
  const lead = await makeUser(`${name}-lead@push.test`);
  await addMember(sup.token, store.id, a1.email, 'AGENT');
  await addMember(sup.token, store.id, a2.email, 'AGENT');
  await addMember(sup.token, store.id, lead.email, 'SUPERVISOR');
  return { sup, store, a1, a2, lead };
}

test('register, re-register moves the token, delete; validation and auth', async () => {
  const u1 = await makeUser('reg1@push.test');
  const u2 = await makeUser('reg2@push.test');
  assert.equal((await register(u1, tok('aaa'))).status, 200);
  assert.equal((await mods.prisma.pushDevice.findUnique({ where: { token: tok('aaa') } })).userId, u1.id);
  assert.equal((await register(u2, tok('aaa'), 'ios')).status, 200, 'same phone, new user');
  const row = await mods.prisma.pushDevice.findUnique({ where: { token: tok('aaa') } });
  assert.equal(row.userId, u2.id);
  assert.equal(row.platform, 'ios');

  assert.equal((await register(u1, 'not-a-token')).status, 400);
  assert.equal((await call('POST', '/api/auth/push-devices', { body: { token: tok('bbb'), platform: 'ios' } })).status, 401);

  // Only the caller's own token is removed.
  await call('DELETE', '/api/auth/push-devices', { token: u1.token, body: { token: tok('aaa') } });
  assert.ok(await mods.prisma.pushDevice.findUnique({ where: { token: tok('aaa') } }), 'u1 cannot delete u2 token');
  await call('DELETE', '/api/auth/push-devices', { token: u2.token, body: { token: tok('aaa') } });
  assert.equal(await mods.prisma.pushDevice.findUnique({ where: { token: tok('aaa') } }), null);
});

test('sign out everywhere removes the user\'s phones', async () => {
  const u = await makeUser('logout@push.test');
  await register(u, tok('lo1'));
  await call('POST', '/api/auth/logout-all', { token: u.token });
  assert.equal(await mods.prisma.pushDevice.count({ where: { userId: u.id } }), 0);
});

test('visitor message pushes to the right people only (agent scoping, inactive users, other stores)', async () => {
  const { store, sup, a1, a2, lead } = await setup('scope');
  const other = await setup('other');
  const off = await makeUser('scope-off@push.test');
  await addMember(sup.token, store.id, off.email, 'AGENT');
  await mods.prisma.user.update({ where: { id: off.id }, data: { isActive: false } });
  for (const [u, t] of [[sup, 'sup'], [a1, 'a1'], [a2, 'a2'], [lead, 'lead'], [off, 'off'], [other.a1, 'other']]) {
    await mods.prisma.pushDevice.create({ data: { userId: u.id, token: tok(`s-${t}`), platform: 'android' } });
  }

  const v = await visit(store.publicKey, { origin: ORIGIN });
  await mods.prisma.visitor.update({ where: { id: v.data.visitor.id }, data: { name: 'Tanya' } });
  const r = await say(store.publicKey, v.token, 'I need my ring resized', {}, ORIGIN);
  assert.equal(r.status, 201);
  await mods.jobs.drain();
  // Unassigned chat: every active member of this store plus the main admins (other stores' admins
  // are main admins too, so only the other store's *agent* must be absent).
  const to = new Set(sent.map((m) => m.to));
  for (const t of ['sup', 'a1', 'a2', 'lead']) assert.ok(to.has(tok(`s-${t}`)), `${t} notified`);
  assert.ok(!to.has(tok('s-off')), 'deactivated user not notified');
  assert.ok(!to.has(tok('s-other')), 'other store agent not notified');
  const m = sent.find((x) => x.to === tok('s-a1'));
  assert.match(m.title, /^New chat on Push scope: Tanya$/);
  assert.equal(m.body, 'I need my ring resized');
  assert.equal(m.sound, 'default');
  assert.equal(m.channelId, 'chats');
  assert.equal(m.data.storeId, store.id);

  // Assigned to a1: a2 (agent) no longer gets it; the supervisor still does.
  const conv = await mods.prisma.conversation.findFirst({ where: { storeId: store.id } });
  await mods.prisma.conversation.update({ where: { id: conv.id }, data: { assigneeId: a1.id } });
  sent = [];
  await say(store.publicKey, v.token, 'Hello?', {}, ORIGIN);
  await mods.jobs.drain();
  const to2 = new Set(sent.map((x) => x.to));
  assert.ok(to2.has(tok('s-a1')) && to2.has(tok('s-lead')) && to2.has(tok('s-sup')));
  assert.ok(!to2.has(tok('s-a2')), 'other agent does not get an assigned chat');
  assert.match(sent[0].title, /^Tanya · Push scope$/, 'follow-up message title');
});

test('agent replies and notes never push; a retried visitor message pushes once', async () => {
  const { store, a1 } = await setup('quiet');
  await mods.prisma.pushDevice.create({ data: { userId: a1.id, token: tok('q-a1'), platform: 'ios' } });
  const v = await visit(store.publicKey, { origin: ORIGIN });
  const clientMsgId = `retry-${Date.now()}`;
  await say(store.publicKey, v.token, 'first', { clientMsgId }, ORIGIN);
  await say(store.publicKey, v.token, 'first', { clientMsgId }, ORIGIN);
  await mods.jobs.drain();
  assert.equal(sent.filter((m) => m.to === tok('q-a1')).length, 1);

  sent = [];
  const conv = await mods.prisma.conversation.findFirst({ where: { storeId: store.id } });
  await call('POST', `/api/stores/${store.id}/conversations/${conv.id}/messages`, { token: a1.token, body: { body: 'reply', clientMsgId: `ag-${Date.now()}` } });
  await call('POST', `/api/stores/${store.id}/conversations/${conv.id}/messages`, { token: a1.token, body: { body: 'note', note: true, clientMsgId: `nt-${Date.now()}` } });
  await mods.jobs.drain();
  assert.equal(sent.length, 0);
});

test('spam chats do not push', async () => {
  const { store, a1 } = await setup('spam');
  await mods.prisma.pushDevice.create({ data: { userId: a1.id, token: tok('sp-a1'), platform: 'android' } });
  const v = await visit(store.publicKey, { origin: ORIGIN });
  await say(store.publicKey, v.token, 'buy cheap stuff', {}, ORIGIN);
  await mods.jobs.drain();
  const conv = await mods.prisma.conversation.findFirst({ where: { storeId: store.id } });
  await mods.prisma.conversation.update({ where: { id: conv.id }, data: { folder: 'SPAM' } });
  sent = [];
  await say(store.publicKey, v.token, 'more spam', {}, ORIGIN);
  await mods.jobs.drain();
  assert.equal(sent.length, 0);
});

test('sender batches 100 per request and forgets uninstalled phones', async () => {
  const { store, a1 } = await setup('batch');
  await mods.prisma.pushDevice.createMany({ data: Array.from({ length: 150 }, (_, i) => ({ userId: a1.id, token: tok(`b-${i}`), platform: 'android' })) });
  let requests = 0;
  reply = (batch) => { requests++; return { status: 200, body: { data: batch.map((m) => (m.to === tok('b-7') ? { status: 'error', details: { error: 'DeviceNotRegistered' } } : { status: 'ok', id: 'x' })) } }; };
  const v = await visit(store.publicKey, { origin: ORIGIN });
  await say(store.publicKey, v.token, 'hi', {}, ORIGIN);
  await mods.jobs.drain();
  assert.ok(requests >= 2, 'split into batches');
  assert.ok(sent.filter((m) => m.to.startsWith('ExponentPushToken[b-')).length === 150);
  assert.equal(await mods.prisma.pushDevice.findUnique({ where: { token: tok('b-7') } }), null, 'dead token removed');
  assert.ok(await mods.prisma.pushDevice.findUnique({ where: { token: tok('b-8') } }));
});

test('Expo outage makes the job retry instead of losing the push', async () => {
  const { store, a1 } = await setup('outage');
  await mods.prisma.pushDevice.create({ data: { userId: a1.id, token: tok('o-a1'), platform: 'android' } });
  reply = () => ({ status: 503, body: {} });
  const v = await visit(store.publicKey, { origin: ORIGIN });
  await say(store.publicKey, v.token, 'are you there', {}, ORIGIN);
  await mods.jobs.drain();
  const job = await mods.prisma.job.findFirst({ where: { type: 'push_message', storeId: store.id } });
  assert.equal(job.status, 'PENDING', 'rescheduled for retry');
  assert.match(job.lastError, /Expo push HTTP 503/);
});
