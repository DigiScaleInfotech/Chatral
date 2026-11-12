// Ban/unban, Trash/Spam folders, permanent delete guard, bulk actions: permissions, isolation, realtime.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start, stop, call, makeUser, makeStore, addMember, visit, say, socket, cid, mods } from './helpers.js';

let sup, owner, supervisor, agent1, agent2, store, other, otherOwner;
const O = 'https://actions.test';
const C = (p = '') => `/api/stores/${store.id}/conversations${p}`;

async function newChat(text = 'hello') {
  const v = await visit(store.publicKey, { origin: O });
  const m = await say(store.publicKey, v.token, text, {}, O);
  assert.equal(m.status, 201);
  return { token: v.token, visitorId: v.data.visitor.id, convId: m.data.conversationId };
}

before(async () => {
  await start();
  sup = await makeUser('super@actions.test', { role: 'SUPER_ADMIN' });
  owner = await makeUser('owner@actions.test');
  supervisor = await makeUser('sup@actions.test');
  agent1 = await makeUser('a1@actions.test');
  agent2 = await makeUser('a2@actions.test');
  otherOwner = await makeUser('other@actions.test');
  store = await makeStore(sup.token, 'Actions Store', ['actions.test']);
  other = await makeStore(sup.token, 'Other Actions', []);
  await addMember(sup.token, store.id, owner.email, 'OWNER');
  await addMember(sup.token, store.id, supervisor.email, 'SUPERVISOR');
  await addMember(sup.token, store.id, agent1.email, 'AGENT');
  await addMember(sup.token, store.id, agent2.email, 'AGENT');
  await addMember(sup.token, other.id, otherOwner.email, 'OWNER');
});
after(stop);

test('ban blocks sending server-side; unban restores; only supervisors+, same store only', async () => {
  const chat = await newChat('before ban');
  const ban = (token, method = 'POST', storeId = store.id) => call(method, `/api/stores/${storeId}/visitors/${chat.visitorId}/ban`, { token, body: method === 'POST' ? { reason: 'abusive' } : undefined });
  assert.equal((await ban(agent1.token)).status, 403, 'agents cannot ban');
  assert.equal((await ban(otherOwner.token, 'POST', other.id)).status, 404, 'other store cannot ban this visitor');
  const b = await ban(supervisor.token);
  assert.equal(b.status, 200);
  assert.ok(b.data.bannedAt);

  const blocked = await say(store.publicKey, chat.token, 'after ban', {}, O);
  assert.equal(blocked.status, 403);
  assert.equal(blocked.data.code, 'VISITOR_BANNED');
  const off = await call('POST', `/api/widget/${store.publicKey}/offline`, { headers: { 'X-Visitor-Token': chat.token, Origin: O }, body: { name: 'x', email: 'x@y.test', message: 'hi', clientMsgId: cid() } });
  assert.equal(off.status, 403);
  const up = await call('POST', `/api/widget/${store.publicKey}/uploads`, { headers: { 'X-Visitor-Token': chat.token, Origin: O, 'Content-Type': 'text/plain', 'X-Filename': 'a.txt' }, raw: Buffer.from('hi') });
  assert.equal(up.status, 403);
  assert.equal((await visit(store.publicKey, { origin: O, token: chat.token })).status, 200, 'banned visitor can still load the page');
  assert.equal(await mods.prisma.message.count({ where: { conversationId: chat.convId, body: 'after ban' } }), 0);

  const d = await call('GET', C(`/${chat.convId}`), { token: owner.token });
  assert.ok(d.data.visitor.bannedAt);
  assert.equal(d.data.visitor.banReason, 'abusive');

  assert.equal((await ban(supervisor.token, 'DELETE')).status, 200);
  assert.equal((await say(store.publicKey, chat.token, 'after unban', {}, O)).status, 201);
  const audits = await mods.prisma.auditLog.findMany({ where: { storeId: store.id, action: { in: ['visitor.banned', 'visitor.unbanned'] } } });
  assert.equal(audits.length, 2);
});

