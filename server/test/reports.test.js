import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start, stop, call, makeUser, makeStore, mods } from './helpers.js';

before(start);
after(stop);

test('reports bucket days in the store timezone and stay store-scoped', async () => {
  const sup = await makeUser('super@rep.test', { role: 'SUPER_ADMIN' });
  const a = await makeStore(sup.token, 'Kolkata', []);
  const b = await makeStore(sup.token, 'Other', []);
  await call('PATCH', `/api/stores/${a.id}`, { token: sup.token, body: { timezone: 'Asia/Kolkata' } });
  const v = await mods.prisma.visitor.create({ data: { storeId: a.id, tokenHash: 'h1' } });
  // 20:00 UTC on Oct 16 is 01:30 on Oct 17 in Kolkata.
  const at = new Date('2026-10-16T20:00:00Z');
  await mods.prisma.conversation.create({ data: { storeId: a.id, visitorId: v.id, createdAt: at, lastActivityAt: at, expiresAt: new Date(at.getTime() + 30 * 86_400_000) } });
  const vb = await mods.prisma.visitor.create({ data: { storeId: b.id, tokenHash: 'h2' } });
  await mods.prisma.conversation.create({ data: { storeId: b.id, visitorId: vb.id, createdAt: at, lastActivityAt: at, expiresAt: new Date(at.getTime() + 30 * 86_400_000) } });

  // Range boundary: 2026-10-14 20:00 UTC is already Oct 15 (01:30) in Kolkata, so a range starting Oct 15 includes it.
  const early = new Date('2026-10-14T20:00:00Z');
  await mods.prisma.conversation.create({ data: { storeId: a.id, visitorId: v.id, createdAt: early, lastActivityAt: early, expiresAt: new Date(early.getTime() + 30 * 86_400_000) } });
  const r = await call('GET', `/api/stores/${a.id}/reports?from=2026-10-15&to=2026-10-18`, { token: sup.token });
  assert.equal(r.status, 200);
  assert.equal(r.data.conversations.total, 2, 'boundary chat included, other store not counted');
  assert.deepEqual(r.data.conversations.perDay, [{ day: '2026-10-15', conversations: 1 }, { day: '2026-10-17', conversations: 1 }]);
});

test('audience: countries/cities of customers who chatted and pre-chat choice answers, store-scoped', async () => {
  const sup = await makeUser('super2@rep.test', { role: 'SUPER_ADMIN' });
  const a = await makeStore(sup.token, 'Geo', []);
  const b = await makeStore(sup.token, 'GeoOther', []);
  const at = new Date();
  const conv = (storeId, visitorId) => mods.prisma.conversation.create({ data: { storeId, visitorId, createdAt: at, lastActivityAt: at, expiresAt: new Date(at.getTime() + 30 * 86_400_000) } });
  const gender = (value) => ({ g: { label: 'Gender', type: 'select', value }, q: { label: 'Question', type: 'textarea', value: 'hi' } });
  for (const [i, d] of [['IN', 'Surat', 'Female'], ['IN', 'Surat', 'Male'], ['US', 'Austin', 'Female'], [null, null, null]].entries()) {
    const v = await mods.prisma.visitor.create({ data: { storeId: a.id, tokenHash: `g${i}`, country: d[0], city: d[1], attributes: d[2] ? gender(d[2]) : undefined } });
    await conv(a.id, v.id);
  }
  await mods.prisma.visitor.create({ data: { storeId: a.id, tokenHash: 'nochat', country: 'FR', city: 'Paris' } }); // browsed only
  const vb = await mods.prisma.visitor.create({ data: { storeId: b.id, tokenHash: 'gb', country: 'DE', city: 'Berlin' } });
  await conv(b.id, vb.id);

  const r = await call('GET', `/api/stores/${a.id}/reports`, { token: sup.token });
  assert.equal(r.status, 200);
  const au = r.data.audience;
  assert.equal(au.visitors, 4);
  assert.deepEqual(au.countries, [{ country: 'IN', count: 2 }, { country: 'US', count: 1 }, { country: 'Unknown', count: 1 }]);
  assert.deepEqual(au.cities, [{ city: 'Surat', country: 'IN', count: 2 }, { city: 'Austin', country: 'US', count: 1 }]);
  assert.deepEqual(au.answers, [{ question: 'Gender', values: [{ value: 'Female', count: 2 }, { value: 'Male', count: 1 }] }]);
});

test('locate() maps a public IP to a country and ignores private/invalid ones', async () => {
  const { locate } = await import('../src/services/visitors.js');
  assert.equal(locate('8.8.8.8').country, 'US');
  assert.equal(locate('::ffff:8.8.8.8').country, 'US');
  assert.deepEqual(locate('127.0.0.1'), {});
  assert.deepEqual(locate(undefined), {});
});
