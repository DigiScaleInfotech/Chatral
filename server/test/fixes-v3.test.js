// Assignee defaults/names and notification-email delivery + diagnostics.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { start, stop, call, makeUser, makeStore, addMember, visit, say, cid, mods, sleep } from './helpers.js';

let sup, owner, agent, store, other, otherOwner, smtp;
const O = 'https://v3.test';

function smtpSink() {
  const mails = [];
  const server = net.createServer((sock) => {
    let data = null; let mail = { rcpt: [] }; let buf = '';
    const w = (l) => sock.write(l + '\r\n');
    w('220 sink');
    sock.on('data', (c) => {
      buf += c;
      let i;
      while ((i = buf.indexOf('\r\n')) >= 0) {
        const line = buf.slice(0, i); buf = buf.slice(i + 2);
        if (data) { if (line === '.') { mails.push({ ...mail, raw: data.join('\n') }); data = null; mail = { rcpt: [] }; w('250 ok'); } else data.push(line); continue; }
        const cmd = line.slice(0, 4).toUpperCase();
        if (cmd === 'EHLO' || cmd === 'HELO') sock.write('250-sink\r\n250-AUTH PLAIN LOGIN\r\n250 8BITMIME\r\n');
        else if (cmd === 'AUTH') w('235 ok');
        else if (cmd === 'RCPT') { if (/<bounce/i.test(line)) w('550 no such user'); else { mail.rcpt.push(line.match(/<([^>]+)>/)[1]); w('250 ok'); } }
        else if (cmd === 'DATA') { data = []; w('354 go'); }
        else if (cmd === 'QUIT') { w('221 bye'); sock.end(); }
        else w('250 ok');
      }
    });
    sock.on('error', () => {});
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r({ server, mails, port: server.address().port })));
}
const smtpOn = () => Object.assign(mods.config.config.smtp, { host: '127.0.0.1', port: smtp.port, secure: false, user: 'sink', pass: 'sink', from: 'alerts@v3.test' });
const smtpOff = () => Object.assign(mods.config.config.smtp, { host: undefined, user: undefined });
const settle = async () => { await mods.events.idle(); await sleep(30); await mods.events.idle(); };

before(async () => {
  await start();
  smtp = await smtpSink();
  sup = await makeUser('super@v3.test', { role: 'SUPER_ADMIN', name: 'Platform Admin' });
  owner = await makeUser('owner@v3.test', { name: 'Olivia Owner' });
  agent = await makeUser('agent@v3.test', { name: 'Arjun Agent' });
  otherOwner = await makeUser('other@v3.test');
  store = await makeStore(sup.token, 'V3 Store', ['v3.test']);
  other = await makeStore(sup.token, 'Other V3', ['other-v3.test']);
  await addMember(sup.token, store.id, owner.email, 'OWNER');
  await addMember(sup.token, store.id, agent.email, 'AGENT');
  await addMember(sup.token, other.id, otherOwner.email, 'OWNER');
});
after(async () => { smtpOff(); smtp.server.close(); await stop(); });
beforeEach(async () => { smtp.mails.length = 0; await mods.prisma.job.deleteMany({}); });

test('new chats are unassigned; a non-member super admin replying does not take the chat; members do; names are readable', async () => {
  const v = await visit(store.publicKey, { origin: O });
  const m = await say(store.publicKey, v.token, 'hi', {}, O);
  const id = m.data.conversationId;
  let d = await call('GET', `/api/stores/${store.id}/conversations/${id}`, { token: owner.token });
  assert.equal(d.data.conversation.assigneeId, null, 'new chat is unassigned');
  assert.equal(d.data.assignee, null);

  await call('POST', `/api/stores/${store.id}/conversations/${id}/messages`, { token: sup.token, body: { body: 'Super admin here', clientMsgId: cid() } });
  d = await call('GET', `/api/stores/${store.id}/conversations/${id}`, { token: owner.token });
  assert.equal(d.data.conversation.assigneeId, null, 'non-member super admin does not become the assignee');

  await call('POST', `/api/stores/${store.id}/conversations/${id}/messages`, { token: agent.token, body: { body: 'Agent here', clientMsgId: cid() } });
  d = await call('GET', `/api/stores/${store.id}/conversations/${id}`, { token: owner.token });
  assert.equal(d.data.conversation.assigneeId, agent.id, 'a member replying takes the chat (existing rule)');
  assert.deepEqual(d.data.assignee, { id: agent.id, name: 'Arjun Agent' });

  // Supervisors+ can reassign; agents can't assign others; other store can't touch it.
  assert.equal((await call('PATCH', `/api/stores/${store.id}/conversations/${id}`, { token: owner.token, body: { assigneeId: owner.id } })).status, 200);
  assert.equal((await call('PATCH', `/api/stores/${store.id}/conversations/${id}`, { token: agent.token, body: { assigneeId: agent.id } })).status, 404, 'agent no longer sees a chat assigned to someone else');
  assert.equal((await call('PATCH', `/api/stores/${store.id}/conversations/${id}`, { token: owner.token, body: { assigneeId: otherOwner.id } })).status, 400, 'non-member');
  assert.equal((await call('PATCH', `/api/stores/${other.id}/conversations/${id}`, { token: otherOwner.token, body: { assigneeId: null } })).status, 404);
  d = await call('GET', `/api/stores/${store.id}/conversations/${id}`, { token: owner.token });
  assert.equal(d.data.assignee.name, 'Olivia Owner');
});

