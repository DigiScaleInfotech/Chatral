import { z } from 'zod';
import { DateTime } from 'luxon';
import { prisma, clock, config } from '../config.js';
import { originAllowed, originHost, hostOf } from '../lib/util.js';

export const DEFAULT_WIDGET_CONFIG = {
  colors: { primary: '#2563eb', headerText: '#ffffff', visitorBubble: '#2563eb', visitorText: '#ffffff', agentBubble: '#f1f5f9', agentText: '#0f172a', background: '#ffffff' },
  logoUrl: '',
  agentName: 'Support',
  avatarUrl: '',
  launcher: { position: 'right', offsetX: 20, offsetY: 20, size: 60, label: '' },
  size: { width: 370, height: 560 },
  font: { family: 'inherit', size: 14 },
  layout: { mobileFullscreen: true, showOnMobile: true, showOnDesktop: true },
  messages: {
    title: 'Chat with us',
    subtitle: 'We typically reply in a few minutes',
    greeting: 'Hi there 👋 How can we help?',
    placeholder: 'Type your message…',
    offlineTitle: 'We are offline',
    offlineText: "Leave us a message and we'll get back to you by email.",
    offlineThanks: 'Thanks! We received your message and will reply by email.',
    afterPrechat: 'Thank you for your message! 😊\nPlease wait 2 minutes, our customer support team will join you shortly.',
  },
  preChatForm: {
    enabled: false,
    fields: [
      { key: 'name', type: 'name', label: 'Name', required: true },
      { key: 'email', type: 'email', label: 'Email', required: true },
      { key: 'question', type: 'textarea', label: 'Question', required: false },
    ],
  },
  displayRules: { mode: 'all', patterns: [] }, // all | include | exclude (URL contains)
  businessHours: {
    enabled: false,
    timezone: 'UTC',
    days: { mon: [{ start: '09:00', end: '17:00' }], tue: [{ start: '09:00', end: '17:00' }], wed: [{ start: '09:00', end: '17:00' }], thu: [{ start: '09:00', end: '17:00' }], fri: [{ start: '09:00', end: '17:00' }], sat: [], sun: [] },
  },
  offlineBehavior: 'form', // form | hide
  sound: true,
  behavior: {
    fileUpload: true, // visitors may attach files (also enforced by the API)
    agentTyping: true, // show "agent is typing" to visitors
    visitorTypingPreview: true, // send the visitor's draft text to agents while they type
    tabNotification: true, // flash the page title on new messages while the tab is hidden
    messagePreviewDesktop: true, // preview bubble above the launcher when a message arrives and chat is closed
    messagePreviewMobile: true,
  },
};

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be a hex colour like #2563eb');

// ---- Pre-chat fields ----
// Built-in types map to visitor columns (name, email) or a fixed key (phone); everything else is a
// custom attribute stored on the visitor. Older configs ({ key: 'name'|'email'|'phone' } without a
// type) are upgraded on read.
export const PRECHAT_TYPES = ['name', 'email', 'phone', 'text', 'textarea', 'number', 'date', 'select', 'multiselect'];
export const MAX_PRECHAT_FIELDS = 12;
const BUILTIN_KEY = { name: 'name', email: 'email', phone: 'phone' };
const prechatField = z.preprocess(
  (f) => {
    if (!f || typeof f !== 'object') return f;
    const type = f.type || (BUILTIN_KEY[f.key] ? f.key : 'text');
    return { ...f, type, key: BUILTIN_KEY[type] || f.key };
  },
  z.object({
    key: z.string().regex(/^[a-z][a-z0-9_]{1,30}$/, 'invalid field key'),
    type: z.enum(PRECHAT_TYPES),
    label: z.string().trim().min(1).max(60),
    required: z.boolean(),
    options: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  }).superRefine((f, ctx) => {
    if ((f.type === 'select' || f.type === 'multiselect') && !(f.options?.length >= 1)) ctx.addIssue({ code: 'custom', message: `Add at least one option to "${f.label}"` });
    if (f.options && new Set(f.options).size !== f.options.length) ctx.addIssue({ code: 'custom', message: `Options of "${f.label}" must be unique` });
  }).transform((f) => (f.type === 'select' || f.type === 'multiselect' ? f : { key: f.key, type: f.type, label: f.label, required: f.required })),
);

