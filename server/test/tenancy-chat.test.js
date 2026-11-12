import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start, stop, call, makeUser, makeStore, addMember, visit, say, socket, cid, mods } from './helpers.js';

let sup, ownerA, ownerB, agentA1, agentA2, storeA, storeB;
const ORIGIN_A = 'https://store-a.test';
const ORIGIN_B = 'https://store-b.test';

before(async () => {
  await start();
  sup = await makeUser('super@x.test', { role: 'SUPER_ADMIN' });
  ownerA = await makeUser('owner-a@x.test');
  ownerB = await makeUser('owner-b@x.test');
  agentA1 = await makeUser('agent-a1@x.test');
  agentA2 = await makeUser('agent-a2@x.test');
  storeA = await makeStore(sup.token, 'Store A', ['store-a.test']);
  storeB = await makeStore(sup.token, 'Store B', ['store-b.test']);
  await addMember(sup.token, storeA.id, ownerA.email, 'OWNER');
  await addMember(sup.token, storeB.id, ownerB.email, 'OWNER');
  await addMember(ownerA.token, storeA.id, agentA1.email, 'AGENT');
  await addMember(ownerA.token, storeA.id, agentA2.email, 'AGENT');
});
after(stop);

test('cross-store API access is denied', async () => {
  for (const [method, path] of [
    ['GET', `/api/stores/${storeB.id}`], ['GET', `/api/stores/${storeB.id}/conversations`], ['GET', `/api/stores/${storeB.id}/triggers`],
    ['PATCH', `/api/stores/${storeB.id}`], ['GET', `/api/stores/${storeB.id}/reports`], ['GET', `/api/stores/${storeB.id}/widget`],
  ]) {
    const r = await call(method, path, { token: ownerA.token, body: method === 'PATCH' ? { name: 'hacked' } : undefined });
    assert.equal(r.status, 403, `${method} ${path}`);
  }
  const list = await call('GET', '/api/stores', { token: ownerA.token });
  assert.deepEqual(list.data.map((s) => s.id), [storeA.id]);
  // Agents can't change store settings even in their own store.
  assert.equal((await call('PATCH', `/api/stores/${storeA.id}`, { token: agentA1.token, body: { name: 'x' } })).status, 403);
  // Non-super can't create stores.
  assert.equal((await call('POST', '/api/stores', { token: ownerA.token, body: { name: 'x' } })).status, 403);
});

test('conversation ids from another store are not reachable through own store routes', async () => {
  const v = await visit(storeB.publicKey, { origin: ORIGIN_B });
  const m = await say(storeB.publicKey, v.token, 'hello B', {}, ORIGIN_B);
  assert.equal(m.status, 201);
  const convB = m.data.conversationId;
  const r1 = await call('GET', `/api/stores/${storeA.id}/conversations/${convB}`, { token: ownerA.token });
  assert.equal(r1.status, 404);
  const r2 = await call('POST', `/api/stores/${storeA.id}/conversations/${convB}/messages`, { token: ownerA.token, body: { body: 'x', clientMsgId: cid() } });
  assert.equal(r2.status, 404);
  const r3 = await call('PATCH', `/api/stores/${storeA.id}/conversations/${convB}`, { token: ownerA.token, body: { status: 'RESOLVED' } });
  assert.equal(r3.status, 404);
});

test('widget isolation: origin allowlist, store-scoped visitor tokens', async () => {
  const bad = await visit(storeA.publicKey, { origin: 'https://evil.test' });
  assert.equal(bad.status, 403);
  const diag = await call('GET', `/api/stores/${storeA.id}/diagnostics`, { token: ownerA.token });
  assert.equal(diag.data.checks.find((c) => c.key === 'rejected').ok, false);

  const vA = await visit(storeA.publicKey, { origin: ORIGIN_A });
  assert.equal(vA.status, 200);
  assert.ok(vA.token);
  // Store A's visitor token means nothing on store B.
  const onB = await say(storeB.publicKey, vA.token, 'hi', {}, ORIGIN_B);
  assert.equal(onB.status, 401);
  const vB = await visit(storeB.publicKey, { origin: ORIGIN_B, token: vA.token });
  assert.notEqual(vB.data.visitor.id, vA.data.visitor.id, 'B issues its own identity');
  assert.ok(vB.token && vB.token !== vA.token);
  // Unknown key
  assert.equal((await visit('pk_nope', {})).status, 404);
});

