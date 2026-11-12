// Tickets: creation (compose / chat / offline message), validation, real SMTP delivery to a local
// SMTP server, retries without duplicate emails, failures, threading, permissions and tenant isolation.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { start, stop, call, makeUser, makeStore, addMember, visit, say, socket, cid, mods, sleep } from './helpers.js';

let sup, owner, agent1, agent2, store, other, otherOwner, smtp;

/** Minimal SMTP server that records messages. Recipients starting "bounce" get 550, "later" get 451. */
function smtpSink() {
  const mails = [];
  const server = net.createServer((sock) => {
    let data = null;
    let mail = { rcpt: [] };
    let buf = '';
    const say = (l) => sock.write(l + '\r\n');
    say('220 sink ESMTP');
    sock.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      let i;
      while ((i = buf.indexOf('\r\n')) >= 0) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 2);
        if (data !== null) {
          if (line === '.') { mails.push({ ...mail, raw: data.join('\r\n') }); mail = { rcpt: [] }; data = null; say('250 queued'); }
          else data.push(line.startsWith('..') ? line.slice(1) : line);
          continue;
        }
        const cmd = line.slice(0, 4).toUpperCase();
        if (cmd === 'EHLO' || cmd === 'HELO') sock.write('250-sink\r\n250-AUTH PLAIN LOGIN\r\n250 8BITMIME\r\n');
        else if (cmd === 'AUTH') say('235 ok');
        else if (cmd === 'MAIL') { mail.from = line; say('250 ok'); }
        else if (cmd === 'RCPT') {
          if (/<bounce/i.test(line)) say('550 no such user');
          else if (/<later/i.test(line)) say('451 try again later');
          else { mail.rcpt.push(line.match(/<([^>]+)>/)[1]); say('250 ok'); }
        } else if (cmd === 'DATA') { data = []; say('354 go'); }
        else if (cmd === 'RSET') { mail = { rcpt: [] }; say('250 ok'); }
        else if (cmd === 'QUIT') { say('221 bye'); sock.end(); }
        else say('250 ok');
      }
    });
    sock.on('error', () => {});
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r({ server, mails, port: server.address().port })));
}

const smtpOn = () => Object.assign(mods.config.config.smtp, { host: '127.0.0.1', port: smtp.port, secure: false, user: 'sink', pass: 'sink', from: 'support@tickets.test' });
const smtpOff = () => Object.assign(mods.config.config.smtp, { host: undefined, user: undefined });
const deliver = async () => { await mods.jobs.drain(); };
const T = (path) => `/api/stores/${store.id}/tickets${path}`;
const create = (token, body, storeId = store.id) => call('POST', `/api/stores/${storeId}/tickets`, { token, body: { requestId: cid(), contactEmail: 'pat@customer.test', subject: 'Order question', body: 'Hello Pat', ...body } });

before(async () => {
  await start();
  smtp = await smtpSink();
  sup = await makeUser('super@tickets.test', { role: 'SUPER_ADMIN' });
  owner = await makeUser('owner@tickets.test');
  agent1 = await makeUser('agent1@tickets.test');
  agent2 = await makeUser('agent2@tickets.test');
  otherOwner = await makeUser('other@tickets.test');
  store = await makeStore(sup.token, 'Ticket Store', ['tickets.test']);
  other = await makeStore(sup.token, 'Other Ticket Store', []);
  await addMember(sup.token, store.id, owner.email, 'OWNER');
  await addMember(sup.token, store.id, agent1.email, 'AGENT');
  await addMember(sup.token, store.id, agent2.email, 'AGENT');
  await addMember(sup.token, other.id, otherOwner.email, 'OWNER');
});
after(async () => { smtpOff(); smtp.server.close(); await stop(); });
beforeEach(async () => {
  smtpOn();
  smtp.mails.length = 0;
  await mods.prisma.job.deleteMany({});
});

