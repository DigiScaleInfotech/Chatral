import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { start, stop, call, makeUser, makeStore, addMember, visit, say, cid, mods, DAY } from './helpers.js';

let sup, owner, store;
const ORIGIN = 'https://shop.test';
const conv = (id) => mods.prisma.conversation.findUnique({ where: { id } });

before(async () => {
  await start();
  sup = await makeUser('super@r.test', { role: 'SUPER_ADMIN' });
  owner = await makeUser('owner@r.test');
  store = await makeStore(sup.token, 'Retention Store', ['shop.test']);
  await addMember(sup.token, store.id, owner.email, 'OWNER');
});
after(stop);
beforeEach(() => mods.clock.reset());

test('returning visitor after 20 days resumes the same conversation with full history', async () => {
  const v = await visit(store.publicKey, { origin: ORIGIN });
  const first = await say(store.publicKey, v.token, 'Do you ship to Canada?', {}, ORIGIN);
  const id = first.data.conversationId;
  await call('POST', `/api/stores/${store.id}/conversations/${id}/messages`, { token: owner.token, body: { body: 'Yes we do!', clientMsgId: cid() } });

  mods.clock.advance(20 * DAY);
  const back = await visit(store.publicKey, { origin: ORIGIN, token: v.token });
  assert.equal(back.data.visitor.id, v.data.visitor.id, 'same visitor recognised');
  assert.equal(back.data.conversation.id, id, 'same conversation id');
  assert.deepEqual(back.data.conversation.messages.filter((m) => m.senderType !== 'SYSTEM').map((m) => m.body), ['Do you ship to Canada?', 'Yes we do!']);
  const again = await say(store.publicKey, v.token, 'Great, how long does it take?', {}, ORIGIN);
  assert.equal(again.data.conversationId, id, 'message continues the same conversation');
  assert.equal(await mods.prisma.conversation.count({ where: { visitorId: v.data.visitor.id } }), 1);
});

test('only qualifying visitor activity moves expiresAt (rolling 30 days)', async () => {
  const v = await visit(store.publicKey, { origin: ORIGIN });
  const t0 = mods.clock.now().getTime();
  const id = (await say(store.publicKey, v.token, 'hello', {}, ORIGIN)).data.conversationId;
  const exp0 = (await conv(id)).expiresAt.getTime();
  assert.ok(Math.abs(exp0 - (t0 + 30 * DAY)) < 5000, 'expiresAt = lastActivityAt + 30d');

  mods.clock.advance(5 * DAY);
  // NOT qualifying: page views / widget loads, agent replies, automated (bot) messages, internal notes, pageview pings.
  await visit(store.publicKey, { origin: ORIGIN, token: v.token });
  await call('POST', `/api/widget/${store.publicKey}/pageview`, { body: { url: 'https://shop.test/p2' }, headers: { 'X-Visitor-Token': v.token, Origin: ORIGIN } });
  await call('POST', `/api/stores/${store.id}/conversations/${id}/messages`, { token: owner.token, body: { body: 'agent here', clientMsgId: cid() } });
  await call('POST', `/api/stores/${store.id}/conversations/${id}/messages`, { token: owner.token, body: { body: 'note', clientMsgId: cid(), note: true } });
  const { sendStaffMessage } = await import('../src/services/conversations.js');
  await sendStaffMessage(store.id, id, { senderType: 'BOT', senderName: 'Bot', body: 'automated' });
  await call('PATCH', `/api/stores/${store.id}/conversations/${id}`, { token: owner.token, body: { status: 'PENDING', tags: ['x'] } });
  assert.equal((await conv(id)).expiresAt.getTime(), exp0, 'deadline unchanged by non-qualifying activity');

  // Qualifying: visitor message resets to now + 30d.
  await say(store.publicKey, v.token, 'still there?', {}, ORIGIN);
  const exp1 = (await conv(id)).expiresAt.getTime();
  assert.ok(Math.abs(exp1 - (mods.clock.now().getTime() + 30 * DAY)) < 5000);

  // Qualifying: explicit resumption.
  mods.clock.advance(10 * DAY);
  const r = await call('POST', `/api/widget/${store.publicKey}/resume`, { body: { conversationId: id }, headers: { 'X-Visitor-Token': v.token, Origin: ORIGIN } });
  assert.equal(r.status, 200);
  assert.ok(Math.abs(new Date(r.data.expiresAt).getTime() - (mods.clock.now().getTime() + 30 * DAY)) < 5000);

  // Rolling: 25 days later (40 days after first message) the conversation is still alive.
  mods.clock.advance(25 * DAY);
  await mods.retention.sweepExpired();
  assert.ok(await conv(id), 'still alive: last activity was 25 days ago');
  // 30+ days without qualifying activity: expired, but with no attachments the sweep has nothing to do -
  // the conversation and its messages are never deleted by retention.
  mods.clock.advance(6 * DAY);
  assert.equal(await mods.retention.sweepExpired(), 0, 'no attachments to sweep');
  assert.ok(await conv(id), 'conversation kept');
  assert.ok((await mods.prisma.message.count({ where: { conversationId: id } })) > 0, 'messages kept');
});

