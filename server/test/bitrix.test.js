import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { start, stop, makeUser, makeStore, visit, say, mods } from './helpers.js';

const ORIGIN = 'https://bitrix-shop.test';
let fake; let received = []; let reply = () => ({ status: 200, body: { result: 1 } });

before(async () => {
  await start();
  fake = http.createServer((req, res) => {
    let b = '';
    req.on('data', (c) => { b += c; });
    req.on('end', () => {
      received.push({ url: req.url, body: JSON.parse(b || '{}') });
      const r = reply();
      res.writeHead(r.status, { 'Content-Type': 'application/json' }).end(JSON.stringify(r.body));
    });
  });
  await new Promise((r) => fake.listen(0, '127.0.0.1', r));
});
after(async () => {
  delete process.env.BITRIX24_WEBHOOK_URL; delete process.env.BITRIX24_DIALOG_ID;
  fake.close();
  await stop();
});

const setup = async (name) => {
  const sup = await makeUser(`${name}@bitrix.test`, { role: 'SUPER_ADMIN' });
  const store = await makeStore(sup.token, `Shop ${name}`, ['bitrix-shop.test']);
  const v = await visit(store.publicKey, { origin: ORIGIN, url: 'https://bitrix-shop.test/rings' });
  await mods.prisma.visitor.update({ where: { id: v.data.visitor.id }, data: { name: 'Priya', email: 'priya@x.test', attributes: { p: { label: 'Phone', type: 'phone', value: '+91 98' } } } });
  return { store, v };
};

test('a new chat sends one message to the Bitrix24 user (base URL taken from the given method URL)', async () => {
  process.env.BITRIX24_WEBHOOK_URL = `http://127.0.0.1:${fake.address().port}/rest/107/s3cret/im.chat.add.json`;
  process.env.BITRIX24_DIALOG_ID = '129';
  received = [];
  const { store, v } = await setup('one');
  const r = await say(store.publicKey, v.token, 'Do you resize rings?', {}, ORIGIN);
  assert.equal(r.status, 201);
  await say(store.publicKey, v.token, 'second message, same chat', {}, ORIGIN);
  await mods.jobs.drain();
  assert.equal(received.length, 1, 'only the first message of a chat alerts');
  assert.equal(received[0].url, '/rest/107/s3cret/im.message.add.json');
  assert.equal(received[0].body.DIALOG_ID, '129');
  const msg = received[0].body.MESSAGE;
  for (const part of ['New chat on Shop one', 'Name: Priya', 'Email: priya@x.test', 'Phone: +91 98', 'Message: Do you resize rings?', 'Page: https://bitrix-shop.test/rings', `c=${r.data.conversationId}`]) {
    assert.ok(msg.includes(part), `message contains "${part}"`);
  }
});

test('Bitrix24 errors are retried; bad credentials stop; nothing is sent when not configured', async () => {
  process.env.BITRIX24_WEBHOOK_URL = `http://127.0.0.1:${fake.address().port}/rest/107/s3cret/`;
  process.env.BITRIX24_DIALOG_ID = '129';
  received = [];
  reply = () => ({ status: 401, body: { error: 'NO_AUTH_FOUND', error_description: 'Wrong authorization data' } });
  const { store, v } = await setup('two');
  const r = await say(store.publicKey, v.token, 'hello', {}, ORIGIN);
  await mods.jobs.drain();
  const job = await mods.prisma.job.findFirst({ where: { type: 'bitrix_notify', payload: { path: ['conversationId'], equals: r.data.conversationId } } });
  assert.equal(job.status, 'FAILED');
  assert.equal(job.attempts, 1, 'permanent error: not retried');
  assert.match(job.lastError, /Wrong authorization data/);
  reply = () => ({ status: 200, body: { result: 1 } });

  delete process.env.BITRIX24_WEBHOOK_URL;
  received = [];
  const s3 = await setup('three');
  await say(s3.store.publicKey, s3.v.token, 'hello', {}, ORIGIN);
  await mods.jobs.drain();
  assert.equal(received.length, 0);
  assert.equal(await mods.prisma.job.count({ where: { type: 'bitrix_notify', storeId: s3.store.id } }), 0);
});