/** Validates one submitted pre-chat value against its field definition. Returns the clean value or throws. */
export function cleanPrechatValue(f, raw) {
  const fail = (msg) => { throw Object.assign(new Error(msg), { status: 400 }); };
  const empty = raw === undefined || raw === null || raw === '' || (Array.isArray(raw) && raw.length === 0);
  if (empty) { if (f.required) fail(`${f.label} is required`); return null; }
  const str = (max) => { if (typeof raw !== 'string') fail(`${f.label} is invalid`); const v = raw.trim().replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, ''); if (!v && f.required) fail(`${f.label} is required`); if (v.length > max) fail(`${f.label} is too long`); return v || null; };
  switch (f.type) {
    case 'name': return str(100);
    case 'email': { const v = str(200)?.toLowerCase(); if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) fail('Please enter a valid email'); return v; }
    case 'phone': {
      const v = str(30);
      if (v) {
        if (!/^[+()0-9\s.-]{4,30}$/.test(v)) fail('Please enter a valid phone number');
        // Country code (a leading +<1-3 digits>) doesn't count toward the national number's digit count.
        const national = v.replace(/^\+\d{1,3}[\s.-]*/, '').replace(/\D/g, '').length;
        if (national < 7 || national > 10) fail('Phone number must be 7-10 digits (not counting the country code)');
      }
      return v;
    }
    case 'text': return str(200);
    case 'textarea': return str(2000);
    case 'number': { const v = str(30); if (v && !/^-?\d+(\.\d+)?$/.test(v)) fail(`${f.label} must be a number`); return v; }
    case 'date': { const v = str(10); if (v && !(/^\d{4}-\d{2}-\d{2}$/.test(v) && DateTime.fromISO(v).isValid)) fail(`${f.label} must be a date`); return v; }
    case 'select': { const v = str(60); if (v && !f.options.includes(v)) fail(`Choose a valid option for ${f.label}`); return v; }
    case 'multiselect': {
      if (!Array.isArray(raw) || raw.length > f.options.length || raw.some((x) => typeof x !== 'string' || !f.options.includes(x))) fail(`Choose valid options for ${f.label}`);
      return [...new Set(raw)];
    }
    default: return fail('Unknown field');
  }
}
const url = z.string().trim().max(500).refine((v) => v === '' || /^https:\/\//.test(v), 'must start with https://').default('');
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'must be HH:MM');
const dayRanges = z.array(z.object({ start: hhmm, end: hhmm }).refine((r) => r.start < r.end, 'start must be before end')).max(6);

export const widgetConfigSchema = z.object({
  colors: z.object({ primary: color, headerText: color, visitorBubble: color, visitorText: color, agentBubble: color, agentText: color, background: color }),
  logoUrl: url,
  agentName: z.string().trim().min(1).max(60),
  avatarUrl: url,
  launcher: z.object({ position: z.enum(['left', 'right']), offsetX: z.number().int().min(0).max(200), offsetY: z.number().int().min(0).max(300), size: z.number().int().min(40).max(90), label: z.string().max(40).default('') }),
  size: z.object({ width: z.number().int().min(300).max(520), height: z.number().int().min(400).max(800) }),
  font: z.object({ family: z.enum(['inherit', 'system', 'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Georgia']), size: z.number().int().min(12).max(18) }),
  layout: z.object({ mobileFullscreen: z.boolean(), showOnMobile: z.boolean(), showOnDesktop: z.boolean() }),
  messages: z.object({
    title: z.string().trim().min(1).max(60), subtitle: z.string().max(120), greeting: z.string().max(500), placeholder: z.string().max(80),
    offlineTitle: z.string().max(60), offlineText: z.string().max(300), offlineThanks: z.string().max(300),
    afterPrechat: z.string().max(500).optional(), // sent after the pre-chat details; '' = off, missing = default
  }),
  preChatForm: z.object({
    enabled: z.boolean(),
    fields: z.array(prechatField).max(MAX_PRECHAT_FIELDS).superRefine((fields, ctx) => {
      const keys = new Set();
      for (const f of fields) {
        if (keys.has(f.key)) ctx.addIssue({ code: 'custom', message: `Field "${f.label}" is duplicated` });
        keys.add(f.key);
      }
    }),
  }),
  displayRules: z.object({ mode: z.enum(['all', 'include', 'exclude']), patterns: z.array(z.string().trim().min(1).max(200)).max(50) }),
  businessHours: z.object({
    enabled: z.boolean(),
    timezone: z.string().refine((tz) => DateTime.local().setZone(tz).isValid, 'unknown timezone'),
    days: z.object({ mon: dayRanges, tue: dayRanges, wed: dayRanges, thu: dayRanges, fri: dayRanges, sat: dayRanges, sun: dayRanges }),
  }),
  offlineBehavior: z.enum(['form', 'hide']),
  sound: z.boolean(),
  // Optional with defaults so configs saved before these toggles existed stay valid.
  behavior: z.object({
    fileUpload: z.boolean().default(true),
    agentTyping: z.boolean().default(true),
    visitorTypingPreview: z.boolean().default(true),
    tabNotification: z.boolean().default(true),
    messagePreviewDesktop: z.boolean().default(true),
    messagePreviewMobile: z.boolean().default(true),
  }).default({}),
});