test('an expired conversation is kept (not resumed) for a returning visitor; a new chat starts instead', async () => {
  const v = await visit(store.publicKey, { origin: ORIGIN });
  const id = (await say(store.publicKey, v.token, 'old question', {}, ORIGIN)).data.conversationId;
  mods.clock.advance(31 * DAY);
  // Expired: not resumable, even though the row is never deleted.
  const back = await visit(store.publicKey, { origin: ORIGIN, token: v.token });
  assert.equal(back.data.conversation, null);
  await mods.retention.sweepExpired();
  assert.ok(await conv(id), 'old conversation and its text are kept, not deleted');
  // Widget still holding the old id: gets a NEW conversation, old one stays untouched.
  const m = await say(store.publicKey, v.token, 'new question', { conversationId: id }, ORIGIN);
  assert.notEqual(m.data.conversationId, id);
  const msgs = await mods.prisma.message.findMany({ where: { conversationId: m.data.conversationId } });
  assert.deepEqual(msgs.map((x) => x.body), ['new question'], 'no old history leaks into the new conversation');
  const oldMsgs = await mods.prisma.message.findMany({ where: { conversationId: id } });
  assert.deepEqual(oldMsgs.map((x) => x.body), ['old question'], 'old conversation history is preserved as-is');
  const resume = await call('POST', `/api/widget/${store.publicKey}/resume`, { body: { conversationId: id }, headers: { 'X-Visitor-Token': v.token, Origin: ORIGIN } });
  assert.equal(resume.status, 404);
});

test('attachments expire and are removed, but the conversation and message text are kept', async () => {
  const v = await visit(store.publicKey, { origin: ORIGIN });
  const id = (await say(store.publicKey, v.token, 'here is a photo', {}, ORIGIN)).data.conversationId;
  const up = await call('POST', `/api/widget/${store.publicKey}/uploads`, { raw: Buffer.from('%PDF-1.4 test'), headers: { 'Content-Type': 'application/pdf', 'X-Filename': 'invoice.pdf', 'X-Visitor-Token': v.token, Origin: ORIGIN } });
  assert.equal(up.status, 201);
  const sent = await say(store.publicKey, v.token, '', { attachmentId: up.data.id }, ORIGIN);
  const msgId = sent.data.message?.id || sent.data.id;
  const att = await mods.prisma.attachment.findUnique({ where: { id: up.data.id } });
  const file = path.resolve(mods.config.config.uploadDir, att.storagePath);
  assert.ok(fs.existsSync(file));
  mods.clock.advance(31 * DAY);
  assert.equal(await mods.retention.sweepExpired(), 1);
  assert.equal(await mods.prisma.attachment.count({ where: { id: att.id } }), 0, 'attachment row removed');
  await mods.jobs.drain();
  assert.ok(!fs.existsSync(file), 'file removed from disk');
  assert.ok(await conv(id), 'conversation kept');
  const msg = await mods.prisma.message.findUnique({ where: { id: msgId } });
  assert.equal(msg.attachmentId, null, 'message no longer points at the deleted attachment');
  assert.equal(msg.meta?.removedAttachment?.filename, 'invoice.pdf', 'original filename kept as a marker');
  const log = await mods.prisma.auditLog.findFirst({ where: { storeId: store.id, action: 'retention.media_deleted' } });
  assert.ok(log, 'audit logged under retention.media_deleted');
});

