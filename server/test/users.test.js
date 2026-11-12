import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start, stop, call, makeUser, makeStore, addMember, visit, say, cid, mods } from './helpers.js';

let sup, store;

before(async () => {
  await start();
  sup = await makeUser('super@users.test', { role: 'SUPER_ADMIN' });
  store = await makeStore(sup.token, 'Deletion Store', []);
});
after(stop);

test('super admin deletes an agent: account gone, store data kept, chats unassigned, audited', async () => {
  const owner = await makeUser('owner@users.test');
  const agent = await makeUser('agent@users.test');
  await addMember(sup.token, store.id, owner.email, 'OWNER');
  await addMember(sup.token, store.id, agent.email, 'AGENT');
  const v = await visit(store.publicKey);
  const conv = (await say(store.publicKey, v.token, 'hello')).data.conversationId;
  await call('POST', `/api/stores/${store.id}/conversations/${conv}/messages`, { token: agent.token, body: { body: 'agent reply', clientMsgId: cid() } });

  const r = await call('DELETE', `/api/users/${agent.id}`, { token: sup.token });
  assert.equal(r.status, 200);
  assert.equal(await mods.prisma.user.count({ where: { id: agent.id } }), 0);
  assert.equal(await mods.prisma.storeMember.count({ where: { userId: agent.id } }), 0);
  const c = await mods.prisma.conversation.findUnique({ where: { id: conv } });
  assert.ok(c, 'conversation kept');
  assert.equal(c.assigneeId, null, 'conversation unassigned');
  const msg = await mods.prisma.message.findFirst({ where: { conversationId: conv, senderType: 'AGENT' } });
  assert.equal(msg.body, 'agent reply', 'message history kept');
  assert.equal(msg.senderName, agent.name);
  assert.ok(await mods.prisma.store.findUnique({ where: { id: store.id } }), 'store kept');
  assert.ok(await mods.prisma.auditLog.findFirst({ where: { action: 'user.deleted', target: agent.email } }));
  // The deleted user's token no longer works.
  assert.equal((await call('GET', '/api/auth/me', { token: agent.token })).status, 401);
});

test('only super admins can delete users', async () => {
  const owner = await makeUser('owner2@users.test');
  const victim = await makeUser('victim@users.test');
  await addMember(sup.token, store.id, owner.email, 'OWNER');
  assert.equal((await call('DELETE', `/api/users/${victim.id}`, { token: owner.token })).status, 403, 'store owner');
  assert.equal((await call('DELETE', `/api/users/${victim.id}`)).status, 401, 'anonymous');
  assert.equal(await mods.prisma.user.count({ where: { id: victim.id } }), 1);
});

test('protected cases: self, last super admin, sole store owner, unknown id', async () => {
  assert.equal((await call('DELETE', `/api/users/${sup.id}`, { token: sup.token })).status, 400, 'cannot delete yourself');

  // Another super admin can be deleted while the caller (active) remains.
  const sup2 = await makeUser('super2@users.test', { role: 'SUPER_ADMIN' });
  assert.equal((await call('DELETE', `/api/users/${sup2.id}`, { token: sup.token })).status, 200);

  const solo = await makeUser('solo-owner@users.test');
  const soloStore = await makeStore(sup.token, 'Solo Store', []);
  await addMember(sup.token, soloStore.id, solo.email, 'OWNER');
  const sole = await call('DELETE', `/api/users/${solo.id}`, { token: sup.token });
  assert.equal(sole.status, 409);
  assert.match(sole.data.error, /only owner of Solo Store/);
  // With a second owner it becomes deletable.
  const co = await makeUser('co-owner@users.test');
  await addMember(sup.token, soloStore.id, co.email, 'OWNER');
  assert.equal((await call('DELETE', `/api/users/${solo.id}`, { token: sup.token })).status, 200);

  assert.equal((await call('DELETE', '/api/users/does-not-exist', { token: sup.token })).status, 404);
});

test('two super admins deleting each other at once never leaves zero super admins', async () => {
  await mods.prisma.user.updateMany({ where: { role: 'SUPER_ADMIN' }, data: { isActive: false } });
  const a = await makeUser('race-a@users.test', { role: 'SUPER_ADMIN' });
  const b = await makeUser('race-b@users.test', { role: 'SUPER_ADMIN' });
  const [ra, rb] = await Promise.all([
    call('DELETE', `/api/users/${b.id}`, { token: a.token }),
    call('DELETE', `/api/users/${a.id}`, { token: b.token }),
  ]);
  const statuses = [ra.status, rb.status].sort();
  assert.ok(statuses.includes(200), `one deletion succeeds: ${statuses}`);
  const loser = ra.status === 200 ? rb : ra;
  assert.equal(loser.status, 409, 'the second deletion is refused under the lock');
  assert.match(loser.data.error, /last active super admin/);
  assert.equal(await mods.prisma.user.count({ where: { role: 'SUPER_ADMIN', isActive: true } }), 1);
  await mods.prisma.user.updateMany({ where: { role: 'SUPER_ADMIN' }, data: { isActive: true } });
});