test('new-chat email: skipped (not "sent") without SMTP; delivered once through SMTP; status shows recipients and outcome', async () => {
  smtpOff();
  const v1 = await visit(store.publicKey, { origin: O });
  await say(store.publicKey, v1.token, 'no smtp yet', {}, O);
  await settle();
  assert.equal(await mods.prisma.job.count({ where: { type: 'send_email', storeId: store.id } }), 0, 'nothing queued or claimed as sent');
  let st = await call('GET', `/api/stores/${store.id}/email/status`, { token: owner.token });
  assert.equal(st.data.configured, false);
  assert.equal((await call('GET', `/api/stores/${store.id}/email/status`, { token: agent.token })).status, 403);

  smtpOn();
  const v2 = await visit(store.publicKey, { origin: O });
  const c = await say(store.publicKey, v2.token, 'Where is my order?', {}, O);
  await say(store.publicKey, v2.token, 'second message (no new email)', {}, O);
  await settle();
  assert.equal(await mods.prisma.job.count({ where: { type: 'send_email', storeId: store.id } }), 1, 'one email per new chat');
  await mods.jobs.drain();
  assert.equal(smtp.mails.length, 1);
  assert.deepEqual(smtp.mails[0].rcpt.sort(), ['agent@v3.test', 'owner@v3.test']);
  assert.match(smtp.mails[0].raw, /Subject: New chat on V3 Store/);
  assert.ok(smtp.mails[0].raw.includes(c.data.conversationId));
  assert.doesNotMatch(smtp.mails[0].raw, /sink/, 'no SMTP credentials in the email');

  st = await call('GET', `/api/stores/${store.id}/email/status`, { token: owner.token });
  assert.equal(st.data.configured, true);
  assert.equal(st.data.source, 'platform');
  assert.deepEqual(st.data.recipients.sort(), ['agent@v3.test', 'owner@v3.test']);
  assert.deepEqual(st.data.undeliverable.sort(), ['agent@v3.test', 'owner@v3.test'], '.test addresses are flagged as unable to receive mail');
  assert.equal(st.data.deliveries[0].status, 'sent');
  assert.ok(!JSON.stringify(st.data).includes('Where is my order'), 'no message content in diagnostics');

  // A rejected recipient list is reported as failed, never "sent".
  await mods.prisma.store.update({ where: { id: store.id }, data: { notifyEmails: [] } });
  await call('PATCH', `/api/stores/${store.id}/members/${agent.id}`, { token: owner.token, body: { emailNotify: false } }).catch(() => {});
  await mods.prisma.storeMember.updateMany({ where: { storeId: store.id }, data: { emailNotify: false } });
  await mods.prisma.store.update({ where: { id: store.id }, data: { notifyEmails: ['bounce@v3.test'] } });
  const v3 = await visit(store.publicKey, { origin: O });
  await say(store.publicKey, v3.token, 'third chat', {}, O);
  await settle();
  await mods.jobs.drain();
  st = await call('GET', `/api/stores/${store.id}/email/status`, { token: owner.token });
  assert.equal(st.data.deliveries[0].status, 'failed');
  assert.match(st.data.deliveries[0].error, /rejected|550/);

  // The other store's status is separate.
  const os = await call('GET', `/api/stores/${other.id}/email/status`, { token: otherOwner.token });
  assert.deepEqual(os.data.deliveries, []);
  assert.equal((await call('GET', `/api/stores/${store.id}/email/status`, { token: otherOwner.token })).status, 403);
  await mods.prisma.storeMember.updateMany({ where: { storeId: store.id }, data: { emailNotify: true } });
  await mods.prisma.store.update({ where: { id: store.id }, data: { notifyEmails: [] } });
});