test('compose: validation, no ticket without email set up, real delivery, retry-safe create', async () => {
  assert.equal((await create(owner.token, { contactEmail: 'not-an-email' })).status, 400);
  assert.equal((await create(owner.token, { subject: '  ' })).status, 400);
  assert.equal((await create(owner.token, { body: '' })).status, 400);
  assert.equal((await create(owner.token, { cc: ['bad'] })).status, 400);

  smtpOff();
  const refused = await create(owner.token, {});
  assert.equal(refused.status, 409);
  assert.match(refused.data.error, /Email is not set up/);
  assert.equal(await mods.prisma.ticket.count({ where: { storeId: store.id } }), 0, 'nothing created when it cannot be sent');
  smtpOn();

  const requestId = cid();
  const body = { requestId, contactName: 'Pat Doe', contactEmail: 'PAT@customer.test', cc: ['boss@customer.test', 'pat@customer.test'], subject: 'Order question', body: 'Your order ships Monday.', priority: 'HIGH', tags: ['Orders', 'orders'] };
  const a = await call('POST', T(''), { token: owner.token, body });
  assert.equal(a.status, 201);
  assert.equal(a.data.ticket.number, 1);
  assert.equal(a.data.ticket.contactEmail, 'pat@customer.test');
  assert.deepEqual(a.data.ticket.cc, ['boss@customer.test'], 'cc de-duplicated and excludes the main recipient');
  assert.deepEqual(a.data.ticket.tags, ['orders']);
  const again = await call('POST', T(''), { token: owner.token, body });
  assert.equal(again.status, 200);
  assert.equal(again.data.duplicate, true);
  assert.equal(again.data.ticket.id, a.data.ticket.id);

  let d = await call('GET', T(`/${a.data.ticket.id}`), { token: owner.token });
  assert.equal(d.data.messages.find((m) => m.senderType === 'AGENT').emailStatus, 'QUEUED', 'not claimed as sent before SMTP accepts it');
  await deliver();
  await deliver();
  assert.equal(smtp.mails.length, 1, 'exactly one email despite the retried create');
  const mail = smtp.mails[0];
  assert.deepEqual(mail.rcpt.sort(), ['boss@customer.test', 'pat@customer.test']);
  assert.match(mail.raw, /Subject: \[#1\] Order question/);
  assert.match(mail.raw, /Your order ships Monday\./);
  d = await call('GET', T(`/${a.data.ticket.id}`), { token: owner.token });
  const sent = d.data.messages.find((m) => m.senderType === 'AGENT');
  assert.equal(sent.emailStatus, 'SENT');
  assert.ok(sent.emailMessageId && sent.sentAt);
  assert.equal(d.data.messages[0].senderType, 'SYSTEM');

  const second = await create(owner.token, {});
  assert.equal(second.data.ticket.number, 2, 'per-store numbering');
  const otherTicket = await create(otherOwner.token, {}, other.id);
  assert.equal(otherTicket.data.ticket.number, 1, 'numbering is per store');
});

test('from a chat and from an offline message: transcript kept, notes excluded, visibility enforced', async () => {
  const v = await visit(store.publicKey, { origin: 'https://tickets.test' });
  const said = await say(store.publicKey, v.token, 'My ring arrived scratched', {}, 'https://tickets.test');
  const conv = await mods.prisma.conversation.findUnique({ where: { id: said.data.conversationId } });
  await call('POST', `/api/stores/${store.id}/conversations/${conv.id}/messages`, { token: owner.token, body: { body: 'Internal: check batch 42', note: true, clientMsgId: cid() } });
  await call('PATCH', `/api/stores/${store.id}/conversations/${conv.id}`, { token: owner.token, body: { assigneeId: agent1.id } });

  assert.equal((await create(agent2.token, { conversationId: conv.id })).status, 404, 'agent who cannot see the chat cannot ticket it');
  const t = await create(agent1.token, { conversationId: conv.id, subject: 'RE: Chat' });
  assert.equal(t.status, 201);
  assert.equal(t.data.ticket.conversationId, conv.id);
  const d = await call('GET', T(`/${t.data.ticket.id}`), { token: agent1.token });
  const sys = d.data.messages[0];
  assert.match(sys.body, /created from a chat/);
  assert.match(sys.body, /Visitor: My ring arrived scratched/);
  assert.doesNotMatch(sys.body, /batch 42/, 'internal notes are not copied');
  const list = await call('GET', T(`?status=ALL&conversationId=${conv.id}`), { token: agent1.token });
  assert.deepEqual(list.data.items.map((i) => i.id), [t.data.ticket.id]);

  // Offline form → ticket.
  const ov = await visit(store.publicKey, { origin: 'https://tickets.test' });
  const off = await call('POST', `/api/widget/${store.publicKey}/offline`, { headers: { 'X-Visitor-Token': ov.token, Origin: 'https://tickets.test' }, body: { name: 'Olive', email: 'olive@customer.test', message: 'Please call me back about sizing', clientMsgId: cid() } });
  assert.equal(off.status, 201);
  const oc = await mods.prisma.conversation.findUnique({ where: { id: off.data.conversationId } });
  assert.equal(oc.isOffline, true);
  const ot = await create(owner.token, { conversationId: oc.id, contactEmail: 'olive@customer.test', contactName: null });
  assert.equal(ot.status, 201);
  assert.equal(ot.data.ticket.contactName, 'Olive', 'visitor name carried over');
  const od = await call('GET', T(`/${ot.data.ticket.id}`), { token: owner.token });
  assert.match(od.data.messages[0].body, /created from an offline message/);
  assert.match(od.data.messages[0].body, /Please call me back about sizing/);
  assert.ok(await mods.prisma.message.findFirst({ where: { conversationId: oc.id } }), 'original offline message is untouched');
});

test('replies thread by Message-ID, notes are never emailed, closed tickets reopen, duplicates send once', async () => {
  const t = (await create(owner.token, {})).data.ticket;
  await deliver();
  const first = smtp.mails[0].raw.match(/Message-ID:\s*(<[^>]+>)/i)[1];

  const note = await call('POST', T(`/${t.id}/messages`), { token: owner.token, body: { body: 'internal only', note: true, clientMsgId: cid() } });
  assert.equal(note.status, 201);
  assert.equal(note.data.message.emailStatus, 'NONE');

  await call('PATCH', T(`/${t.id}`), { token: owner.token, body: { status: 'CLOSED' } });
  const clientMsgId = cid();
  const r1 = await call('POST', T(`/${t.id}/messages`), { token: owner.token, body: { body: 'Following up', clientMsgId } });
  const r2 = await call('POST', T(`/${t.id}/messages`), { token: owner.token, body: { body: 'Following up', clientMsgId } });
  assert.equal(r1.status, 201);
  assert.equal(r2.status, 200);
  assert.equal(r1.data.ticket.status, 'OPEN', 'reply reopens a closed ticket');
  await deliver();
  assert.equal(smtp.mails.length, 2, 'first email + one reply; the note and the duplicate send nothing');
  const reply = smtp.mails[1].raw;
  assert.match(reply, /Subject: Re: \[#\d+\] Order question/);
  assert.ok(reply.replace(/\r\n\s+/g, ' ').includes(`In-Reply-To: ${first}`), 'reply threads onto the first email');
  assert.doesNotMatch(smtp.mails.map((m) => m.raw).join(), /internal only/);

  const d = await call('GET', T(`/${t.id}`), { token: owner.token });
  const kinds = d.data.messages.map((m) => m.senderType);
  assert.deepEqual(kinds, ['SYSTEM', 'AGENT', 'NOTE', 'SYSTEM', 'AGENT']);
  assert.match(d.data.messages[3].body, /Status changed to closed/);
});

test('delivery failures: permanent rejection marks FAILED, temporary stays queued, retry re-sends once', async () => {
  const bad = (await create(owner.token, { contactEmail: 'bounce@customer.test' })).data.ticket;
  await deliver();
  let d = await call('GET', T(`/${bad.id}`), { token: owner.token });
  let m = d.data.messages.find((x) => x.senderType === 'AGENT');
  assert.equal(m.emailStatus, 'FAILED');
  assert.match(m.emailError, /550|no such user|Can't send mail/i);
  assert.equal(smtp.mails.length, 0);

  const later = (await create(owner.token, { contactEmail: 'later@customer.test' })).data.ticket;
  await deliver();
  d = await call('GET', T(`/${later.id}`), { token: owner.token });
  m = d.data.messages.find((x) => x.senderType === 'AGENT');
  assert.equal(m.emailStatus, 'QUEUED', 'a temporary error is retried, not reported as failed');
  assert.ok(m.emailError);
  const job = await mods.prisma.job.findFirst({ where: { type: 'ticket_email', dedupeKey: `ticket_email:${m.id}` } });
  assert.equal(job.status, 'PENDING');

  // Retry the failed one after fixing the address is not possible (address is fixed per ticket), so
  // check the retry path itself: only FAILED can be retried, and it queues exactly one new attempt.
  const okTicket = (await create(owner.token, {})).data.ticket;
  await deliver();
  const okMsg = (await call('GET', T(`/${okTicket.id}`), { token: owner.token })).data.messages.find((x) => x.senderType === 'AGENT');
  assert.equal((await call('POST', T(`/${okTicket.id}/messages/${okMsg.id}/retry`), { token: owner.token })).status, 409);
  const failedMsg = (await call('GET', T(`/${bad.id}`), { token: owner.token })).data.messages.find((x) => x.senderType === 'AGENT');
  assert.equal((await call('POST', T(`/${bad.id}/messages/${failedMsg.id}/retry`), { token: owner.token })).status, 200);
  assert.equal(await mods.prisma.job.count({ where: { type: 'ticket_email', dedupeKey: `ticket_email:${failedMsg.id}` } }), 1);
});

test('status, assignment, priority, tags, search, filters, bulk; agent scoping and store isolation', async () => {
  await mods.prisma.ticket.deleteMany({ where: { storeId: store.id } });
  const a = (await create(owner.token, { subject: 'Refund for order 1001', tags: ['refund'] })).data.ticket;
  const b = (await create(owner.token, { subject: 'Engraving request', contactEmail: 'eng@customer.test' })).data.ticket;
  const c = (await create(agent1.token, { subject: 'Sizing', assigneeId: agent1.id })).data.ticket;

  assert.equal((await create(agent1.token, { assigneeId: agent2.id })).status, 403, 'agents cannot assign others');
  assert.equal((await call('PATCH', T(`/${a.id}`), { token: agent1.token, body: { assigneeId: agent2.id } })).status, 403);
  assert.equal((await call('PATCH', T(`/${a.id}`), { token: owner.token, body: { assigneeId: otherOwner.id } })).status, 400, 'non-member');

  // agent2 can't see agent1's ticket.
  assert.equal((await call('GET', T(`/${c.id}`), { token: agent2.token })).status, 404);
  const agent2List = await call('GET', T('?status=ALL'), { token: agent2.token });
  assert.ok(!agent2List.data.items.some((i) => i.id === c.id));
  // Other store sees nothing.
  assert.equal((await call('GET', T(`/${a.id}`), { token: otherOwner.token })).status, 403);
  assert.equal((await call('GET', `/api/stores/${other.id}/tickets/${a.id}`, { token: otherOwner.token })).status, 404);

  const p = await call('PATCH', T(`/${a.id}`), { token: owner.token, body: { status: 'PENDING', priority: 'URGENT', tags: ['refund', 'vip'] } });
  assert.equal(p.status, 200);
  assert.equal(p.data.status, 'PENDING');
  assert.equal((await call('PATCH', T(`/${a.id}`), { token: owner.token, body: { status: 'DONE' } })).status, 400);

  const q = async (qs) => (await call('GET', T(qs), { token: owner.token })).data.items.map((i) => i.id).sort();
  assert.deepEqual(await q('?status=ALL&q=refund'), [a.id]);
  assert.deepEqual(await q('?status=ALL&q=eng%40customer'), [b.id]);
  assert.deepEqual(await q(`?status=ALL&q=%23${b.number}`), [b.id]);
  assert.deepEqual(await q('?status=PENDING'), [a.id]);
  assert.deepEqual(await q('?status=ALL&priority=URGENT'), [a.id]);
  assert.deepEqual(await q('?status=ALL&tag=vip'), [a.id]);
  assert.deepEqual(await q(`?status=ALL&assignee=${agent1.id}`), [c.id]);
  const counts = (await call('GET', T(''), { token: owner.token })).data.counts;
  assert.deepEqual(counts, { OPEN: 2, PENDING: 1 });

  const bulk = await call('POST', T('/bulk'), { token: agent2.token, body: { ids: [a.id, b.id, c.id], patch: { status: 'CLOSED' } } });
  assert.equal(bulk.status, 200);
  assert.deepEqual(bulk.data.skipped, [c.id], 'tickets the agent cannot see are skipped');
  assert.equal(bulk.data.updated.length, 2);
  assert.ok(bulk.data.updated.every((t) => t.status === 'CLOSED' && t.closedAt));
  assert.equal((await call('POST', T('/bulk'), { token: owner.token, body: { ids: [a.id], patch: {} } })).status, 400);
  const audit = await mods.prisma.auditLog.findFirst({ where: { storeId: store.id, action: 'ticket.bulk_update' } });
  assert.ok(audit);
});

test('attachments are validated, sent with the email, and private to the ticket', async () => {
  const up = await call('POST', T('/uploads'), { token: owner.token, raw: Buffer.from('invoice line 1\n'), headers: { 'Content-Type': 'text/plain', 'X-Filename': 'invoice.txt' } });
  assert.equal(up.status, 201);
  const html = await call('POST', T('/uploads'), { token: owner.token, raw: Buffer.from('<html><script>x</script>'), headers: { 'Content-Type': 'text/plain', 'X-Filename': 'x.txt' } });
  assert.equal(html.status, 415);
  // Someone else's pending upload can't be attached or downloaded.
  assert.equal((await call('GET', `/api/stores/${store.id}/ticket-files/${up.data.id}`, { token: agent1.token })).status, 404);
  assert.equal((await create(agent1.token, { attachmentIds: [up.data.id] })).status, 400);

  const t = (await create(owner.token, { attachmentIds: [up.data.id] })).data.ticket;
  await deliver();
  assert.match(smtp.mails[0].raw, /filename="?invoice\.txt/);
  const d = await call('GET', T(`/${t.id}`), { token: owner.token });
  assert.equal(d.data.attachments.length, 1);
  const file = await call('GET', `/api/stores/${store.id}/ticket-files/${up.data.id}`, { token: owner.token });
  assert.equal(file.status, 200);
  assert.equal((await call('GET', `/api/stores/${other.id}/ticket-files/${up.data.id}`, { token: otherOwner.token })).status, 404);
});

test('real-time: ticket events reach the right agents only', async () => {
  const ownerWs = await socket(`/ws/agent?token=${owner.token}`);
  const a2 = await socket(`/ws/agent?token=${agent2.token}`);
  const otherWs = await socket(`/ws/agent?token=${otherOwner.token}`);
  const t = (await create(owner.token, { assigneeId: agent1.id })).data.ticket;
  await ownerWs.waitFor('ticket_created', (d) => d.ticket.id === t.id);
  await deliver();
  await ownerWs.waitFor('ticket_message', (d) => d.ticketId === t.id && d.message.emailStatus === 'SENT');
  await sleep(100);
  assert.ok(!a2.events.some((e) => e.type.startsWith('ticket') && e.data.ticket?.id === t.id), 'other agent does not get assigned tickets');
  assert.ok(!otherWs.events.some((e) => e.type.startsWith('ticket')), 'other store gets nothing');
  await Promise.all([ownerWs.close(), a2.close(), otherWs.close()]);
});
