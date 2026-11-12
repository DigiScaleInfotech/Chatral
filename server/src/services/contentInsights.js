import { clock } from '../config.js';

// Customer Questions & Content Insights, computed from real visitor messages only.
//
// This is a word-frequency analysis, not an AI summary: no language model is called, nothing is
// invented. The project has no existing AI-provider integration (checked before writing this), and
// adding a paid third-party AI dependency for this is a decision for the project owner, not something
// to introduce silently — see docs note in the implementation report. Every finding here carries its
// own sample size, date range and real example quotes so it can be checked directly against the data.
const STOPWORDS = new Set('a an the is are was were be been being i you he she it we they me him her us them my your his its our their this that these those and or but if then so to of for in on at with from by about as into like through after over between out up down off than too very can will just do does did have has had not no yes hi hello hey thanks thank please ok okay'.split(' '));
const QUESTION_WORDS = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'can', 'could', 'do', 'does', 'did', 'is', 'are', 'will', 'should', 'would'];

export const isQuestion = (text) => {
  const t = (text || '').trim().toLowerCase();
  if (!t) return false;
  return t.endsWith('?') || QUESTION_WORDS.some((w) => t.startsWith(`${w} `));
};

const normalize = (s) => (s || '').toLowerCase().replace(/[^a-z0-9'\s]/g, ' ').replace(/\s+/g, ' ').trim();

/** 2–4 word phrases from a message, skipping pure-stopword phrases, for frequency counting. */
function phrases(text) {
  const words = normalize(text).split(' ').filter(Boolean);
  const out = [];
  for (let n = 2; n <= 4; n++) {
    for (let i = 0; i + n <= words.length; i++) {
      const slice = words.slice(i, i + n);
      if (slice.every((w) => STOPWORDS.has(w) || w.length <= 2)) continue;
      out.push(slice.join(' '));
    }
  }
  return out;
}

const MIN_SAMPLE_FOR_CONFIDENCE = 20;

/**
 * `messages`: real VISITOR-sent Message rows ({ id, body, conversationId, createdAt }) already
 * filtered to one store and a date range by the caller. Returns clustered question topics, each with
 * its count, a few real example quotes, and the exact sample this was computed from — never a count
 * without the evidence behind it.
 */
export function analyzeMessages(messages, { from, to }) {
  const texts = messages.map((m) => m.body).filter((b) => b && b.trim());
  const sampleSize = texts.length;
  const questions = messages.filter((m) => isQuestion(m.body));

  const phraseCounts = new Map(); // phrase -> { count, examples: Set<messageId>, exampleText: [] }
  for (const m of questions) {
    for (const p of new Set(phrases(m.body))) {
      const e = phraseCounts.get(p) || { count: 0, examples: [] };
      e.count++;
      if (e.examples.length < 3) e.examples.push(m.body.slice(0, 200));
      phraseCounts.set(p, e);
    }
  }
  const topics = [...phraseCounts.entries()]
    .filter(([, v]) => v.count >= 2) // a single mention isn't a "topic" yet
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 25)
    .map(([phrase, v]) => ({ phrase, mentions: v.count, examples: v.examples }));

  return {
    range: { from, to },
    sampleSize, // total visitor messages this analysis looked at
    questionCount: questions.length,
    topics,
    confidence: sampleSize < MIN_SAMPLE_FOR_CONFIDENCE
      ? `Low — only ${sampleSize} visitor message(s) in this range. Topics below are based on very little data and may not be representative.`
      : `Based on ${sampleSize} visitor messages (${questions.length} of them questions) from ${from.toISOString().slice(0, 10)} to ${to.toISOString().slice(0, 10)}.`,
  };
}

/** A real conversation where the visitor asked something and no agent ever replied — not inferred,
 *  just: has a visitor message, has zero AGENT messages, is not still freshly waiting (<5 min old is
 *  excluded so an agent who hasn't had a chance yet isn't reported as "unanswered"). */
export function unansweredFrom(conversations) {
  const FIVE_MIN = 5 * 60_000;
  const now = clock.now().getTime();
  return conversations
    .filter((c) => c.messages.some((m) => m.senderType === 'VISITOR') && !c.messages.some((m) => m.senderType === 'AGENT') && now - new Date(c.createdAt).getTime() > FIVE_MIN)
    .map((c) => ({ conversationId: c.id, createdAt: c.createdAt, firstMessage: c.messages.find((m) => m.senderType === 'VISITOR')?.body?.slice(0, 200) || null }));
}

/** Content ideas generated only from the topics actually found above — each one names the exact
 *  observation (phrase + mention count) it came from, so it's traceable, not invented. */
export function suggestContent(topics, { from, to }) {
  const rangeText = `${from.toISOString().slice(0, 10)} – ${to.toISOString().slice(0, 10)}`;
  return topics.slice(0, 10).map((t) => ({
    idea: `FAQ or blog post answering: "${t.phrase}"`,
    format: t.mentions >= 8 ? 'FAQ page + buying guide' : 'FAQ entry',
    observation: `Asked in ${t.mentions} separate visitor message(s) between ${rangeText}.`,
    sampleQuotes: t.examples,
    hypothesis: t.mentions < 5, // label as a hypothesis, not a confirmed trend, below this count
  }));
}
