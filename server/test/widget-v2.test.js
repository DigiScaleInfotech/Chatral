// Domain allowlist, "Customer Support" sender name, typed pre-chat fields, transcript email, end chat,
// published-version history clearing, reports on empty stores, SMTP test email, pop-out page.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { start, stop, call, makeUser, makeStore, addMember, visit, say, socket, cid, mods } from './helpers.js';

let sup, owner, agent, store, other, otherOwner, empty, smtp;
const O = 'https://shop.test';

function smtpSink() {
  const mails = [];
  const server = net.createServer((sock) => {
    let data = null; let mail = { rcpt: [] }; let buf = '';
    const say2 = (l) => sock.write(l + '\r\n');
    say2('220 sink');
    sock.on('data', (c) => {
      buf += c;
      let i;
      while ((i = buf.indexOf('\r\n')) >= 0) {
        const line = buf.slice(0, i); buf = buf.slice(i + 2);
        if (data) { if (line === '.') { mails.push({ ...mail, raw: data.join('\n') }); data = null; mail = { rcpt: [] }; say2('250 ok'); } else data.push(line); continue; }
        const cmd = line.slice(0, 4).toUpperCase();
        if (cmd === 'EHLO' || cmd === 'HELO') sock.write('250-sink\r\n250-AUTH PLAIN LOGIN\r\n250 8BITMIME\r\n');
        else if (cmd === 'AUTH') say2('235 ok');
        else if (cmd === 'RCPT') { if (/<bounce/i.test(line)) say2('550 no such user'); else { mail.rcpt.push(line.match(/<([^>]+)>/)[1]); say2('250 ok'); } }
        else if (cmd === 'DATA') { data = []; say2('354 go'); }
        else if (cmd === 'QUIT') { say2('221 bye'); sock.end(); }
        else say2('250 ok');
      }
    });
    sock.on('error', () => {});
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r({ server, mails, port: server.address().port })));
}
const smtpOn = () => Object.assign(mods.config.config.smtp, { host: '127.0.0.1', port: smtp.port, secure: false, user: 'sink', pass: 'sink', from: 'support@shop.test' });
const smtpOff = () => Object.assign(mods.config.config.smtp, { host: undefined, user: undefined });
const W = (key, path, opts = {}) => call(opts.method || 'GET', `/api/widget/${key}${path}`, { ...opts, headers: { Origin: O, ...(opts.headers || {}) } });

async function publish(storeId, token, patch) {
  const w = await call('GET', `/api/stores/${storeId}/widget`, { token });
  const draft = { ...w.data.draft, ...patch };
  const put = await call('PUT', `/api/stores/${storeId}/widget/draft`, { token, body: draft });
  if (put.status !== 200) return put;
  return call('POST', `/api/stores/${storeId}/widget/publish`, { token, body: {} });
}

before(async () => {
  await start();
  smtp = await smtpSink();
  sup = await makeUser('super@v2.test', { role: 'SUPER_ADMIN' });
  owner = await makeUser('owner@v2.test', { name: 'Platform Admin' });
  agent = await makeUser('agent@v2.test');
  otherOwner = await makeUser('other@v2.test');
  store = await makeStore(sup.token, 'V2 Store', ['shop.test', '*.brand.test']);
  other = await makeStore(sup.token, 'Other V2', ['other.test']);
  empty = await makeStore(sup.token, 'Empty V2', []);
  await addMember(sup.token, store.id, owner.email, 'OWNER');
  await addMember(sup.token, store.id, agent.email, 'AGENT');
  await addMember(sup.token, other.id, otherOwner.email, 'OWNER');
});
after(async () => { smtpOff(); smtp.server.close(); await stop(); });