test('realtime: agents only get their own store events; visitor WS bound to store', async () => {
  const wsA = await socket(`/ws/agent?token=${ownerA.token}`);
  const wsB = await socket(`/ws/agent?token=${ownerB.token}`);
  const v = await visit(storeA.publicKey, { origin: ORIGIN_A });
  await say(storeA.publicKey, v.token, 'only for A', {}, ORIGIN_A);
  await wsA.waitFor('message', (d) => d.message.body === 'only for A');
  await new Promise((r) => setTimeout(r, 200));
  assert.ok(!wsB.events.some((e) => e.type === 'message' && e.data.message?.body === 'only for A'));
  // Super admin may subscribe; other users' subscribe to foreign store is ignored.
  wsB.send('subscribe', { storeId: storeA.id });
  await say(storeA.publicKey, v.token, 'still only A', {}, ORIGIN_A);
  await wsA.waitFor('message', (d) => d.message.body === 'still only A');
  await new Promise((r) => setTimeout(r, 200));
  assert.ok(!wsB.events.some((e) => e.data?.message?.body === 'still only A'));
  // Visitor token from A cannot open a socket on B; bad origin rejected.
  await assert.rejects(socket(`/ws/visitor?key=${storeB.publicKey}&vt=${v.token}`), (e) => e.statusCode === 401);
  await assert.rejects(socket(`/ws/visitor?key=${storeA.publicKey}&vt=${v.token}`, { Origin: 'https://evil.test' }), (e) => e.statusCode === 403);
  await assert.rejects(socket(`/ws/agent?token=garbage`), (e) => e.statusCode === 401);
  await wsA.close(); await wsB.close();
});

test('messaging: persist-then-ack, dedupe, notes hidden, reconnect recovery, receipts', async () => {
  const v = await visit(storeA.publicKey, { origin: ORIGIN_A });
  const vws = await socket(`/ws/visitor?key=${storeA.publicKey}&vt=${v.token}`, { Origin: ORIGIN_A });
  const id = cid();
  const first = await say(storeA.publicKey, v.token, 'I need help', { clientMsgId: id }, ORIGIN_A);
  assert.equal(first.status, 201);
  const conv = first.data.conversationId;
  const inDb = await mods.prisma.message.findUnique({ where: { id: first.data.message.id } });
  assert.ok(inDb, 'message persisted before ack');
  // Same clientMsgId again (retry after network failure) → same message, no duplicate.
  const retry = await say(storeA.publicKey, v.token, 'I need help', { clientMsgId: id }, ORIGIN_A);
  assert.equal(retry.status, 200);
  assert.equal(retry.data.message.id, first.data.message.id);
  // Concurrent duplicate sends.
  const dupId = cid();
  const both = await Promise.all([1, 2, 3].map(() => say(storeA.publicKey, v.token, 'double click', { clientMsgId: dupId }, ORIGIN_A)));
  assert.equal(new Set(both.map((b) => b.data.message.id)).size, 1);
  assert.equal(await mods.prisma.message.count({ where: { conversationId: conv, clientMsgId: dupId } }), 1);

  // Agent reply + internal note
  const reply = await call('POST', `/api/stores/${storeA.id}/conversations/${conv}/messages`, { token: agentA1.token, body: { body: 'Hi, how can I help?', clientMsgId: cid() } });
  assert.equal(reply.status, 201);
  const note = await call('POST', `/api/stores/${storeA.id}/conversations/${conv}/messages`, { token: agentA1.token, body: { body: 'VIP customer', clientMsgId: cid(), note: true } });
  assert.equal(note.status, 201);
  await vws.waitFor('message', (d) => d.message.body === 'Hi, how can I help?');
  await new Promise((r) => setTimeout(r, 150));
  assert.ok(!vws.events.some((e) => e.data?.message?.body === 'VIP customer'), 'note never pushed to visitor');

  // Reconnect recovery: fetch after last seq the visitor had.
  const lastSeen = first.data.message.seq;
  const missed = await call('GET', `/api/widget/${storeA.publicKey}/conversations/${conv}/messages?after=${lastSeen}`, { headers: { 'X-Visitor-Token': v.token, Origin: ORIGIN_A } });
  const bodies = missed.data.messages.map((m) => m.body);
  assert.ok(bodies.includes('Hi, how can I help?'));
  assert.ok(!bodies.includes('VIP customer'));
  assert.ok(missed.data.messages.every((m, i, a) => i === 0 || m.seq > a[i - 1].seq), 'ordered by seq');

  // Delivery / read receipts
  const agentWs = await socket(`/ws/agent?token=${agentA1.token}`);
  vws.send('read', { conversationId: conv, seq: reply.data.message.seq });
  await agentWs.waitFor('receipt', (d) => d.visitorReadSeq === reply.data.message.seq);
  const c = await mods.prisma.conversation.findUnique({ where: { id: conv } });
  assert.equal(c.visitorReadSeq, reply.data.message.seq);
  assert.equal(c.unreadForVisitor, 0);

  // Typing indicator visitor → agent
  vws.send('typing', { conversationId: conv, typing: true });
  await agentWs.waitFor('typing', (d) => d.conversationId === conv && d.typing);
  await vws.close(); await agentWs.close();
});

