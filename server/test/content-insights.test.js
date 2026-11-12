import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isQuestion, analyzeMessages, unansweredFrom, suggestContent } from '../src/services/contentInsights.js';

test('isQuestion: real patterns, no false claims on statements', () => {
  assert.equal(isQuestion('Do you resize rings?'), true);
  assert.equal(isQuestion('How long does shipping take'), true); // no "?" but starts with a question word
  assert.equal(isQuestion('Thanks a lot!'), false);
  assert.equal(isQuestion(''), false);
  assert.equal(isQuestion(null), false);
});

test('analyzeMessages: insufficient data is labelled, not hidden or invented', () => {
  const from = new Date('2026-10-01'); const to = new Date('2026-10-08');
  const r = analyzeMessages([{ id: '1', body: 'Do you resize rings?' }], { from, to });
  assert.equal(r.sampleSize, 1);
  assert.match(r.confidence, /Low/);
  assert.equal(r.topics.length, 0); // a single mention never becomes a "topic" (needs >=2)
});

test('analyzeMessages: a repeated real phrase becomes a topic with real examples', () => {
  const from = new Date('2026-10-01'); const to = new Date('2026-10-08');
  const msgs = [
    { id: '1', body: 'Do you resize rings for a wedding?' },
    { id: '2', body: 'Can you resize rings after purchase?' },
    { id: '3', body: 'I want to resize rings, is that possible?' },
    { id: '4', body: 'Thanks for the help!' }, // not a question, excluded from topic mining
  ];
  const r = analyzeMessages(msgs, { from, to });
  assert.equal(r.sampleSize, 4);
  assert.equal(r.questionCount, 3);
  const top = r.topics.find((t) => t.phrase.includes('resize rings'));
  assert.ok(top, 'expected a "resize rings" topic from 3 real mentions');
  assert.equal(top.mentions, 3);
  assert.ok(top.examples.length > 0 && top.examples.every((e) => msgs.some((m) => m.body.startsWith(e.slice(0, 20)))));
});

test('unansweredFrom: only a real visitor-only, no-agent-reply, non-fresh conversation counts', () => {
  const old = new Date(Date.now() - 10 * 60_000).toISOString();
  const fresh = new Date().toISOString();
  const rows = [
    { id: 'a', createdAt: old, messages: [{ senderType: 'VISITOR', body: 'Hello?' }] }, // unanswered
    { id: 'b', createdAt: old, messages: [{ senderType: 'VISITOR', body: 'Hi' }, { senderType: 'AGENT', body: 'Hi there' }] }, // answered
    { id: 'c', createdAt: fresh, messages: [{ senderType: 'VISITOR', body: 'Hello?' }] }, // too fresh to call "unanswered" yet
  ];
  const out = unansweredFrom(rows);
  assert.deepEqual(out.map((x) => x.conversationId), ['a']);
  assert.equal(out[0].firstMessage, 'Hello?');
});

test('suggestContent: every idea cites its own real observation; low-count ones are labelled hypotheses', () => {
  const from = new Date('2026-10-01'); const to = new Date('2026-10-08');
  const topics = [
    { phrase: 'resize rings', mentions: 9, examples: ['Do you resize rings?'] },
    { phrase: 'ship internationally', mentions: 2, examples: ['Do you ship internationally?'] },
  ];
  const ideas = suggestContent(topics, { from, to });
  assert.equal(ideas.length, 2);
  assert.match(ideas[0].observation, /9 separate visitor message/);
  assert.equal(ideas[0].hypothesis, false);
  assert.equal(ideas[1].hypothesis, true); // only 2 mentions — flagged as speculative, not a confirmed trend
});