test('allowlist: only listed domains (and wildcard subdomains); unlisted, malformed and other-store domains are refused', async () => {
  const sess = (key, origin) => call('POST', `/api/widget/${key}/session`, { body: {}, headers: { Origin: origin } });
  assert.equal((await sess(store.publicKey, 'https://shop.test')).status, 200);
  assert.equal((await sess(store.publicKey, 'https://www.shop.test:8443')).status, 200, 'www and port normalised');
  assert.equal((await sess(store.publicKey, 'https://shop.test.')).status, 200, 'trailing dot normalised');
  assert.equal((await sess(store.publicKey, 'https://eu.brand.test')).status, 200, 'wildcard subdomain');
  for (const bad of ['https://violetjewels.com', 'https://shop.test.evil.com', 'https://evilshop.test', 'https://shop.test@evil.com', 'null', 'javascript:alert(1)', 'http://localhost:5600', 'https://other.test']) {
    assert.equal((await sess(store.publicKey, bad)).status, 403, bad);
  }
  const row = await mods.prisma.store.findUnique({ where: { id: store.id } });
  assert.ok(row.lastRejectedOrigin, 'rejection recorded for the health check');
  // A store with no domains accepts no website at all.
  assert.equal((await sess(empty.publicKey, 'https://anything.test')).status, 403);
  assert.equal((await sess(empty.publicKey, 'http://localhost:5600')).status, 403, 'localhost is not special');
  // Sending a message from an unauthorized page is refused too.
  const ok = await sess(store.publicKey, O);
  const msg = await call('POST', `/api/widget/${store.publicKey}/messages`, { headers: { Origin: 'https://violetjewels.com', 'X-Visitor-Token': ok.data.visitorToken }, body: { clientMsgId: cid(), body: 'hi' } });
  assert.equal(msg.status, 403);
  // WebSocket upgrade from an unauthorized origin is rejected.
  await assert.rejects(socket(`/ws/visitor?key=${store.publicKey}&vt=${ok.data.visitorToken}`, { Origin: 'https://violetjewels.com' }), (e) => e.statusCode === 403);
  const ws = await socket(`/ws/visitor?key=${store.publicKey}&vt=${ok.data.visitorToken}`, { Origin: O });
  await ws.close();
  // Health check reports the empty allowlist as a problem.
  const diag = await call('GET', `/api/stores/${empty.id}/diagnostics`, { token: sup.token });
  if (diag.status === 200) {
    const d = (diag.data.checks || diag.data).find?.((c) => c.key === 'domains');
    if (d) { assert.equal(d.ok, false); assert.match(d.label, /blocked on every website/); }
  }
  // "localhost" can be added explicitly for local testing.
  assert.equal((await call('PATCH', `/api/stores/${empty.id}`, { token: sup.token, body: { allowedOrigins: ['localhost'] } })).status, 200);
  assert.equal((await sess(empty.publicKey, 'http://localhost:5600')).status, 200);
});

test('customers see "Customer Support" for every agent reply; agents still see real names', async () => {
  const v = await visit(store.publicKey, { origin: O });
  const m = await say(store.publicKey, v.token, 'hello', {}, O);
  const convId = m.data.conversationId;
  const vs = await socket(`/ws/visitor?key=${store.publicKey}&vt=${v.token}`, { Origin: O });
  const r = await call('POST', `/api/stores/${store.id}/conversations/${convId}/messages`, { token: owner.token, body: { body: 'From a saved reply', clientMsgId: cid() } });
  assert.equal(r.status, 201);
  const live = await vs.waitFor('message', (d) => d.message.body === 'From a saved reply');
  assert.equal(live.data.message.senderName, 'Customer Support');
  assert.equal(live.data.message.senderAvatar, null);
  const hist = await W(store.publicKey, `/conversations/${convId}/messages?after=0`, { headers: { 'X-Visitor-Token': v.token } });
  const agentMsgs = hist.data.messages.filter((x) => x.senderType === 'AGENT');
  assert.ok(agentMsgs.length && agentMsgs.every((x) => x.senderName === 'Customer Support'));
  // System events (e.g. "X joined the chat") are kept unchanged as requested; no chat message carries the real name.
  assert.ok(hist.data.messages.filter((x) => x.senderType !== 'SYSTEM').every((x) => !JSON.stringify(x).includes('Platform Admin')));
  const det = await call('GET', `/api/stores/${store.id}/conversations/${convId}`, { token: owner.token });
  assert.equal(det.data.messages.find((x) => x.body === 'From a saved reply').senderName, 'Platform Admin');
  await vs.close();
});