test('agent role scoping, assignment rules, statuses, tags, search', async () => {
  const v = await visit(storeA.publicKey, { origin: ORIGIN_A });
  const m = await say(storeA.publicKey, v.token, 'order 12345 is late', {}, ORIGIN_A);
  const conv = m.data.conversationId;
  // agent1 takes it by replying
  await call('POST', `/api/stores/${storeA.id}/conversations/${conv}/messages`, { token: agentA1.token, body: { body: 'Looking', clientMsgId: cid() } });
  // agent2 (AGENT role) no longer sees it
  assert.equal((await call('GET', `/api/stores/${storeA.id}/conversations/${conv}`, { token: agentA2.token })).status, 404);
  // agent1 cannot assign to agent2 (supervisor-only), owner can
  assert.equal((await call('PATCH', `/api/stores/${storeA.id}/conversations/${conv}`, { token: agentA1.token, body: { assigneeId: agentA2.id } })).status, 403);
  assert.equal((await call('PATCH', `/api/stores/${storeA.id}/conversations/${conv}`, { token: ownerA.token, body: { assigneeId: agentA2.id, tags: ['Shipping', 'shipping'], priority: 'HIGH', status: 'PENDING' } })).status, 200);
  // cannot assign to a user from another store
  assert.equal((await call('PATCH', `/api/stores/${storeA.id}/conversations/${conv}`, { token: ownerA.token, body: { assigneeId: ownerB.id } })).status, 400);
  const c = await mods.prisma.conversation.findUnique({ where: { id: conv } });
  assert.deepEqual(c.tags, ['shipping']);
  assert.equal(c.priority, 'HIGH');
  assert.equal(c.status, 'PENDING');
  // search by message text + filters
  const s = await call('GET', `/api/stores/${storeA.id}/conversations?status=ALL&q=12345`, { token: ownerA.token });
  assert.deepEqual(s.data.items.map((i) => i.id), [conv]);
  const f = await call('GET', `/api/stores/${storeA.id}/conversations?status=PENDING&tag=shipping&priority=HIGH`, { token: ownerA.token });
  assert.ok(f.data.items.some((i) => i.id === conv));
  // resolve → visitor message reopens the SAME conversation
  await call('PATCH', `/api/stores/${storeA.id}/conversations/${conv}`, { token: ownerA.token, body: { status: 'RESOLVED' } });
  const again = await say(storeA.publicKey, v.token, 'one more thing', {}, ORIGIN_A);
  assert.equal(again.data.conversationId, conv);
  assert.equal(again.data.status, 'OPEN');
});

