// Derived visitor facts for trigger conditions (tawk.to-style "Software / Computer", "Search engine", "Hostname").
import dns from 'node:dns/promises';

export function browserOf(ua = '') {
  if (!ua) return '';
  if (/Edg(e|A|iOS)?\//.test(ua)) return 'Edge';
  if (/OPR\/|Opera/.test(ua)) return 'Opera';
  if (/SamsungBrowser/.test(ua)) return 'Samsung Internet';
  if (/Firefox|FxiOS/.test(ua)) return 'Firefox';
  if (/Chrome|CriOS/.test(ua)) return 'Chrome';
  if (/Safari/.test(ua)) return 'Safari';
  return 'Other';
}

export function platformOf(ua = '') {
  if (!ua) return '';
  if (/Android/.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac OS X|Macintosh/.test(ua)) return 'macOS';
  if (/CrOS/.test(ua)) return 'Chrome OS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Other';
}

const ENGINES = [
  [/(^|\.)google\./, 'Google', 'q'], [/(^|\.)bing\.com$/, 'Bing', 'q'], [/(^|\.)yahoo\./, 'Yahoo', 'p'],
  [/(^|\.)duckduckgo\.com$/, 'DuckDuckGo', 'q'], [/(^|\.)yandex\./, 'Yandex', 'text'], [/(^|\.)baidu\.com$/, 'Baidu', 'wd'],
  [/(^|\.)ecosia\.org$/, 'Ecosia', 'q'], [/(^|\.)search\.brave\.com$/, 'Brave', 'q'],
];

/** { engine, terms } from a referrer URL. Most engines no longer send terms, so terms are often empty. */
export function searchOf(referrer) {
  let u;
  try { u = new URL(referrer); } catch { return { engine: '', terms: '' }; }
  const host = u.hostname.toLowerCase();
  for (const [re, engine, param] of ENGINES) if (re.test(host)) return { engine, terms: u.searchParams.get(param) || '' };
  return { engine: '', terms: '' };
}

const hostCache = new Map(); // ip -> hostname ('' = none); small, in-memory
/** Reverse DNS for the visitor IP, cached; '' when there is none or it takes longer than 1.5 s. */
export async function hostnameOf(ip) {
  if (!ip) return '';
  if (hostCache.has(ip)) return hostCache.get(ip);
  let name = '';
  try {
    const names = await Promise.race([dns.reverse(ip.replace(/^::ffff:/, '')), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 1500))]);
    name = names?.[0] || '';
  } catch { name = ''; }
  if (hostCache.size > 5000) hostCache.clear();
  hostCache.set(ip, name);
  return name;
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
export const countryNameOf = (code) => { try { return code ? regionNames.of(code) || code : ''; } catch { return code || ''; } };