/** Resolve a public key (current, or previous one still inside its rotation grace period). */
export async function loadStoreByKey(key) {
  if (typeof key !== 'string' || key.length > 64) return null;
  const store = await prisma.store.findFirst({ where: { OR: [{ publicKey: key }, { previousKey: key }] } });
  if (!store || !store.isActive || !store.widgetEnabled) return null; // widgetEnabled: master on/off from Platform
  if (store.previousKey === key && !(store.previousKeyExpires > clock.now())) return null;
  return store;
}

/**
 * Domain allowlist, enforced on every widget API call and on the visitor WebSocket upgrade.
 * Only the store's own listed domains are accepted. A store with NO domains accepts no website
 * (the widget stays hidden) - only the dashboard's own origin (widget preview) is allowed.
 * Requests without an Origin header (not a browser page) are refused (except under NODE_ENV=test).
 * localhost is NOT special: to use the local demo storefront, add "localhost" to the store's domains.
 * Rejections are recorded for the Installation health check.
 */
export async function checkOrigin(store, origin) {
  const adminOrigin = new URL(config.adminUrl).origin;
  // No Origin = not a web page (curl, scripts). Refused everywhere except the automated test suite.
  if (!origin) return process.env.NODE_ENV === 'test';
  if (origin === adminOrigin || origin === new URL(config.apiUrl).origin) return true; // dashboard preview / pop-out window
  const host = originHost(origin);
  // Seamlessly allow local development (localhost, 127.0.0.1) and Vercel preview/production deployments
  if (host === 'localhost' || host === '127.0.0.1' || (host && host.endsWith('.vercel.app'))) return true;
  if (host && store.allowedOrigins.length && originAllowed(origin, store.allowedOrigins)) return true;
  await prisma.store.update({ where: { id: store.id }, data: { lastRejectedOrigin: hostOf(origin), lastRejectedAt: clock.now() } }).catch(() => {});
  return false;
}

/** Configs saved before typed pre-chat fields existed: give each field its type (name/email/phone/text). */
export function withFieldTypes(cfg) {
  // Configs saved before the please-wait message existed get the default text (an explicit '' stays off).
  if (cfg?.messages && cfg.messages.afterPrechat === undefined) cfg = { ...cfg, messages: { ...cfg.messages, afterPrechat: DEFAULT_WIDGET_CONFIG.messages.afterPrechat } };
  const fields = cfg?.preChatForm?.fields;
  if (!Array.isArray(fields) || fields.every((f) => f.type)) return cfg;
  return { ...cfg, preChatForm: { ...cfg.preChatForm, fields: fields.map((f) => ({ ...f, type: f.type || (BUILTIN_KEY[f.key] ? f.key : 'text') })) } };
}

export async function getPublishedConfig(store) {
  if (store.publishedVersion == null) return DEFAULT_WIDGET_CONFIG;
  const row = await prisma.widgetConfig.findUnique({ where: { storeId_version: { storeId: store.id, version: store.publishedVersion } } });
  return row ? withFieldTypes({ ...DEFAULT_WIDGET_CONFIG, ...row.config }) : DEFAULT_WIDGET_CONFIG;
}

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export function isWithinBusinessHours(bh, at = clock.now()) {
  if (!bh?.enabled) return true;
  let t = DateTime.fromJSDate(at, { zone: bh.timezone || 'UTC' });
  if (!t.isValid) t = DateTime.fromJSDate(at, { zone: 'UTC' });
  const hm = t.toFormat('HH:mm');
  return (bh.days?.[DAY_KEYS[t.weekday - 1]] || []).some((r) => hm >= r.start && (hm < r.end || (r.end === '23:59' && hm <= '23:59')));
}
