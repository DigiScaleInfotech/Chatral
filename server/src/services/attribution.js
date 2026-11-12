// Traffic-source attribution from real UTM parameters and the browser's own Referer, computed
// server-side only (never trusts a client-supplied "source" label). No invented search queries,
// no guessing at individual keywords — only what the UTM/referrer actually says.
//
// Classification order: UTM (explicit, highest confidence) → known-domain referrer → Direct → Unknown.
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const clip = (s, n) => (typeof s === 'string' ? s.trim().slice(0, n) : null);

/** { source, medium, campaign, content, term } from a page URL's own query string, or all-null. */
export function parseUtm(rawUrl) {
  const out = { source: null, medium: null, campaign: null, content: null, term: null };
  if (!rawUrl || typeof rawUrl !== 'string') return out;
  let u;
  try { u = new URL(rawUrl); } catch { return out; }
  const map = { utm_source: 'source', utm_medium: 'medium', utm_campaign: 'campaign', utm_content: 'content', utm_term: 'term' };
  for (const key of UTM_KEYS) {
    const v = clip(u.searchParams.get(key), 120);
    if (v) out[map[key]] = v;
  }
  return out;
}

const SEARCH_ENGINES = ['google.', 'bing.', 'yahoo.', 'duckduckgo.', 'baidu.', 'yandex.', 'ecosia.'];
const SOCIAL_SITES = ['instagram.', 'facebook.', 'fb.', 'pinterest.', 'youtube.', 'youtu.be', 'tiktok.', 'linkedin.', 'twitter.', 'x.com', 't.co', 'snapchat.', 'reddit.', 'threads.'];
const PAID_MEDIUMS = ['cpc', 'ppc', 'paid', 'paid-search', 'paidsearch', 'sem'];
const PAID_SOCIAL_MEDIUMS = ['paid-social', 'paidsocial', 'social-paid'];
const SOCIAL_MEDIUMS = ['social', 'social-organic', 'organic-social'];
const EMAIL_MEDIUMS = ['email', 'newsletter'];

const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return null; } };
const hasAny = (host, list) => !!host && list.some((d) => host.includes(d));

/**
 * URL privacy: strip sensitive parameters (session, token, auth, passwords, personal data, etc.)
 * while preserving valid UTM attribution fields separately.
 * Also removes username/password from URL authority, and hashes or strips query parameters.
 */
const SENSITIVE_PARAM_NAMES = new Set([
  'token', 'access_token', 'id_token', 'refresh_token', 'auth', 'auth_token', 'key', 'api_key', 'apikey',
  'secret', 'password', 'pwd', 'pass', 'session', 'session_id', 'sessid', 'sid', 'phpsessid', 'jsessionid',
  'email', 'user', 'username', 'code', 'verification_code', 'pin', 'ssn', 'credit_card', 'card', 'cvv'
]);

export function sanitizeUrl(rawUrl, { keepUtm = false } = {}) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  try {
    const u = new URL(rawUrl);
    u.username = '';
    u.password = '';
    const keysToDelete = [];
    for (const [key] of u.searchParams.entries()) {
      const lower = key.toLowerCase();
      if (SENSITIVE_PARAM_NAMES.has(lower) || lower.includes('token') || lower.includes('secret') || lower.includes('password')) {
        keysToDelete.push(key);
      } else if (!keepUtm && UTM_KEYS.includes(lower)) {
        keysToDelete.push(key);
      }
    }
    for (const k of keysToDelete) {
      u.searchParams.delete(k);
    }
    return clip(u.toString(), 2000);
  } catch {
    return clip((rawUrl || '').split('?')[0], 2000);
  }
}

export function sanitizeReferrer(rawReferrer) {
  if (!rawReferrer || typeof rawReferrer !== 'string') return null;
  try {
    const u = new URL(rawReferrer);
    u.username = '';
    u.password = '';
    // Strip sensitive parameters from referrer as well
    const keysToDelete = [];
    for (const [key] of u.searchParams.entries()) {
      const lower = key.toLowerCase();
      if (SENSITIVE_PARAM_NAMES.has(lower) || lower.includes('token') || lower.includes('secret') || lower.includes('password')) {
        keysToDelete.push(key);
      }
    }
    for (const k of keysToDelete) {
      u.searchParams.delete(k);
    }
    return clip(u.toString(), 2000);
  } catch {
    return clip((rawReferrer || '').split('?')[0], 2000);
  }
}

/**
 * Traffic source classification:
 * - If UTM source is present: Campaign / Paid social / Paid search / Email / Organic social.
 * - If referrer is missing/empty:
 *   - When explicitly known to have no referrer / direct user entry (e.g., direct navigation), returns 'Direct'.
 *   - When source cannot be established (or unknown), returns 'Unknown'.
 * - If referrer is same-site (same host as ownOrigin or currentPage): internal navigation ('Direct' or internal).
 * - If referrer is search engine: 'Organic search'.
 * - If referrer is social media: 'Organic social'.
 * - Any other recognized external hostname: 'Referral: <hostname>'.
 */
export function classifySource({ utmSource, utmMedium, referrer, ownOrigin, pageUrl, direct = false }) {
  if (utmSource) {
    const medium = (utmMedium || '').toLowerCase();
    if (PAID_SOCIAL_MEDIUMS.includes(medium)) return `Paid social: ${utmSource}`;
    if (PAID_MEDIUMS.includes(medium)) return `Paid search: ${utmSource}`;
    if (EMAIL_MEDIUMS.includes(medium)) return `Email: ${utmSource}`;
    if (SOCIAL_MEDIUMS.includes(medium)) return `Organic social: ${utmSource}`;
    return `Campaign: ${utmSource}`;
  }
  if (!referrer || typeof referrer !== 'string' || !referrer.trim()) {
    return direct ? 'Direct' : 'Unknown';
  }
  const host = hostOf(referrer);
  if (!host) return 'Unknown';
  if (ownOrigin && host === hostOf(ownOrigin)) return 'Direct';
  if (pageUrl && host === hostOf(pageUrl)) return 'Direct';
  if (hasAny(host, SEARCH_ENGINES)) return 'Organic search';
  if (hasAny(host, SOCIAL_SITES)) return 'Organic social';
  return `Referral: ${host}`;
}

/** Groups a classified label into one of the broad buckets the Reports chart uses. */
export function sourceGroup(label) {
  if (!label || label === 'Unknown') return 'Unknown';
  if (label === 'Direct') return 'Direct';
  if (label.startsWith('Organic search')) return 'Organic search';
  if (label.startsWith('Paid search')) return 'Paid search';
  if (label.startsWith('Organic social')) return 'Organic social';
  if (label.startsWith('Paid social')) return 'Paid social';
  if (label.startsWith('Email')) return 'Email';
  if (label.startsWith('Referral')) return 'Referral';
  if (label.startsWith('Campaign')) return 'Campaign (other)';
  return 'Unknown';
}