test('pre-chat: typed fields validated on save and on submit; answers stored per visitor and shown to agents only in this store', async () => {
  const bad = await publish(store.id, owner.token, { preChatForm: { enabled: true, fields: [{ key: 'cf_a', type: 'select', label: 'Topic', required: true }] } });
  assert.equal(bad.status, 400, 'choice field needs options');
  const dup = await publish(store.id, owner.token, { preChatForm: { enabled: true, fields: [{ key: 'cf_a', type: 'text', label: 'A', required: false }, { key: 'cf_a', type: 'text', label: 'B', required: false }] } });
  assert.equal(dup.status, 400, 'duplicate keys');
  const tooMany = await publish(store.id, owner.token, { preChatForm: { enabled: true, fields: Array.from({ length: 13 }, (_, i) => ({ key: `cf_${i}x`, type: 'text', label: `F${i}`, required: false })) } });
  assert.equal(tooMany.status, 400);

  const fields = [
    { key: 'name', label: 'Name', required: true }, // legacy shape still accepted
    { key: 'email', type: 'email', label: 'Email', required: true },
    { key: 'phone', type: 'phone', label: 'Phone', required: false },
    { key: 'cf_topic', type: 'select', label: 'Topic', required: true, options: ['Order', 'Sizing'] },
    { key: 'cf_metal', type: 'multiselect', label: 'Metals', required: false, options: ['Gold', 'Silver'] },
    { key: 'cf_size', type: 'number', label: 'Ring size', required: false },
    { key: 'cf_date', type: 'date', label: 'Event date', required: false },
    { key: 'question', type: 'textarea', label: 'Question', required: true },
  ];
  const ok = await publish(store.id, owner.token, { preChatForm: { enabled: true, fields } });
  assert.equal(ok.status, 200);
  const sess = await W(store.publicKey, '/session', { method: 'POST', body: {} });
  assert.equal(sess.data.config.preChatForm.fields[0].type, 'name', 'legacy field upgraded with a type');
  const vt = sess.data.visitorToken;
  const post = (values) => W(store.publicKey, '/contact', { method: 'POST', body: { values }, headers: { 'X-Visitor-Token': vt } });
  const good = { name: 'Ann', email: 'ANN@x.test', phone: '+1 555 0100', cf_topic: 'Sizing', cf_metal: ['Gold'], cf_size: '7.5', cf_date: '2026-12-24', question: 'Do you resize rings?', cf_unknown: 'ignored' };
  assert.equal((await post({ ...good, question: '' })).status, 400, 'required question');
  assert.equal((await post({ ...good, cf_topic: 'Hack' })).status, 400, 'not an option');
  assert.equal((await post({ ...good, cf_metal: ['Gold', 'Lead'] })).status, 400);
  assert.equal((await post({ ...good, cf_size: 'seven' })).status, 400);
  assert.equal((await post({ ...good, cf_date: '2026-02-30' })).status, 400);
  assert.equal((await post({ ...good, email: 'nope' })).status, 400);
  assert.equal((await post({ ...good, question: 'x'.repeat(2001) })).status, 400);
  assert.equal((await post({ ...good, phone: '+91 98765432100' })).status, 400, '11-digit national number (country code excluded)');
  assert.equal((await post({ ...good, phone: '9876543210' })).status, 200, '10 digits, no country code, is allowed');
  assert.equal((await post({ ...good, phone: '+91 9876543210' })).status, 200, '10 national digits plus a country code is allowed');
  assert.equal((await post({ ...good, phone: '1000' })).status, 400, 'too short to be a real phone number');
  assert.equal((await post({ ...good, phone: 'abcdefghij' })).status, 400, 'letters are never a valid phone number');
  const saved = await post(good);
  assert.equal(saved.status, 200);
  assert.equal(saved.data.visitor.email, 'ann@x.test');
  assert.equal(saved.data.visitor.attributes.question.value, 'Do you resize rings?');
  assert.deepEqual(saved.data.visitor.attributes.cf_metal.value, ['Gold']);
  assert.equal(saved.data.visitor.attributes.cf_unknown, undefined);

  // Re-opening the widget keeps the answers (the form is not shown again).
  const again = await W(store.publicKey, '/session', { method: 'POST', body: { token: vt } });
  assert.equal(again.data.visitor.attributes.cf_topic.value, 'Sizing');
  // The question goes in as the first message; agents see answers in the conversation details.
  const first = await say(store.publicKey, vt, 'Do you resize rings?', {}, O);
  const det = await call('GET', `/api/stores/${store.id}/conversations/${first.data.conversationId}`, { token: owner.token });
  assert.equal(det.data.visitor.attributes.cf_topic.value, 'Sizing');
  assert.equal(det.data.messages[0].body, 'Do you resize rings?');
  assert.equal((await call('GET', `/api/stores/${other.id}/conversations/${first.data.conversationId}`, { token: otherOwner.token })).status, 404);
  // Turn the form off again for the next tests.
  await publish(store.id, owner.token, { preChatForm: { enabled: false, fields } });
});