test('trash/spam: hidden from inbox, restorable, visitor continues the same chat, permanent delete only from there', async () => {
  const chat = await newChat('trash me');
  const move = (token, folder, ids = [chat.convId]) => call('POST', C('/bulk'), { token, body: { ids, action: 'folder', folder } });
  assert.equal((await move(agent1.token, 'TRASH')).status, 403, 'agents cannot trash');
  assert.equal((await call('DELETE', C(`/${chat.convId}`), { token: owner.token })).status, 409, 'cannot permanently delete from the inbox');

  const r = await move(supervisor.token, 'TRASH');
  assert.deepEqual(r.data.updated, [chat.convId]);
  const inbox = await call('GET', C('?status=ALL'), { token: owner.token });
  assert.ok(!inbox.data.items.some((c) => c.id === chat.convId));
  const trash = await call('GET', C('?status=ALL&folder=TRASH'), { token: owner.token });
  assert.deepEqual(trash.data.items.map((c) => c.id), [chat.convId]);
  assert.equal(trash.data.items[0].folder, 'TRASH');
  assert.equal(trash.data.folderCounts.TRASH, 1);

  // The visitor writes again: the SAME chat continues and comes back to the Inbox.
  const again = await say(store.publicKey, chat.token, 'new question', {}, O);
  assert.equal(again.status, 201);
  assert.equal(again.data.conversationId, chat.convId);
  assert.equal((await mods.prisma.conversation.findUnique({ where: { id: chat.convId } })).folder, 'INBOX');
  assert.ok((await call('GET', C('?status=ALL'), { token: owner.token })).data.items.some((c) => c.id === chat.convId));

  // Spam: the visitor continues the same chat, it stays in Spam and starts no triggers.
  await move(owner.token, 'SPAM');
  const spamMsg = await say(store.publicKey, chat.token, 'more spam', {}, O);
  assert.equal(spamMsg.data.conversationId, chat.convId);
  assert.equal((await mods.prisma.conversation.findUnique({ where: { id: chat.convId } })).folder, 'SPAM');

  // Permanent delete from Spam (admins only).
  assert.equal((await call('DELETE', C(`/${chat.convId}`), { token: supervisor.token })).status, 403, 'supervisors cannot delete permanently');
  assert.equal((await call('DELETE', C(`/${chat.convId}`), { token: owner.token })).status, 200);
  assert.equal(await mods.prisma.conversation.count({ where: { id: chat.convId } }), 0);
});

test('bulk assign / status: permission checks, agent scoping, other store untouched', async () => {
  const a = await newChat('bulk a');
  const b = await newChat('bulk b');
  await call('PATCH', C(`/${b.convId}`), { token: owner.token, body: { assigneeId: agent2.id } });
  const otherV = await visit(other.publicKey, {});
  const otherConv = (await say(other.publicKey, otherV.token, 'other store chat')).data.conversationId;

  const bulk = (token, body) => call('POST', C('/bulk'), { token, body: { ids: [a.convId, b.convId, otherConv], ...body } });
  assert.equal((await bulk(agent1.token, { action: 'assign', assigneeId: agent2.id })).status, 403, 'agents cannot assign others');
  assert.equal((await bulk(owner.token, { action: 'assign', assigneeId: otherOwner.id })).status, 400, 'non-member');
  assert.equal((await bulk(owner.token, { action: 'status' })).status, 400, 'value required');

  const self = await bulk(agent1.token, { action: 'assign', assigneeId: agent1.id });
  assert.deepEqual(self.data.updated, [a.convId], "agent1 can't see agent2's chat or the other store's");
  assert.deepEqual(self.data.skipped.sort(), [b.convId, otherConv].sort());

  const st = await bulk(supervisor.token, { action: 'status', status: 'RESOLVED' });
  assert.deepEqual(st.data.updated.sort(), [a.convId, b.convId].sort());
  assert.deepEqual(st.data.skipped, [otherConv]);
  const oc = await mods.prisma.conversation.findUnique({ where: { id: otherConv } });
  assert.equal(oc.status, 'OPEN', 'other store untouched');
  assert.ok(await mods.prisma.auditLog.findFirst({ where: { storeId: store.id, action: 'conversation.bulk_status' } }));
});

test('realtime: moves and bans reach this store only', async () => {
  const chat = await newChat('rt');
  const ownerWs = await socket(`/ws/agent?token=${owner.token}`);
  const otherWs = await socket(`/ws/agent?token=${otherOwner.token}`);
  await call('POST', C('/bulk'), { token: supervisor.token, body: { ids: [chat.convId], action: 'folder', folder: 'SPAM' } });
  const moved = await ownerWs.waitFor('conversations_moved');
  assert.deepEqual(moved.data, { storeId: store.id, ids: [chat.convId], folder: 'SPAM' });
  await call('POST', `/api/stores/${store.id}/visitors/${chat.visitorId}/ban`, { token: owner.token, body: {} });
  await ownerWs.waitFor('visitor_banned', (d) => d.visitorId === chat.visitorId && d.bannedAt);
  assert.ok(!otherWs.events.some((e) => e.type === 'conversations_moved' || e.type === 'visitor_banned'));
  await Promise.all([ownerWs.close(), otherWs.close()]);
});

test('bulk permanent delete: admins only, only chats in Trash/Spam, other stores untouched', async () => {
  const mk = async () => {
    const v = await visit(store.publicKey, { origin: O });
    return (await say(store.publicKey, v.token, 'to delete', {}, O)).data.conversationId;
  };
  const [t1, t2, inbox] = [await mk(), await mk(), await mk()];
  await mods.prisma.conversation.updateMany({ where: { id: { in: [t1, t2] } }, data: { folder: 'TRASH' } });
  const bulkDel = (token, ids) => call('POST', `/api/stores/${store.id}/conversations/bulk`, { token, body: { ids, action: 'delete' } });
  assert.equal((await bulkDel(supervisor.token, [t1])).status, 403);
  const r = await bulkDel(owner.token, [t1, t2, inbox]);
  assert.equal(r.status, 200);
  assert.deepEqual(r.data.updated.sort(), [t1, t2].sort());
  assert.equal(await mods.prisma.conversation.count({ where: { id: { in: [t1, t2] } } }), 0);
  assert.equal(await mods.prisma.conversation.count({ where: { id: inbox } }), 1, 'inbox chats are never deleted');
});