test('member management guards', async () => {
  const admin = await makeUser('admin-a@x.test');
  await addMember(ownerA.token, storeA.id, admin.email, 'ADMIN');
  // admin cannot create owners or demote the owner
  assert.equal((await call('POST', `/api/stores/${storeA.id}/members`, { token: admin.token, body: { email: 'new-owner@x.test', name: 'N', password: 'Password-12345', role: 'OWNER' } })).status, 400, 'members can only be agents');
  assert.equal((await call('PATCH', `/api/stores/${storeA.id}/members/${ownerA.id}`, { token: admin.token, body: { role: 'AGENT' } })).status, 403);
  // owner cannot remove the last owner
  assert.equal((await call('DELETE', `/api/stores/${storeA.id}/members/${ownerA.id}`, { token: ownerA.token })).status, 400);
  // admin cannot rotate keys (owner only)
  assert.equal((await call('POST', `/api/stores/${storeA.id}/rotate-key`, { token: admin.token, body: {} })).status, 403);
});

test('key rotation keeps old key during grace, then rejects it', async () => {
  const s = await makeStore(sup.token, 'Rotating', []);
  const r = await call('POST', `/api/stores/${s.id}/rotate-key`, { token: sup.token, body: { graceDays: 1 } });
  assert.equal(r.status, 200);
  assert.notEqual(r.data.publicKey, s.publicKey);
  assert.equal((await visit(s.publicKey)).status, 200, 'old key works in grace');
  assert.equal((await visit(r.data.publicKey)).status, 200);
  mods.clock.advance(2 * 86_400_000);
  try {
    assert.equal((await visit(s.publicKey)).status, 404, 'old key rejected after grace');
  } finally {
    mods.clock.reset();
  }
});

test('auth: wrong password, revoked tokens, deactivated users', async () => {
  assert.equal((await call('POST', '/api/auth/login', { body: { email: ownerA.email, password: 'nope' } })).status, 401);
  const u = await makeUser('temp@x.test');
  assert.equal((await call('GET', '/api/auth/me', { token: u.token })).status, 200);
  await call('POST', '/api/auth/logout-all', { token: u.token });
  assert.equal((await call('GET', '/api/auth/me', { token: u.token })).status, 401);
});

test('uploads: type sniffing, tenant-scoped download', async () => {
  const v = await visit(storeA.publicKey, { origin: ORIGIN_A });
  const m = await say(storeA.publicKey, v.token, 'see file', {}, ORIGIN_A);
  const png = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
  const up = await call('POST', `/api/widget/${storeA.publicKey}/uploads`, { raw: png, headers: { 'Content-Type': 'image/png', 'X-Filename': 'a.png', 'X-Visitor-Token': v.token, Origin: ORIGIN_A } });
  assert.equal(up.status, 201);
  const fake = await call('POST', `/api/widget/${storeA.publicKey}/uploads`, { raw: Buffer.from('MZ\x00\x00binary'), headers: { 'Content-Type': 'image/png', 'X-Filename': 'evil.png', 'X-Visitor-Token': v.token, Origin: ORIGIN_A } });
  assert.equal(fake.status, 415);
  const html = await call('POST', `/api/widget/${storeA.publicKey}/uploads`, { raw: Buffer.from('<script>alert(1)</script>'), headers: { 'Content-Type': 'text/html', 'X-Filename': 'x.html', 'X-Visitor-Token': v.token, Origin: ORIGIN_A } });
  assert.equal(html.status, 415);
  const disguisedHtml = await call('POST', `/api/widget/${storeA.publicKey}/uploads`, { raw: Buffer.from('<!DOCTYPE html><html><body>evil</body></html>'), headers: { 'Content-Type': 'text/plain', 'X-Filename': 'readme.txt', 'X-Visitor-Token': v.token, Origin: ORIGIN_A } });
  assert.equal(disguisedHtml.status, 415);
  const disguisedSvg = await call('POST', `/api/widget/${storeA.publicKey}/uploads`, { raw: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), headers: { 'Content-Type': 'text/plain', 'X-Filename': 'notes.txt', 'X-Visitor-Token': v.token, Origin: ORIGIN_A } });
  assert.equal(disguisedSvg.status, 415);
  const badExt = await call('POST', `/api/widget/${storeA.publicKey}/uploads`, { raw: Buffer.from('harmless content'), headers: { 'Content-Type': 'text/plain', 'X-Filename': 'payload.exe', 'X-Visitor-Token': v.token, Origin: ORIGIN_A } });
  assert.equal(badExt.status, 415);
  const own = await call('GET', `/api/stores/${storeA.id}/files/${up.data.id}`, { token: ownerA.token });
  assert.equal(own.res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(own.status, 200);
  assert.equal((await call('GET', `/api/stores/${storeB.id}/files/${up.data.id}`, { token: ownerB.token })).status, 404);
  const other = await visit(storeA.publicKey, { origin: ORIGIN_A });
  assert.equal((await call('GET', `/api/widget/${storeA.publicKey}/files/${up.data.id}`, { headers: { 'X-Visitor-Token': other.token, Origin: ORIGIN_A } })).status, 404);
  void m;
});