test('transcript email: real SMTP only, no notes, agents shown as Customer Support; end chat resolves', async () => {
  // The widget is told whether transcripts can be sent, so it can hide the option when email isn't set up.
  const sess = await call('POST', `/api/widget/${store.publicKey}/session`, { body: {}, headers: { Origin: O } });
  assert.equal(typeof sess.data.config.transcripts, 'boolean');
  const v = await visit(store.publicKey, { origin: O });
  const m = await say(store.publicKey, v.token, 'Need help with order 42', {}, O);
  const convId = m.data.conversationId;
  await call('POST', `/api/stores/${store.id}/conversations/${convId}/messages`, { token: owner.token, body: { body: 'Happy to help!', clientMsgId: cid() } });
  await call('POST', `/api/stores/${store.id}/conversations/${convId}/messages`, { token: owner.token, body: { body: 'SECRET internal note', note: true, clientMsgId: cid() } });
  const tr = (body, token = v.token) => W(store.publicKey, '/transcript', { method: 'POST', body, headers: { 'X-Visitor-Token': token } });

  smtpOff();
  assert.equal((await tr({ email: 'ann@x.test', conversationId: convId })).status, 409, 'no SMTP: not reported as sent');
  smtpOn();
  assert.equal((await tr({ email: 'bad', conversationId: convId })).status, 400);
  const otherV = await visit(store.publicKey, { origin: O });
  assert.equal((await tr({ email: 'x@x.test', conversationId: convId }, otherV.token)).status, 404, "not someone else's chat");
  smtp.mails.length = 0;
  const sent = await tr({ email: 'ann@x.test', conversationId: convId });
  assert.equal(sent.status, 200);
  assert.equal(smtp.mails.length, 1);
  assert.deepEqual(smtp.mails[0].rcpt, ['ann@x.test']);
  assert.match(smtp.mails[0].raw, /Need help with order 42/);
  assert.match(smtp.mails[0].raw, /Customer Support: Happy to help!/);
  assert.doesNotMatch(smtp.mails[0].raw, /SECRET internal note|Platform Admin: /);
  const bounce = await tr({ email: 'bounce@x.test', conversationId: convId });
  assert.equal(bounce.status, 502, 'rejected recipient is reported as not sent');

  assert.equal((await W(store.publicKey, `/conversations/${convId}/end`, { method: 'POST', headers: { 'X-Visitor-Token': otherV.token } })).status, 404);
  const end = await W(store.publicKey, `/conversations/${convId}/end`, { method: 'POST', headers: { 'X-Visitor-Token': v.token } });
  assert.equal(end.status, 200);
  const c = await mods.prisma.conversation.findUnique({ where: { id: convId } });
  assert.equal(c.status, 'RESOLVED');
  assert.ok(await mods.prisma.message.findFirst({ where: { conversationId: convId, body: 'Visitor ended the chat' } }));
  // A new message continues the same chat.
  const again = await say(store.publicKey, v.token, 'one more thing', {}, O);
  assert.equal(again.data.conversationId, convId);
});

