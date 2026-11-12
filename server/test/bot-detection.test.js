import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyVisitorTraffic } from '../src/services/botDetection.js';

test('botDetection: empty / missing user agent classifies as UNKNOWN with reason', () => {
  const r1 = classifyVisitorTraffic({ userAgent: '' });
  assert.equal(r1.classification, 'UNKNOWN');
  assert.equal(r1.reason, 'Missing user agent header');

  const r2 = classifyVisitorTraffic({ userAgent: null });
  assert.equal(r2.classification, 'UNKNOWN');
});

test('botDetection: known search engines and crawlers classify as BOT', () => {
  const googlebot = classifyVisitorTraffic({ userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' });
  assert.equal(googlebot.classification, 'BOT');
  assert.ok(googlebot.botConfidence >= 0.99);

  const bingbot = classifyVisitorTraffic({ userAgent: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)' });
  assert.equal(bingbot.classification, 'BOT');

  const ahrefs = classifyVisitorTraffic({ userAgent: 'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)' });
  assert.equal(ahrefs.classification, 'BOT');

  const python = classifyVisitorTraffic({ userAgent: 'python-requests/2.31.0' });
  assert.equal(python.classification, 'BOT');

  const curl = classifyVisitorTraffic({ userAgent: 'curl/7.88.1' });
  assert.equal(curl.classification, 'BOT');
});

test('botDetection: headless browsers and automation tools classify as BOT', () => {
  const headless = classifyVisitorTraffic({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/119.0.0.0 Safari/537.36' });
  assert.equal(headless.classification, 'BOT');

  const puppeteer = classifyVisitorTraffic({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Puppeteer' });
  assert.equal(puppeteer.classification, 'BOT');

  const prefetch = classifyVisitorTraffic({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    headers: { 'x-purpose': 'preview' },
  });
  assert.equal(prefetch.classification, 'BOT');
});

test('botDetection: genuine desktop and mobile human browsers classify as HUMAN', () => {
  const chrome = classifyVisitorTraffic({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  assert.equal(chrome.classification, 'HUMAN');
  assert.ok(chrome.botConfidence < 0.1);

  const safari = classifyVisitorTraffic({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  });
  assert.equal(safari.classification, 'HUMAN');

  const firefox = classifyVisitorTraffic({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  });
  assert.equal(firefox.classification, 'HUMAN');
});

test('botDetection: arbitrary non-standard user-agents classify as UNKNOWN, never assumed human or bot without evidence', () => {
  const customApp = classifyVisitorTraffic({
    userAgent: 'MyInternalInventoryTool/1.0',
  });
  assert.equal(customApp.classification, 'UNKNOWN');
});