test('widget config: draft does not change live until publish; versions; validation', async () => {
  const w = await call('GET', `/api/stores/${storeA.id}/widget`, { token: ownerA.token });
  const draft = { ...w.data.draft, colors: { ...w.data.draft.colors, primary: '#ff0000' } };
  assert.equal((await call('PUT', `/api/stores/${storeA.id}/widget/draft`, { token: ownerA.token, body: draft })).status, 200);
  let live = await visit(storeA.publicKey, { origin: ORIGIN_A });
  assert.notEqual(live.data.config.colors.primary, '#ff0000', 'draft is not live');
  const pub = await call('POST', `/api/stores/${storeA.id}/widget/publish`, { token: ownerA.token, body: { note: 'red' } });
  assert.equal(pub.data.version, 2);
  live = await visit(storeA.publicKey, { origin: ORIGIN_A });
  assert.equal(live.data.config.colors.primary, '#ff0000');
  const restore = await call('POST', `/api/stores/${storeA.id}/widget/restore/1`, { token: ownerA.token });
  assert.notEqual(restore.data.draft.colors.primary, '#ff0000');
  const bad = await call('PUT', `/api/stores/${storeA.id}/widget/draft`, { token: ownerA.token, body: { ...draft, logoUrl: 'javascript:alert(1)' } });
  assert.equal(bad.status, 400);
  // Agents cannot edit widget
  assert.equal((await call('PUT', `/api/stores/${storeA.id}/widget/draft`, { token: agentA1.token, body: draft })).status, 403);
});

test('regression: agents cannot send typing indicators into chats assigned to someone else', async () => {
  const v = await visit(storeA.publicKey, { origin: ORIGIN_A });
  const vws = await socket(`/ws/visitor?key=${storeA.publicKey}&vt=${v.token}`, { Origin: ORIGIN_A });
  const conv = (await say(storeA.publicKey, v.token, 'typing test', {}, ORIGIN_A)).data.conversationId;
  await call('PATCH', `/api/stores/${storeA.id}/conversations/${conv}`, { token: ownerA.token, body: { assigneeId: agentA1.id } });
  const other = await socket(`/ws/agent?token=${agentA2.token}`);
  other.send('typing', { storeId: storeA.id, conversationId: conv, typing: true });
  await new Promise((r) => setTimeout(r, 250));
  assert.ok(!vws.events.some((e) => e.type === 'typing'), 'unassigned agent typing was forwarded');
  const own = await socket(`/ws/agent?token=${agentA1.token}`);
  own.send('typing', { storeId: storeA.id, conversationId: conv, typing: true });
  await vws.waitFor('typing', (d) => d.conversationId === conv);
  await Promise.all([vws.close(), other.close(), own.close()]);
});

