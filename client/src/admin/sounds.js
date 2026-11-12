// Dashboard notification sounds, synthesised with the Web Audio API (no audio files, no dependencies).
//   newConversation: rising three-note chime  (C6 → E6 → G6)
//   message:         one short low "tick"      (A4, triangle)
// Browsers block audio until the user interacts with the page; unlockAudio() is wired to the first
// click/keypress, and getSoundStatus() reports the real state instead of assuming sound works.

const PREFS_KEY = 'lc_sound_prefs';
// Per sound: which tone (built-in or the user's own file) and how many times it plays. Defaults = original behaviour.
export const DEFAULT_PREFS = {
  enabled: true, newConversation: true, message: true,
  newConversationTone: 'chime', newConversationRepeat: 1,
  messageTone: 'tick', messageRepeat: 1,
};
export const MAX_REPEAT = 10;
export const MAX_FILE_BYTES = 500 * 1024;
const FILE_KEY = (kind) => `lc_sound_file_${kind}`;

let createContext = () => {
  const Ctor = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  return Ctor ? new Ctor() : null;
};
let ctx = null;
let ctxFailed = false;
const listeners = new Set();

/** Test hook: swap the AudioContext factory and reset state. */
export function __setAudioContextFactory(factory) {
  createContext = factory;
  ctx = null;
  ctxFailed = false;
}

function context() {
  if (ctx || ctxFailed) return ctx;
  try { ctx = createContext(); } catch { ctx = null; }
  if (!ctx) ctxFailed = true;
  else if (typeof ctx.addEventListener === 'function') ctx.addEventListener('statechange', notify);
  return ctx;
}

/** 'unavailable' (no Web Audio) | 'blocked' (needs a user interaction) | 'ready'. */
export function getSoundStatus() {
  const c = context();
  if (!c) return 'unavailable';
  return c.state === 'running' ? 'ready' : 'blocked';
}

function notify() { const s = getSoundStatus(); for (const fn of listeners) fn(s); }
export function onSoundStatus(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/** Must run inside a user gesture handler to satisfy autoplay policies. */
export async function unlockAudio() {
  const c = context();
  if (!c) return 'unavailable';
  try { if (c.state !== 'running') await c.resume(); } catch { /* still blocked */ }
  notify();
  return getSoundStatus();
}

let gestureHooked = false;
/** Unlock on the first genuine interaction anywhere in the dashboard. */
export function installAudioUnlock(target = typeof document !== 'undefined' ? document : null) {
  if (gestureHooked || !target) return;
  gestureHooked = true;
  const handler = () => {
    unlockAudio().then((s) => {
      if (s !== 'blocked') { target.removeEventListener('pointerdown', handler); target.removeEventListener('keydown', handler); }
    });
  };
  target.addEventListener('pointerdown', handler);
  target.addEventListener('keydown', handler);
}

export function loadSoundPrefs() {
  try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') }; } catch { return { ...DEFAULT_PREFS }; }
}
export function saveSoundPrefs(prefs) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* storage blocked: keep in memory only */ }
  return prefs;
}

export const TONES = {
  chime: { label: 'Chime', notes: [{ f: 1046.5, t: 0, d: 0.15 }, { f: 1318.5, t: 0.13, d: 0.15 }, { f: 1760, t: 0.26, d: 0.25 }] },
  tick: { label: 'Tick', notes: [{ f: 880, t: 0, d: 0.12, type: 'triangle' }, { f: 1320, t: 0.12, d: 0.18, type: 'triangle' }] },
  bell: { label: 'Bell', notes: [{ f: 1568, t: 0, d: 0.7 }, { f: 2093, t: 0, d: 0.5 }] },
};
const KINDS = ['newConversation', 'message'];
const toneLength = (notes) => Math.max(...notes.map((n) => n.t + n.d));
const repeatOf = (prefs, kind) => Math.min(MAX_REPEAT, Math.max(1, Math.round(Number(prefs[`${kind}Repeat`]) || 1)));