test('concurrent cleanup workers remove each expired attachment exactly once', async () => {
  const ids = [];
  for (let i = 0; i < 25; i++) {
    const v = await visit(store.publicKey, { origin: ORIGIN });
    const id = (await say(store.publicKey, v.token, `msg ${i}`, {}, ORIGIN)).data.conversationId;
    const up = await call('POST', `/api/widget/${store.publicKey}/uploads`, { raw: Buffer.from('file'), headers: { 'Content-Type': 'text/plain', 'X-Filename': `f${i}.txt`, 'X-Visitor-Token': v.token, Origin: ORIGIN } });
    await say(store.publicKey, v.token, '', { attachmentId: up.data.id }, ORIGIN);
    ids.push(id);
  }
  mods.clock.advance(31 * DAY);
  const counts = await Promise.all([1, 2, 3, 4].map(() => mods.retention.sweepExpired({ batch: 5 })));
  assert.equal(counts.reduce((a, b) => a + b, 0), 25, `total swept ${counts}`);
  assert.equal(await mods.prisma.conversation.count({ where: { id: { in: ids } } }), 25, 'all conversations kept');
  assert.equal(await mods.prisma.attachment.count({ where: { conversationId: { in: ids } } }), 0, 'all attachments removed, exactly once');
  const logs = await mods.prisma.auditLog.findMany({ where: { storeId: store.id, action: 'retention.media_deleted' } });
  assert.ok(logs.reduce((a, l) => a + l.meta.count, 0) >= 25);
});

test('race: visitor message vs cleanup on an expiring conversation never loses the message', async () => {
  for (let round = 0; round < 8; round++) {
    mods.clock.reset();
    const v = await visit(store.publicKey, { origin: ORIGIN });
    const id = (await say(store.publicKey, v.token, 'first', {}, ORIGIN)).data.conversationId;
    // Expires in exactly 30 days. Jump to just past it and race.
    mods.clock.advance(30 * DAY + 1000);
    const [sent] = await Promise.all([say(store.publicKey, v.token, `late ${round}`, { conversationId: id }, ORIGIN), mods.retention.sweepExpired()]);
    assert.equal(sent.status, 201);
    const target = await conv(sent.data.conversationId);
    assert.ok(target, 'message landed in an existing conversation');
    const bodies = (await mods.prisma.message.findMany({ where: { conversationId: target.id } })).map((m) => m.body);
    assert.ok(bodies.includes(`late ${round}`));
    if (target.id === id) assert.fail('expired conversation must not be revived');
  }
});

test('cleared cookies / unknown token → new anonymous visitor, no access to old chat', async () => {
  const v = await visit(store.publicKey, { origin: ORIGIN });
  await say(store.publicKey, v.token, 'my private question', {}, ORIGIN);
  const fresh = await visit(store.publicKey, { origin: ORIGIN }); // no token (cookies cleared)
  assert.notEqual(fresh.data.visitor.id, v.data.visitor.id);
  assert.equal(fresh.data.conversation, null);
  const forged = await visit(store.publicKey, { origin: ORIGIN, token: 'x'.repeat(43) });
  assert.equal(forged.data.conversation, null);
  assert.ok(forged.token && forged.token !== 'x'.repeat(43), 'forged token replaced with a new identity');
});

test('retention days are configurable per store (owner only) and recompute deadlines', async () => {
  const v = await visit(store.publicKey, { origin: ORIGIN });
  const id = (await say(store.publicKey, v.token, 'hi', {}, ORIGIN)).data.conversationId;
  const r = await call('PATCH', `/api/stores/${store.id}`, { token: owner.token, body: { retentionDays: 7 } });
  assert.equal(r.status, 200);
  const c = await conv(id);
  assert.ok(Math.abs(c.expiresAt - c.lastActivityAt - 7 * DAY) < 1000);
  await call('PATCH', `/api/stores/${store.id}`, { token: owner.token, body: { retentionDays: 30 } });
});

test('scheduled sweep job is enqueued once per window and runs through the queue', async () => {
  await mods.prisma.job.deleteMany({ where: { type: 'retention_sweep' } });
  await Promise.all([mods.retention.scheduleSweep(), mods.retention.scheduleSweep(), mods.retention.scheduleSweep()]);
  assert.equal(await mods.prisma.job.count({ where: { type: 'retention_sweep' } }), 1);
  const v = await visit(store.publicKey, { origin: ORIGIN });
  const id = (await say(store.publicKey, v.token, 'bye', {}, ORIGIN)).data.conversationId;
  mods.clock.advance(31 * DAY);
  await mods.jobs.drain();
  assert.ok(await conv(id), 'conversation kept (no attachments to sweep)');
  assert.equal((await mods.prisma.job.findFirst({ where: { type: 'retention_sweep' } })).status, 'DONE');
});