test('regression: unknown email login is a plain 401 and takes as long as a wrong password', async () => {
  // Test users are hashed at cost 4 for speed; use the production cost for this comparison.
  await mods.prisma.user.update({ where: { id: ownerA.id }, data: { passwordHash: await mods.bcrypt.hash('Password-12345', 12) } });
  const time = async (email) => {
    const t = performance.now();
    const r = await call('POST', '/api/auth/login', { body: { email, password: 'wrong-password-1' } });
    assert.equal(r.status, 401);
    assert.equal(r.data.error, 'Wrong email or password');
    return performance.now() - t;
  };
  const median = (xs) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  const known = [];
  const unknown = [];
  for (let i = 0; i < 5; i++) {
    known.push(await time(ownerA.email));
    unknown.push(await time(`nobody${i}@nowhere.test`));
  }
  const ratio = median(unknown) / median(known);
  // The old placeholder hash (cost 10) answered about 4x faster (ratio ~0.25).
  assert.ok(ratio > 0.6, `unknown-email login is too fast: ratio ${ratio.toFixed(2)}`);
});

test('regression: removing an agent from a store cuts off their live socket', async () => {
  const temp = await makeUser('temp-agent@x.test');
  await addMember(ownerA.token, storeA.id, temp.email, 'AGENT');
  const ws = await socket(`/ws/agent?token=${temp.token}`);
  const v = await visit(storeA.publicKey, { origin: ORIGIN_A });
  await say(storeA.publicKey, v.token, 'before removal', {}, ORIGIN_A);
  await ws.waitFor('message', (d) => d.message.body === 'before removal');
  const closed = new Promise((r) => ws.ws.once('close', r));
  assert.equal((await call('DELETE', `/api/stores/${storeA.id}/members/${temp.id}`, { token: ownerA.token })).status, 200);
  await closed;
  // Reconnecting re-reads memberships from the database: no store A events any more.
  const again = await socket(`/ws/agent?token=${temp.token}`);
  await say(storeA.publicKey, v.token, 'after removal', {}, ORIGIN_A);
  await new Promise((r) => setTimeout(r, 250));
  assert.ok(!again.events.some((e) => e.data?.message?.body === 'after removal'));
  await again.close();
});

test('dashboard pages are served with a strict Content-Security-Policy', async () => {
  const r = await call('GET', '/admin/');
  const csp = r.res.headers.get('content-security-policy') || '';
  assert.match(csp, /script-src 'self'(;|$)/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
});

test('direct chat link: every store gets a unique 8-digit id; the diagnostics link uses the first allowed domain', async () => {
  const noDomain = await makeStore(sup.token, 'No Domain Store', []);
  assert.match(noDomain.chatLinkId, /^\d{8}$/, 'chatLinkId is exactly 8 digits');
  assert.match(storeA.chatLinkId, /^\d{8}$/, 'chatLinkId is served on the store object returned at creation');
  assert.notEqual(noDomain.chatLinkId, storeA.chatLinkId, 'different stores get different ids');

  // Visible to a plain agent too (not gated to admin) - the admin UI reads it from the base store object.
  const agent = await makeUser('chatlink-agent@x.test');
  await addMember(sup.token, noDomain.id, agent.email, 'AGENT');
  const seen = await call('GET', `/api/stores/${noDomain.id}`, { token: agent.token });
  assert.equal(seen.data.chatLinkId, noDomain.chatLinkId);

  // No allowed domain yet → diagnostics reports no link (nothing to build a URL from).
  const diag1 = await call('GET', `/api/stores/${noDomain.id}/diagnostics`, { token: sup.token });
  assert.equal(diag1.data.chatLink, null);

  // Add a wildcard domain → the link uses the first allowed origin, with the wildcard prefix stripped.
  await call('PATCH', `/api/stores/${noDomain.id}`, { token: sup.token, body: { allowedOrigins: ['*.example.com'] } });
  const diag2 = await call('GET', `/api/stores/${noDomain.id}/diagnostics`, { token: sup.token });
  assert.equal(diag2.data.chatLink, `https://example.com/#lc-${noDomain.chatLinkId}`);
});