test('two roles only: one main admin, every new user and store member is an agent', async () => {
  const main = await makeUser('main@roles.test', { role: 'SUPER_ADMIN' });
  const store = await makeStore(main.token, 'Roles');
  let r = await call('POST', '/api/users', { token: main.token, body: { email: 'x@roles.test', name: 'X', password: 'Password-12345', role: 'SUPER_ADMIN' } });
  assert.equal(r.status, 400);
  r = await call('POST', '/api/users', { token: main.token, body: { email: 'agent@roles.test', name: 'Agent', password: 'Password-12345' } });
  assert.equal(r.status, 201);
  r = await call('PATCH', `/api/users/${r.data.id}`, { token: main.token, body: { role: 'SUPER_ADMIN' } });
  assert.equal(r.status, 409, 'a second main admin is refused');
  r = await call('POST', `/api/stores/${store.id}/members`, { token: main.token, body: { email: 'agent@roles.test', role: 'ADMIN' } });
  assert.equal(r.status, 400);
  r = await call('POST', `/api/stores/${store.id}/members`, { token: main.token, body: { email: 'agent@roles.test' } });
  assert.equal(r.status, 201);
  const m = await mods.prisma.storeMember.findFirst({ where: { storeId: store.id } });
  assert.equal(m.role, 'AGENT');
  r = await call('PATCH', `/api/stores/${store.id}/members/${m.userId}`, { token: main.token, body: { role: 'OWNER' } });
  assert.equal(r.status, 400);
});

test('agent store access is set from the user form; master widget switch hides the widget everywhere', async () => {
  const main = await makeUser('main2@roles.test', { role: 'SUPER_ADMIN' });
  const s1 = await makeStore(main.token, 'Access1', []);
  const s2 = await makeStore(main.token, 'Access2', []);
  let r = await call('POST', '/api/users', { token: main.token, body: { email: 'ag2@roles.test', name: 'Ag', password: 'Password-12345', storeIds: [s1.id] } });
  assert.equal(r.status, 201);
  const id = r.data.id;
  const stores = async () => (await mods.prisma.storeMember.findMany({ where: { userId: id } })).map((m) => `${m.storeId === s1.id ? 's1' : 's2'}:${m.role}`).sort();
  assert.deepEqual(await stores(), ['s1:AGENT']);
  r = await call('PATCH', `/api/users/${id}`, { token: main.token, body: { storeIds: [s2.id] } });
  assert.equal(r.status, 200);
  assert.deepEqual(await stores(), ['s2:AGENT']);
  assert.equal((await call('PATCH', `/api/users/${id}`, { token: main.token, body: { storeIds: ['nope'] } })).status, 400);
  const agent = await call('POST', '/api/auth/login', { body: { email: 'ag2@roles.test', password: 'Password-12345' } });
  assert.equal((await call('PUT', `/api/platform/stores/${s2.id}/widget-enabled`, { token: agent.data.token, body: { enabled: false } })).status, 403);

  assert.equal((await visit(s1.publicKey)).status, 200);
  r = await call('PUT', `/api/platform/stores/${s1.id}/widget-enabled`, { token: main.token, body: { enabled: false } });
  assert.equal(r.status, 200);
  assert.equal((await visit(s1.publicKey)).status, 404, 'widget off: not served');
  assert.equal((await visit(s2.publicKey)).status, 200, 'other stores unaffected');
  await call('PUT', `/api/platform/stores/${s1.id}/widget-enabled`, { token: main.token, body: { enabled: true } });
  assert.equal((await visit(s1.publicKey)).status, 200);
});

test('bulk visitor delete: admin only, own store only, removes chats too', async () => {
  const main = await makeUser('main3@roles.test', { role: 'SUPER_ADMIN' });
  const s1 = await makeStore(main.token, 'Bulk1', []);
  const s2 = await makeStore(main.token, 'Bulk2', []);
  const mk = (storeId, n) => mods.prisma.visitor.create({ data: { storeId, tokenHash: `bulk-${n}` } });
  const [a, b, keep] = [await mk(s1.id, 'a'), await mk(s1.id, 'b'), await mk(s1.id, 'c')];
  const other = await mk(s2.id, 'd');
  const at = new Date();
  await mods.prisma.conversation.create({ data: { storeId: s1.id, visitorId: a.id, lastActivityAt: at, expiresAt: new Date(at.getTime() + 86_400_000) } });
  await makeUser('bulk-agent@roles.test');
  await addMember(main.token, s1.id, 'bulk-agent@roles.test', 'AGENT');
  const agent = await call('POST', '/api/auth/login', { body: { email: 'bulk-agent@roles.test', password: 'Password-12345' } });
  assert.equal((await call('POST', `/api/stores/${s1.id}/visitors/bulk-delete`, { token: agent.data.token, body: { ids: [a.id] } })).status, 403);
  const r = await call('POST', `/api/stores/${s1.id}/visitors/bulk-delete`, { token: main.token, body: { ids: [a.id, b.id, other.id] } });
  assert.equal(r.status, 200);
  assert.equal(r.data.deleted, 2, 'the other store\'s visitor is not touched');
  const left = (await mods.prisma.visitor.findMany({ where: { id: { in: [a.id, b.id, keep.id, other.id] } } })).map((v) => v.id).sort();
  assert.deepEqual(left, [keep.id, other.id].sort());
  assert.equal(await mods.prisma.conversation.count({ where: { visitorId: a.id } }), 0);
});

test('creating a store with a user email adds that user as an agent, never an owner', async () => {
  const main = await makeUser('main4@roles.test', { role: 'SUPER_ADMIN' });
  const u = await makeUser('store-agent@roles.test');
  const r = await call('POST', '/api/stores', { token: main.token, body: { name: 'WithAgent', allowedOrigins: [], ownerEmail: u.email } });
  assert.equal(r.status, 201);
  const m = await mods.prisma.storeMember.findFirst({ where: { storeId: r.data.id, userId: u.id } });
  assert.equal(m.role, 'AGENT');
});