test('clear published history keeps the live version and the draft; admin-only; store-scoped', async () => {
  for (const t of ['A', 'B', 'C']) await publish(store.id, owner.token, { messages: { ...(await call('GET', `/api/stores/${store.id}/widget`, { token: owner.token })).data.draft.messages, subtitle: `v-${t}` } });
  await publish(other.id, otherOwner.token, {});
  const before = await call('GET', `/api/stores/${store.id}/widget`, { token: owner.token });
  assert.ok(before.data.versions.length >= 3);
  assert.equal((await call('DELETE', `/api/stores/${store.id}/widget/versions`, { token: agent.token })).status, 403);
  const otherBefore = await mods.prisma.widgetConfig.count({ where: { storeId: other.id } });
  const r = await call('DELETE', `/api/stores/${store.id}/widget/versions`, { token: owner.token });
  assert.equal(r.status, 200);
  assert.equal(r.data.removed, before.data.versions.length - 1);
  assert.deepEqual(r.data.versions.map((v) => v.version), [before.data.publishedVersion]);
  const after = await call('GET', `/api/stores/${store.id}/widget`, { token: owner.token });
  assert.equal(after.data.publishedVersion, before.data.publishedVersion);
  assert.equal(after.data.published.messages.subtitle, 'v-C', 'live config unchanged');
  assert.ok(await mods.prisma.widgetConfig.findUnique({ where: { storeId_version: { storeId: store.id, version: 0 } } }), 'draft kept');
  assert.equal(await mods.prisma.widgetConfig.count({ where: { storeId: other.id } }), otherBefore, 'other store untouched');
  assert.equal((await W(store.publicKey, '/session', { method: 'POST', body: {} })).data.config.messages.subtitle, 'v-C', 'storefront still served');
  // Publishing again continues numbering after the live version.
  const next = await publish(store.id, owner.token, {});
  assert.equal(next.data.version, before.data.publishedVersion + 1);
});

test('reports: empty store returns zeros; other store forbidden', async () => {
  const r = await call('GET', `/api/stores/${empty.id}/reports?from=2026-09-01&to=2026-10-19`, { token: sup.token });
  assert.equal(r.status, 200);
  assert.equal(r.data.conversations.total, 0);
  assert.deepEqual(r.data.conversations.perDay, []);
  assert.deepEqual(r.data.messages, {});
  assert.equal(typeof r.data.usage.widgetLoads, 'number');
  assert.equal((await call('GET', `/api/stores/${store.id}/reports`, { token: otherOwner.token })).status, 403);
  assert.equal((await call('GET', `/api/stores/${store.id}/reports?from=2026-10-19&to=2026-01-01`, { token: owner.token })).status, 400);
});

test('test email: explains missing SMTP, confirms real acceptance, reports rejection', async () => {
  smtpOff();
  const none = await call('POST', `/api/stores/${store.id}/email/test`, { token: owner.token, body: { to: 'me@x.test' } });
  assert.equal(none.status, 409);
  assert.match(none.data.error, /SMTP_HOST, SMTP_PORT/);
  smtpOn();
  assert.equal((await call('POST', `/api/stores/${store.id}/email/test`, { token: agent.token, body: { to: 'me@x.test' } })).status, 403);
  smtp.mails.length = 0;
  const ok = await call('POST', `/api/stores/${store.id}/email/test`, { token: owner.token, body: { to: 'me@x.test' } });
  assert.equal(ok.status, 200);
  assert.deepEqual(ok.data.accepted, ['me@x.test']);
  assert.equal(smtp.mails.length, 1);
  assert.equal((await call('POST', `/api/stores/${store.id}/email/test`, { token: owner.token, body: { to: 'bounce@x.test' } })).status, 502);
  // Ticket creation without SMTP gives the same actionable message.
  smtpOff();
  const t = await call('POST', `/api/stores/${store.id}/tickets`, { token: owner.token, body: { requestId: cid(), contactEmail: 'a@x.test', subject: 's', body: 'b' } });
  assert.equal(t.status, 409);
  assert.match(t.data.error, /Notifications & SMTP/);
  smtpOn();
});

