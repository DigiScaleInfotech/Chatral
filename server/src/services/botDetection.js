/**
 * Bot detection and traffic classification service.
 * Classifications:
 * - 'BOT': Confirmed automated crawler / scraper / headless browser / bot.
 * - 'HUMAN': Typical human browser signals.
 * - 'UNKNOWN': Ambiguous traffic without definitive bot or human signatures.
 */

// Well-known crawler and bot User-Agent substrings (case-insensitive)
const KNOWN_BOT_PATTERNS = [
  'googlebot', 'bingbot', 'yandexbot', 'duckduckbot', 'baiduspider',
  'slurp', 'sogou', 'exabot', 'facebot', 'facebookexternalhit',
  'ia_archiver', 'alexa', 'mj12bot', 'semrushbot', 'ahrefsbot',
  'dotbot', 'rogerbot', 'screaming frog', 'uptimerobot', 'pingdom',
  'curl', 'wget', 'python-requests', 'python-urllib', 'aiohttp',
  'httpx', 'node-fetch', 'axios', 'got/', 'undici',
  'go-http-client', 'java/', 'apache-httpclient', 'okhttp',
  'headlesschrome', 'phantomjs', 'selenium', 'puppeteer', 'playwright',
  'cypress', 'postmanruntime', 'insomnia', 'httpie', 'petalbot',
  'bytespider', 'amazonbot', 'applebot', 'seznambot', 'coccocbot',
  'bot', 'crawl', 'spider', 'scraper',
];

// Legitimate browsers usually include one of these
const COMMON_BROWSER_TOKENS = ['mozilla/', 'gecko/', 'webkit/', 'safari/', 'chrome/', 'edge/', 'firefox/'];

/**
 * Classifies traffic based on technical request evidence.
 *
 * @param {Object} params
 * @param {string} [params.userAgent] - Request User-Agent header
 * @param {string} [params.ip] - Client IP address
 * @param {Object} [params.headers] - Additional request headers
 * @param {Object} [params.behavior] - Optional behavioral signals (e.g. rapid repeat rate)
 * @returns {{ classification: 'HUMAN'|'BOT'|'UNKNOWN', reason: string, botConfidence: number }}
 */
export function classifyVisitorTraffic({ userAgent, ip, headers = {}, behavior = {} } = {}) {
  const ua = (userAgent || '').trim().toLowerCase();

  // 1. Missing or empty user agent: abnormal for real browsers
  if (!ua) {
    return {
      classification: 'UNKNOWN',
      reason: 'Missing user agent header',
      botConfidence: 0.5,
    };
  }

  // 2. Known bot user-agent pattern matching
  for (const pattern of KNOWN_BOT_PATTERNS) {
    if (ua.includes(pattern)) {
      return {
        classification: 'BOT',
        reason: `Matches known crawler/automation signature: "${pattern}"`,
        botConfidence: 0.99,
      };
    }
  }

  // 3. Headless / automation indicators in headers
  if (headers['x-purpose'] === 'preview' || headers['purpose'] === 'prefetch') {
    return {
      classification: 'BOT',
      reason: 'Prefetch / preview request indicator',
      botConfidence: 0.9,
    };
  }

  // 4. Automation framework signatures
  if (ua.includes('webdriver') || ua.includes('electron') && !ua.includes('chrome')) {
    return {
      classification: 'BOT',
      reason: 'Automation framework signature detected',
      botConfidence: 0.95,
    };
  }

  // 5. Abnormal request frequency or impossible navigation patterns
  if (behavior.isRateSpike || behavior.identicalRepeatCount > 10) {
    return {
      classification: 'BOT',
      reason: 'Abnormal event frequency / rapid automated request pattern',
      botConfidence: 0.9,
    };
  }

  // 6. Basic browser structure check
  const hasBrowserToken = COMMON_BROWSER_TOKENS.some((token) => ua.includes(token));
  if (!hasBrowserToken) {
    return {
      classification: 'UNKNOWN',
      reason: 'Unrecognized user agent structure (no standard browser token)',
      botConfidence: 0.6,
    };
  }

  // Standard human browser profile
  return {
    classification: 'HUMAN',
    reason: 'Standard browser profile with no crawler or automation indicators',
    botConfidence: 0.05,
  };
}