// ---- The user's own sound files (kept in this browser as data URLs; decoded once per page) ----
const decoded = new Map(); // kind -> Promise<AudioBuffer|null>
export function loadSoundFile(kind) {
  try { const v = localStorage.getItem(FILE_KEY(kind)); return v ? JSON.parse(v) : null; } catch { return null; }
}
/** Saves an uploaded audio file for `kind`. Throws a readable error for wrong type / too big / storage full. */
export async function saveSoundFile(kind, file) {
  if (!file || !/^audio\//.test(file.type)) throw new Error('Please choose an audio file (mp3, wav, ogg…)');
  if (file.size > MAX_FILE_BYTES) throw new Error('The file is too large (max 500 KB)');
  const dataUrl = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error('Could not read the file')); r.readAsDataURL(file); });
  try { localStorage.setItem(FILE_KEY(kind), JSON.stringify({ name: file.name, dataUrl })); } catch { throw new Error('Not enough browser storage for this file'); }
  decoded.delete(kind);
  return { name: file.name, dataUrl };
}
export function removeSoundFile(kind) {
  try { localStorage.removeItem(FILE_KEY(kind)); } catch { /* ignore */ }
  decoded.delete(kind);
}
/** data:audio/...;base64,XXXX → ArrayBuffer. */
export function dataUrlToBuffer(dataUrl) {
  const bin = atob(String(dataUrl).slice(String(dataUrl).indexOf(',') + 1));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}
// Promise and callback forms of decodeAudioData (older Safari only has the callback form).
const decodeAudio = (c, buf) => new Promise((res, rej) => { const p = c.decodeAudioData(buf, res, rej); if (p?.then) p.then(res, rej); });

function bufferFor(kind, c) {
  if (!decoded.has(kind)) {
    const f = loadSoundFile(kind);
    // Decoded straight from the stored data URL (no fetch: the dashboard's CSP only allows connections to itself).
    decoded.set(kind, !f ? Promise.resolve(null) : Promise.resolve().then(() => decodeAudio(c, dataUrlToBuffer(f.dataUrl))).catch(() => null));
  }
  return decoded.get(kind);
}

function playTone(c, notes, start) {
  for (const n of notes) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = n.type || 'sine';
    osc.frequency.value = n.f;
    gain.gain.setValueAtTime(0.0001, start + n.t);
    gain.gain.exponentialRampToValueAtTime(0.6, start + n.t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + n.t + n.d);
    osc.connect(gain).connect(c.destination);
    osc.start(start + n.t);
    osc.stop(start + n.t + n.d + 0.02);
  }
}

/**
 * Plays `kind` if allowed by prefs and the browser. Returns true only if tones were actually scheduled
 * (false when muted, unsupported or blocked) - never throws.
 */
export function playSound(kind, prefs = loadSoundPrefs()) {
  if (!KINDS.includes(kind) || !prefs.enabled || !prefs[kind]) return false;
  if (getSoundStatus() !== 'ready') return false;
  const times = repeatOf(prefs, kind);
  const tone = prefs[`${kind}Tone`] || DEFAULT_PREFS[`${kind}Tone`];
  try {
    const c = context();
    const fallback = TONES[DEFAULT_PREFS[`${kind}Tone`]].notes;
    if (tone === 'custom' && loadSoundFile(kind)) {
      // Own file: played `times` times back to back (falls back to the built-in tone if it can't be decoded).
      bufferFor(kind, c).then((buf) => {
        const start = c.currentTime + 0.01;
        for (let i = 0; i < times; i++) {
          if (!buf) { playTone(c, fallback, start + i * (toneLength(fallback) + 0.35)); continue; }
          const src = c.createBufferSource();
          src.buffer = buf;
          src.connect(c.destination);
          src.start(start + i * (buf.duration + 0.3));
        }
      });
      return true;
    }
    const notes = (TONES[tone] || TONES[DEFAULT_PREFS[`${kind}Tone`]]).notes;
    const start = c.currentTime + 0.01;
    const gap = toneLength(notes) + 0.35;
    for (let i = 0; i < times; i++) playTone(c, notes, start + i * gap);
    return true;
  } catch {
    return false;
  }
}

/** Remembers recently seen ids so a re-delivered event never sounds twice. */
export function createDeduper(max = 500) {
  const seen = new Set();
  return (id) => {
    if (!id || seen.has(id)) return false;
    seen.add(id);
    if (seen.size > max) seen.delete(seen.values().next().value);
    return true;
  };
}

/**
 * The shell's socket → sound bridge. One instance per page, so multiple subscribers can't double-play.
 * Missed messages recovered after a reconnect arrive over REST, not as socket events, so they never sound.
 */
export function createSoundListener({ getStoreIds, classify, play = playSound, dedupe = createDeduper() }) {
  return (type, d) => {
    const kind = classify(type, d, { storeIds: getStoreIds() });
    if (!kind || !dedupe(d.message.id)) return null;
    return play(kind) ? kind : null;
  };
}
