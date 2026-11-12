import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseUtm, classifySource, sourceGroup, sanitizeUrl, sanitizeReferrer } from '../src/services/attribution.js';

test('parseUtm reads the five standard params and ignores everything else', () => {
  const u = parseUtm('https://shop.test/rings?utm_source=newsletter&utm_medium=email&utm_campaign=spring&utm_content=btn1&utm_term=rings&session=xyz&token=secret');
  assert.deepEqual(u, { source: 'newsletter', medium: 'email', campaign: 'spring', content: 'btn1', term: 'rings' });
});

test('parseUtm: no query string, no utm, bad URL — all null, never throws', () => {
  assert.deepEqual(parseUtm('https://shop.test/rings'), { source: null, medium: null, campaign: null, content: null, term: null });
  assert.deepEqual(parseUtm('not a url'), { source: null, medium: null, campaign: null, content: null, term: null });
  assert.deepEqual(parseUtm(undefined), { source: null, medium: null, campaign: null, content: null, term: null });
});

test('sanitizeUrl: removes credentials, sensitive query tokens, and preserves approved UTM parameters', () => {
  const urlWithSecrets = 'https://user:pass@shop.test/checkout?token=sec123&session_id=sess99&password=pwd&utm_source=spring_promo&utm_medium=email&utm_campaign=launch&product=ring';
  const sanitizedWithUtm = sanitizeUrl(urlWithSecrets, { keepUtm: true });
  assert.ok(!sanitizedWithUtm.includes('pass'));
  assert.ok(!sanitizedWithUtm.includes('user:'));
  assert.ok(!sanitizedWithUtm.includes('sec123'));
  assert.ok(!sanitizedWithUtm.includes('sess99'));
  assert.ok(!sanitizedWithUtm.includes('pwd'));
  assert.ok(sanitizedWithUtm.includes('product=ring'));
  assert.ok(sanitizedWithUtm.includes('utm_source=spring_promo'));

  const sanitizedClean = sanitizeUrl(urlWithSecrets, { keepUtm: false });
  assert.ok(!sanitizedClean.includes('utm_source'));
  assert.ok(sanitizedClean.includes('product=ring'));
});

test('sanitizeReferrer: strips credentials and sensitive query tokens from referrer', () => {
  const ref = 'https://auth:secret@external.com/path?token=abc12345&api_key=secretKey&q=search';
  const clean = sanitizeReferrer(ref);
  assert.ok(!clean.includes('secret'));
  assert.ok(!clean.includes('auth:'));
  assert.ok(!clean.includes('abc12345'));
  assert.ok(!clean.includes('secretKey'));
  assert.ok(clean.includes('q=search'));
});

test('classifySource: UTM wins over referrer', () => {
  assert.equal(classifySource({ utmSource: 'google', utmMedium: 'cpc', referrer: 'https://instagram.com/' }), 'Paid search: google');
  assert.equal(classifySource({ utmSource: 'instagram', utmMedium: 'paid-social' }), 'Paid social: instagram');
  assert.equal(classifySource({ utmSource: 'mailchimp', utmMedium: 'email' }), 'Email: mailchimp');
  assert.equal(classifySource({ utmSource: 'partner-x' }), 'Campaign: partner-x');
});

test('classifySource: known-domain referrer, no UTM', () => {
  assert.equal(classifySource({ referrer: 'https://www.google.com/search?q=rings' }), 'Organic search');
  assert.equal(classifySource({ referrer: 'https://www.instagram.com/p/xyz/' }), 'Organic social');
  assert.equal(classifySource({ referrer: 'https://some-blog.example/post' }), 'Referral: some-blog.example');
});

test('classifySource: missing referrer defaults to Unknown, unless direct=true; unparseable referrer = Unknown; same-site referrer = Direct', () => {
  assert.equal(classifySource({ referrer: null }), 'Unknown');
  assert.equal(classifySource({ referrer: '' }), 'Unknown');
  assert.equal(classifySource({ referrer: null, direct: true }), 'Direct');
  assert.equal(classifySource({ referrer: 'not a url' }), 'Unknown');
  assert.equal(classifySource({ referrer: 'https://shop.test/other-page', ownOrigin: 'https://shop.test' }), 'Direct');
  assert.equal(classifySource({ referrer: 'https://shop.test/other-page', pageUrl: 'https://shop.test/current-page' }), 'Direct');
});

test('classifySource never claims to know an individual search query', () => {
  const label = classifySource({ referrer: 'https://www.google.com/search?q=18k+gold+ring+size+7' });
  assert.ok(!label.includes('18k') && !label.includes('ring'), 'must not surface the query string content');
});

test('sourceGroup buckets every classifySource output', () => {
  assert.equal(sourceGroup('Direct'), 'Direct');
  assert.equal(sourceGroup('Unknown'), 'Unknown');
  assert.equal(sourceGroup('Organic search'), 'Organic search');
  assert.equal(sourceGroup('Paid search: google'), 'Paid search');
  assert.equal(sourceGroup('Organic social'), 'Organic social');
  assert.equal(sourceGroup('Paid social: instagram'), 'Paid social');
  assert.equal(sourceGroup('Email: mailchimp'), 'Email');
  assert.equal(sourceGroup('Referral: blog.example'), 'Referral');
  assert.equal(sourceGroup('Campaign: partner-x'), 'Campaign (other)');
});