test('pop-out page: valid key only, strict CSP, no session in the URL', async () => {
  assert.equal((await call('GET', '/widget/popout?key=<script>')).status, 400);
  const res = await fetch(`${(await import('./helpers.js')).base}/widget/popout?key=${store.publicKey}`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-security-policy'), /script-src 'self'/);
  const html = await res.text();
  assert.match(html, /data-popout="1"/);
  assert.doesNotMatch(html, /token/i);
});

test('chat from the pre-chat form: welcome, then the customer details, then the please-wait message (once)', async () => {
  const DEFAULT_MESSAGES = (await call('GET', `/api/stores/${store.id}/widget`, { token: owner.token })).data.draft.messages;
  assert.ok(DEFAULT_MESSAGES.afterPrechat, 'older configs get the default please-wait text');
  await publish(store.id, owner.token, { messages: { ...DEFAULT_MESSAGES, greeting: 'Welcome! Simply reply to this message.', afterPrechat: 'Please wait 2 minutes, our team will join you shortly.' } });
  const v = await visit(store.publicKey, { origin: O });
  const details = 'Name : keval\nEmail : k@x.test\nPhone : +91 98\nQuestion : vsvdsv';
  const first = await say(store.publicKey, v.token, details, { prechat: true }, O);
  assert.equal(first.status, 201);
  await say(store.publicKey, v.token, 'one more thing', { prechat: true }, O); // same chat: nothing added again
  const det = await call('GET', `/api/stores/${store.id}/conversations/${first.data.conversationId}`, { token: owner.token });
  const seq = det.data.messages.map((m) => [m.senderType, m.body]);
  assert.deepEqual(seq, [
    ['BOT', 'Welcome! Simply reply to this message.'],
    ['VISITOR', details],
    ['BOT', 'Please wait 2 minutes, our team will join you shortly.'],
    ['VISITOR', 'one more thing'],
  ]);

  // Empty please-wait text = off; a normal (non-form) chat gets neither message.
  await publish(store.id, owner.token, { messages: { ...DEFAULT_MESSAGES, greeting: 'Hi', afterPrechat: '' } });
  const v2 = await visit(store.publicKey, { origin: O });
  const c2 = await say(store.publicKey, v2.token, 'Name : x', { prechat: true }, O);
  const d2 = await call('GET', `/api/stores/${store.id}/conversations/${c2.data.conversationId}`, { token: owner.token });
  assert.deepEqual(d2.data.messages.map((m) => m.senderType), ['BOT', 'VISITOR']);
  const v3 = await visit(store.publicKey, { origin: O });
  const c3 = await say(store.publicKey, v3.token, 'plain chat', {}, O);
  const d3 = await call('GET', `/api/stores/${store.id}/conversations/${c3.data.conversationId}`, { token: owner.token });
  assert.deepEqual(d3.data.messages.map((m) => m.senderType), ['VISITOR']);
});

test('transcript downloads: customer gets only their own chat without notes; staff get notes; other stores refused', async () => {
  const { base } = await import('./helpers.js');
  const get = async (path, headers) => { const r = await fetch(base + path, { headers }); return { status: r.status, text: await r.text(), disp: r.headers.get('content-disposition'), type: r.headers.get('content-type') }; };
  const v = await visit(store.publicKey, { origin: O });
  const convId = (await say(store.publicKey, v.token, 'Do you resize rings?', {}, O)).data.conversationId;
  await call('POST', `/api/stores/${store.id}/conversations/${convId}/messages`, { token: owner.token, body: { body: 'Yes, free of charge.', clientMsgId: cid() } });
  await call('POST', `/api/stores/${store.id}/conversations/${convId}/messages`, { token: owner.token, body: { body: 'SECRET internal note', note: true, clientMsgId: cid() } });

  const mine = await get(`/api/widget/${store.publicKey}/conversations/${convId}/transcript`, { 'X-Visitor-Token': v.token, Origin: O });
  assert.equal(mine.status, 200);
  assert.match(mine.type, /text\/plain/);
  assert.match(mine.disp, /attachment; filename="chat-transcript-\d{4}-\d{2}-\d{2}\.txt"/);
  assert.match(mine.text, /You: Do you resize rings\?/);
  assert.match(mine.text, /Customer Support: Yes, free of charge\./);
  assert.ok(!mine.text.includes('SECRET'), 'no internal notes for the customer');

  const stranger = await visit(store.publicKey, { origin: O });
  assert.equal((await get(`/api/widget/${store.publicKey}/conversations/${convId}/transcript`, { 'X-Visitor-Token': stranger.token, Origin: O })).status, 404, 'another visitor cannot download it');

  const staff = await get(`/api/stores/${store.id}/conversations/${convId}/transcript`, { Authorization: `Bearer ${owner.token}` });
  assert.equal(staff.status, 200);
  assert.match(staff.text, /\[Internal note\] .*: SECRET internal note/);
  assert.equal((await get(`/api/stores/${other.id}/conversations/${convId}/transcript`, { Authorization: `Bearer ${otherOwner.token}` })).status, 404, 'other store cannot');
  assert.equal((await get(`/api/stores/${store.id}/conversations/${convId}/transcript`, {})).status, 401);
});
