import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ChatWindow, { Icon } from './ChatWindow.jsx';

const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  sget: (k) => { try { return sessionStorage.getItem(k); } catch { return null; } },
  sset: (k, v) => { try { sessionStorage.setItem(k, v); } catch { /* ignore */ } },
};
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const isMobile = () => window.matchMedia('(max-width: 640px)').matches;

/** True only when `hash` is exactly this store's own direct chat link (e.g. "#lc-01234567"). */
export function chatLinkMatches(hash, chatLinkId) {
  if (!chatLinkId) return false;
  const m = /^#lc-(\d{8})$/.exec(hash || '');
  return !!m && m[1] === chatLinkId;
}

/**
 * iOS/iPadOS Safari & Chrome (both WebKit) zoom the whole page when a focused input's computed font-size is
 * under 16px, and if the host page's own <meta name="viewport"> locks the zoom level (maximum-scale / 
 * user-scalable=no, common in storefront themes), Safari can get stuck zoomed in after blur because it has
 * nothing to zoom back out *to*. This briefly relaxes the page's own viewport meta tag while any field inside
 * the widget has focus, and restores the page's original tag afterwards - it never changes the page permanently.
 * Scoped to WebKit touch devices only; other browsers are untouched.
 */
export function preventStuckZoom(root) {
  const iOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!iOS || typeof document === 'undefined') return () => {};
  let meta = document.querySelector('meta[name="viewport"]');
  const created = !meta;
  if (!meta) { meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); }
  const original = meta.getAttribute('content') || 'width=device-width, initial-scale=1';
  let restoreTimer = null;
  const isField = (el) => el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
  const onFocusIn = (e) => {
    const el = e.composedPath ? e.composedPath()[0] : e.target;
    if (!isField(el) || !root.contains(el)) return;
    clearTimeout(restoreTimer);
    // Let Safari zoom in (its normal behaviour) but make sure it is free to zoom back out again afterwards.
    meta.setAttribute('content', `${original.replace(/,?\s*(maximum-scale|user-scalable)\s*=\s*[^,]+/gi, '')}, maximum-scale=10, user-scalable=yes`);
  };
  const onFocusOut = (e) => {
    const el = e.composedPath ? e.composedPath()[0] : e.target;
    if (!isField(el) || !root.contains(el)) return;
    // Small delay so a tap moving focus between two of our own fields doesn't flicker the viewport mid-transition.
    restoreTimer = setTimeout(() => meta.setAttribute('content', original), 150);
  };
  document.addEventListener('focusin', onFocusIn, true);
  document.addEventListener('focusout', onFocusOut, true);
  return () => {
    document.removeEventListener('focusin', onFocusIn, true);
    document.removeEventListener('focusout', onFocusOut, true);
    clearTimeout(restoreTimer);
    meta.setAttribute('content', original);
    if (created) meta.remove();
  };
}

// Alternates the page title until the visitor comes back to the tab.
let flashTimer = null;
function flashTitle(text) {
  if (flashTimer) return;
  const original = document.title;
  let on = false;
  flashTimer = setInterval(() => { on = !on; document.title = on ? text : original; }, 1000);
  const stop = () => {
    if (document.visibilityState !== visible) return;
    clearInterval(flashTimer);
    flashTimer = null;
    document.title = original;
    document.removeEventListener(visibilitychange, stop);
  };
  document.addEventListener(visibilitychange, stop);
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.frequency.value = 880; g.gain.setValueAtTime(0.08, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.25);
  } catch { /* autoplay blocked */ }
}

function matchesDisplayRules(rules, href) {
  if (!rules || rules.mode === 'all') return true;
  const hit = rules.patterns.some((p) => href.toLowerCase().includes(p.toLowerCase()));
  return rules.mode === 'include' ? hit : !hit;
}

/** Merge by server id / clientMsgId, keep seq order; pending local messages stay at the end. */
function merge(list, incoming) {
  const out = [...list];
  for (const m of incoming) {
    const i = out.findIndex((x) => (m.id && x.id === m.id) || (m.clientMsgId && x.clientMsgId === m.clientMsgId) || (m.proactiveOf && x.proactiveOf === m.proactiveOf));
    if (i >= 0) out[i] = { ...out[i], ...m, state: m.state }; else out.push(m);
  }
  return out.sort((a, b) => (a.seq ?? Infinity) - (b.seq ?? Infinity) || new Date(a.createdAt) - new Date(b.createdAt));
}

/** "Label : value" lines for the submitted pre-chat answers, in form order. */
export function prechatDetails(fields, values) {
  return fields.map((f) => {
    const raw = values?.[f.key];
    const val = Array.isArray(raw) ? raw.filter(Boolean).join(', ') : raw == null ? '' : String(raw).trim();
    return val ? `${f.label} : ${val}` : null;
  }).filter(Boolean).join('\n');
}

/** Fetches the visitor's transcript (token in a header, never in the URL) and saves it as a .txt file. */
export async function downloadTranscript(url, visitorToken) {
  const res = await fetch(url, { headers: visitorToken ? { 'X-Visitor-Token': visitorToken } : {} });
  if (!res.ok) throw new Error(res.status === 404 ? 'This chat is no longer available.' : 'Could not download the transcript.');
  // octet-stream: browsers can't display it, so it is always saved as a file (never opened as a page),
  // even if the store's theme hijacks link clicks.
  const blob = new Blob([await res.arrayBuffer()], { type: 'application/octet-stream' });
  const name = (res.headers.get('content-disposition') || '').match(/filename="([^"]+)"/)?.[1] || 'chat-transcript.txt';
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href; a.download = name; a.rel = 'noopener';
  // Not added to the shop's page, so theme scripts listening for link clicks never see it.
  a.addEventListener('click', (e) => e.stopPropagation());
  a.click();
  setTimeout(() => URL.revokeObjectURL(href), 10_000);
}

export default function ChatApp({ api, storeKey, popout = false }) {
  const [cfg, setCfg] = useState(null);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(popout || store.sget(`lc_open_${storeKey}`) === '1');
  // Visitor's own sound preference (header menu); the store's cfg.sound still has to allow sound.
  const [soundOn, setSoundOn] = useState(store.get(`lc_sound_${storeKey}`) !== 'off');
  const soundRef = useRef(soundOn);
  soundRef.current = soundOn;
  const [popoutError, setPopoutError] = useState(false);
  const [ended, setEnded] = useState(false); // visitor ended the chat: hide the message box until they start a new one
  const [messages, setMessages] = useState([]);
  const [conv, setConv] = useState(null);
  const [visitor, setVisitor] = useState(null);
  const [avail, setAvail] = useState({ online: true });
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const [preview, setPreview] = useState(null); // last unseen agent/bot message, shown above the launcher
  const [agentReadSeq, setAgentReadSeq] = useState(0);
  const [mode, setMode] = useState('chat');
  const [banner, setBanner] = useState(null);
  const [mobile, setMobile] = useState(isMobile());
  const token = useRef(null);
  const tag = useRef(null);
  const ws = useRef(null);
  const convRef = useRef(null);
  const proactiveRef = useRef(null);
  const openRef = useRef(open);
  const resumed = useRef(false);
  const lastSeq = useRef(0);
  const typingTimer = useRef(null);
  const cfgRef = useRef(null);
  convRef.current = conv;
  openRef.current = open;
  cfgRef.current = cfg;

  const call = useCallback(async (path, { method = 'GET', body, raw, headers = {} } = {}) => {
    const res = await fetch(`${api}/api/widget/${storeKey}${path}`, {
      method,
      headers: { ...(raw ? {} : { 'Content-Type': 'application/json' }), ...(token.current ? { 'X-Visitor-Token': token.current } : {}), ...headers },
      body: raw || (body ? JSON.stringify(body) : undefined),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || 'Something went wrong'), { status: res.status, code: data.code });
    return data;
  }, [api, storeKey]);

  const page = () => ({ url: location.href, title: document.title, referrer: document.referrer, device: isMobile() ? 'mobile' : 'desktop' });

  // ---------- boot ----------
  const boot = useCallback(async (retryCount = 0) => {
    try {
      tag.current = store.get(`lc_k_${storeKey}`);
      if (!tag.current) {
        tag.current = (await call('/tag')).tag;
        store.set(`lc_k_${storeKey}`, tag.current);
      }
      token.current = store.get(`lc_v_${tag.current}`);
      const s = await call('/session', { method: 'POST', body: { token: token.current, ...page() } });
      if (s.visitorToken) { token.current = s.visitorToken; store.set(`lc_v_${s.tag}`, s.visitorToken); }
      if (s.rotatedKey) console.warn('[livechat] This embed uses an old store key. Update the snippet from your dashboard.');
      setCfg(s.config);
      window.__livechatLoadFont?.(s.config.font.family);
      setVisitor(s.visitor);
      setAvail(s.availability);
      if (s.conversation) {
        setConv({ id: s.conversation.id, status: s.conversation.status });
        lastSeq.current = s.conversation.lastSeq;
        setAgentReadSeq(s.conversation.agentReadSeq);
        setMessages(s.conversation.messages.map(withFormState));
        setUnread(s.conversation.unreadForVisitor);
        if (openRef.current && !resumed.current) {
          resumed.current = true;
          call('/resume', { method: 'POST', body: { conversationId: s.conversation.id } }).catch(() => {});
        }
      } else {
        setConv(null); setMessages([]);
        if (s.proactive) showProactive(s.proactive, false);
      }
      connect();
    } catch (err) {
      console.warn('[livechat] Widget boot attempt failed:', err?.message || err);
      // Auto-retry up to 4 times (every 3.5s) if backend is waking up or temporary network hiccup
      if (retryCount < 4) {
        setTimeout(() => boot(retryCount + 1), 3500);
      }
    }
  }, [call, storeKey]);

  const withFormState = (m) => (m.meta?.form ? { ...m, formDone: store.get(`lc_form_${m.id}`) === '1' } : m);

  function showProactive(p, notify = true) {
    // A trigger's welcome is shown only as the bubble above the launcher; it is not added to the chat itself.
    // Each welcome is shown once: remembered in this browser, so other pages and reloads don't show it again.
    const seenKey = `lc_welcome_${storeKey}_${p.executionId}`;
    if (store.get(seenKey) === '1') return;
    store.set(seenKey, '1');
    proactiveRef.current = p;
    // Closed chat: show the welcome text as a bubble above the launcher (tawk.to style), no sender heading.
    if (!openRef.current && p.body) setPreview({ name: '', body: p.body });
    if (notify && !openRef.current) { setUnread((u) => u + 1); if (cfgRef.current?.sound && soundRef.current) beep(); notifyIncoming(p); }
  }

  /** New agent/bot message while the visitor isn't looking: tab title, per store settings (only the welcome uses the bubble). */
  function notifyIncoming(m) {
    const b = cfgRef.current?.behavior || {};
    if (b.tabNotification !== false && document.visibilityState !== 'visible') flashTitle(`💬 ${m.senderName || 'New message'}`);
  }

  // ---------- realtime ----------
  const retry = useRef(0);
  const connect = useCallback(() => {
    if (!token.current) return;
    try { ws.current?.close(); } catch { /* ignore */ }
    const url = `${api.replace(/^http/, 'ws')}/ws/visitor?key=${encodeURIComponent(storeKey)}&vt=${encodeURIComponent(token.current)}`;
    const sock = new WebSocket(url);
    ws.current = sock;
    sock.onopen = () => {
      const wasRetry = retry.current > 0;
      retry.current = 0;
      setBanner(null);
      if (wasRetry) syncMissed();
      flushFailed();
    };
    sock.onmessage = (e) => {
      let ev; try { ev = JSON.parse(e.data); } catch { return; }
      onEvent(ev.type, ev.data || {});
    };
    sock.onclose = () => {
      if (ws.current !== sock) return;
      const delay = Math.min(30_000, 1000 * 2 ** retry.current++);
      if (retry.current > 2) setBanner('Reconnecting…');
      setTimeout(() => { if (ws.current === sock) connect(); }, delay);
    };
  }, [api, storeKey]);

  const sendWs = (type, data) => { if (ws.current?.readyState === 1) ws.current.send(JSON.stringify({ type, data })); };

  function onEvent(type, d) {
    if (type === 'message') {
      const m = d.message;
      if (convRef.current && m.conversationId !== convRef.current.id) return;
      if (!convRef.current) setConv({ id: m.conversationId, status: 'OPEN' });
      lastSeq.current = Math.max(lastSeq.current, m.seq);
      setMessages((list) => merge(list, [withFormState({ ...m, state: undefined })]));
      if (m.senderType !== 'VISITOR') {
        setTyping(false);
        sendWs('delivered', { conversationId: m.conversationId, seq: m.seq });
        if (openRef.current && document.visibilityState === 'visible') sendWs('read', { conversationId: m.conversationId, seq: m.seq });
        else {
          setUnread((u) => u + 1);
          if (m.senderType !== 'SYSTEM') { if (cfgRef.current?.sound && soundRef.current) beep(); notifyIncoming(m); }
        }
      }
    } else if (type === 'typing') {
      if (cfgRef.current?.behavior?.agentTyping === false) return;
      setTyping(!!d.typing);
      clearTimeout(typingTimer.current);
      if (d.typing) typingTimer.current = setTimeout(() => setTyping(false), 6000);
    } else if (type === 'receipt' && d.agentReadSeq) {
      setAgentReadSeq((s) => Math.max(s, d.agentReadSeq));
    } else if (type === 'conversation') {
      setConv((c) => (c && c.id === d.id ? { ...c, status: d.status } : c));
    } else if (type === 'proactive') {
      if (!convRef.current) showProactive(d);
    } else if (type === 'config_updated' && d.config) {
      setCfg((c) => ({ ...d.config, transcripts: c?.transcripts })); // a re-publish doesn't change email availability
      window.__livechatLoadFont?.(d.config.font?.family);
    } else if (type === 'conversation_deleted') {
      if (convRef.current?.id === d.id) { setConv(null); setMessages([]); lastSeq.current = 0; }
    } else if (type === 'media_expired') {
      if (convRef.current?.id === d.conversationId) setMessages((list) => merge(list, [d.message]));
    }
  }

  async function syncMissed() {
    const c = convRef.current;
    if (!c) return;
    try {
      const r = await call(`/conversations/${c.id}/messages?after=${lastSeq.current}`);
      lastSeq.current = Math.max(lastSeq.current, r.lastSeq);
      setAgentReadSeq((s) => Math.max(s, r.agentReadSeq));
      setConv((x) => (x ? { ...x, status: r.status } : x));
      if (r.messages.length) setMessages((list) => merge(list, r.messages.map(withFormState)));
    } catch (e) {
      if (e.code === 'CONVERSATION_GONE') { setConv(null); setMessages((l) => l.filter((m) => m.state)); lastSeq.current = 0; }
    }
  }

  // ---------- sending ----------
  const outbox = useRef(new Map()); // clientMsgId -> payload (retries reuse the id → server dedupes)

  async function deliver(clientMsgId) {
    const p = outbox.current.get(clientMsgId);
    if (!p) return;
    setMessages((list) => merge(list, [{ clientMsgId, state: 'pending' }]));
    try {
      const r = await call('/messages', { method: 'POST', body: { ...p, conversationId: convRef.current?.id || null, proactiveExecutionId: null } });
      outbox.current.delete(clientMsgId);
      if (!convRef.current || convRef.current.id !== r.conversationId) {
        setConv({ id: r.conversationId, status: r.status });
        resumed.current = true;
        if (proactiveRef.current) { const pid = proactiveRef.current.executionId; proactiveRef.current = null; setMessages((l) => l.filter((m) => m.proactiveOf !== pid)); syncAfterCreate(r.conversationId); }
      }
      lastSeq.current = Math.max(lastSeq.current, r.message.seq);
      setMessages((list) => merge(list, [{ ...r.message, clientMsgId, state: undefined }]));
    } catch (e) {
      if (e.status === 401) { await boot(); return deliver(clientMsgId); }
      if (e.status && e.status < 500 && e.status !== 429) { outbox.current.delete(clientMsgId); setBanner(e.message); setMessages((l) => l.filter((m) => m.clientMsgId !== clientMsgId)); return; }
      setMessages((list) => merge(list, [{ clientMsgId, state: 'failed' }]));
    }
  }

  async function syncAfterCreate(id) {
    const r = await call(`/conversations/${id}/messages?after=0`).catch(() => null);
    if (r) setMessages((list) => merge(list, r.messages.map(withFormState)));
  }

  function flushFailed() { for (const id of outbox.current.keys()) deliver(id); }

  function send(text, extra = {}) {
    const clientMsgId = uid();
    outbox.current.set(clientMsgId, { clientMsgId, body: text, ...extra });
    setMessages((list) => merge(list, [{ clientMsgId, senderType: 'VISITOR', body: text, state: 'pending', createdAt: new Date().toISOString(), attachmentId: extra.attachmentId, meta: extra.meta }]));
    deliver(clientMsgId);
  }

  async function upload(file) {
    if (!convRef.current) return setBanner('Send a message first, then attach your file.');
    if (file.size > 10 * 1024 * 1024) return setBanner('File is too large (max 10 MB).');
    try {
      setBanner('Uploading…');
      const att = await call('/uploads', { method: 'POST', raw: file, headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-Filename': encodeURIComponent(file.name) } });
      setBanner(null);
      send('', { attachmentId: att.id });
    } catch (e) { setBanner(e.message); }
  }

  // ---------- lifecycle ----------
  useEffect(() => {
    const start = () => boot().catch((e) => { console.warn('[livechat]', e.message); setHidden(true); });
    if (!popout) { start(); return undefined; }
    // Pop-out window: the store page that opened us hands over its visitor session (tag + token) by
    // postMessage, so the same chat continues. Without it we refuse to start (no anonymous use).
    let done = false;
    const onMsg = (e) => {
      const d = e.data;
      if (e.source !== window.opener || !d || d.type !== 'lc-popout-session' || d.key !== storeKey) return;
      if (typeof d.tag !== 'string' || typeof d.token !== 'string' || d.tag.length > 64 || d.token.length > 200) return;
      done = true;
      store.set(`lc_k_${storeKey}`, d.tag);
      store.set(`lc_v_${d.tag}`, d.token);
      start();
    };
    window.addEventListener('message', onMsg);
    if (window.opener) window.opener.postMessage({ type: 'lc-popout-ready', key: storeKey }, '*');
    const t = setTimeout(() => { if (!done) setPopoutError(true); }, 5000);
    return () => { window.removeEventListener('message', onMsg); clearTimeout(t); };
  }, [boot, popout, storeKey]);

  useEffect(() => {
    const onResize = () => setMobile(isMobile());
    const onOnline = () => connect();
    const onVis = () => { if (document.visibilityState === 'visible' && openRef.current && convRef.current && lastSeq.current) sendWs('read', { conversationId: convRef.current.id, seq: lastSeq.current }); };
    window.addEventListener('resize', onResize);
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVis);
    // SPA navigation (Shopify themes with AJAX nav, headless storefronts).
    let last = location.href;
    const nav = () => setTimeout(() => {
      if (location.href === last || !token.current) return;
      last = location.href;
      call('/pageview', { method: 'POST', body: page() }).catch(() => {});
      setHidden(!matchesDisplayRules(cfgRef.current?.displayRules, location.href));
    }, 50);
    const wrap = (k) => { const orig = history[k]; history[k] = function (...a) { const r = orig.apply(this, a); nav(); return r; }; return () => { history[k] = orig; }; };
    const un1 = wrap('pushState'); const un2 = wrap('replaceState');
    window.addEventListener('popstate', nav);
    return () => { window.removeEventListener('resize', onResize); window.removeEventListener('online', onOnline); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('popstate', nav); un1(); un2(); };
  }, [call, connect]);

  // Direct "open chat" link: https://<shop>/#lc-<this store's 8-digit chatLinkId> opens the widget on
  // load, e.g. from a "Chat with us" menu link, email signature or QR code. `open` is a dependency so
  // the listener always closes over the current toggle()/open, never a stale one.
  useEffect(() => {
    const openIfChatLink = () => {
      if (!chatLinkMatches(location.hash, cfg?.chatLinkId) || open) return;
      history.replaceState(null, '', location.pathname + location.search);
      toggle();
    };
    openIfChatLink();
    window.addEventListener('hashchange', openIfChatLink);
    return () => window.removeEventListener('hashchange', openIfChatLink);
  }, [cfg, open]);

  // The "Chat with us" link is usually pasted as a full URL (https://shop.com/#lc-xxxxxxxx), whose path
  // is always "/". Clicking it from any other page is a different path, so the browser does a full
  // navigation to the homepage instead of just changing the hash. Intercept clicks on matching links
  // anywhere on the page and open the widget in place instead, so the link works from any page.
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target && e.target.closest && e.target.closest('a[href*="#lc-"]');
      if (!a) return;
      let url;
      try { url = new URL(a.href, location.href); } catch { return; }
      if (url.origin !== location.origin || !chatLinkMatches(url.hash, cfg?.chatLinkId)) return;
      e.preventDefault();
      if (location.hash) history.replaceState(null, '', location.pathname + location.search);
      if (!open) toggle();
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [cfg, open]);

  // Close chat when clicking outside the chat window or pressing Escape
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      const path = e.composedPath ? e.composedPath() : [e.target];
      const inside = path.some((el) => {
        if (!el || !el.classList) return false;
        return el.classList.contains('lc-panel') || el.classList.contains('lc-launcher');
      });
      if (!inside) {
        setOpen(false);
        store.sset(`lc_open_${storeKey}`, '0');
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        store.sset(`lc_open_${storeKey}`, '0');
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', onPointerDown, true);
    }, 60);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, storeKey]);

  // Fix for iOS Safari/Chrome getting stuck zoomed in after focusing a form field (see preventStuckZoom above).
  useEffect(() => {
    const host = document.getElementById(`livechat-${storeKey}`);
    const root = host?.shadowRoot;
    if (!root) return undefined;
    return preventStuckZoom(root);
  }, [storeKey]);

  // Availability polling while it matters (offline form / no chat yet).
  useEffect(() => {
    if (!cfg || conv) return undefined;
    const t = setInterval(() => call('/availability').then(setAvail).catch(() => {}), 60_000);
    return () => clearInterval(t);
  }, [cfg, conv, call]);

  // Mode decision.
  useEffect(() => {
    if (!cfg) return;
    if (conv) return setMode('chat');
    if (mode === 'offline_sent') return;
    if (!avail.online) return setMode(cfg.offlineBehavior === 'form' ? 'offline' : 'hidden');
    const known = (f) => (f.key === 'name' || f.key === 'email' ? visitor?.[f.key] : visitor?.attributes?.[f.key]?.value);
    const need = cfg.preChatForm.enabled && cfg.preChatForm.fields.some((f) => f.required && !known(f));
    setMode(need ? 'prechat' : 'chat');
  }, [cfg, conv, avail.online, visitor]);

  function popOut() {
    const origin = new URL(api).origin;
    const w = window.open(`${api}/widget/popout?key=${encodeURIComponent(storeKey)}`, `lc_popout_${storeKey}`, 'width=420,height=640');
    if (!w) { setBanner('Your browser blocked the pop-out window. Allow pop-ups for this site and try again.'); return; }
    const onReady = (e) => {
      if (e.source !== w || e.origin !== origin || e.data?.type !== 'lc-popout-ready' || e.data.key !== storeKey) return;
      window.removeEventListener('message', onReady);
      w.postMessage({ type: 'lc-popout-session', key: storeKey, tag: tag.current, token: token.current }, origin);
      setOpen(false);
      store.sset(`lc_open_${storeKey}`, '0');
    };
    window.addEventListener('message', onReady);
    setTimeout(() => window.removeEventListener('message', onReady), 15000);
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    store.sset(`lc_open_${storeKey}`, next ? '1' : '0');
    if (next) {
      setPreview(null);
      setUnread(0);
      const c = convRef.current;
      if (c) {
        // Explicit resumption (visitor reopened an existing conversation) - extends its retention once per page.
        if (!resumed.current) { resumed.current = true; call('/resume', { method: 'POST', body: { conversationId: c.id } }).catch((e) => { if (e.code === 'CONVERSATION_GONE') { setConv(null); setMessages([]); } }); }
        if (lastSeq.current) sendWs('read', { conversationId: c.id, seq: lastSeq.current });
      }
    }
  }

  const Attachment = useMemo(() => function Att({ id }) {
    const [src, setSrc] = useState(null);
    const [info, setInfo] = useState(null);
    useEffect(() => {
      let url;
      fetch(`${api}/api/widget/${storeKey}/files/${id}`, { headers: { 'X-Visitor-Token': token.current } })
        .then(async (r) => { if (!r.ok) throw new Error(); const b = await r.blob(); url = URL.createObjectURL(b); setInfo({ type: b.type, name: (r.headers.get('content-disposition') || '').match(/filename="([^"]+)"/)?.[1] || 'file' }); setSrc(url); })
        .catch(() => setInfo({ error: true }));
      return () => url && URL.revokeObjectURL(url);
    }, [id]);
    if (info?.error) return <span>File unavailable</span>;
    if (!src) return <span>Loading file…</span>;
    return info.type.startsWith('image/')
      ? <a href={src} target="_blank" rel="noopener noreferrer"><img className="lc-img" src={src} alt={info.name} /></a>
      : <a className="lc-file" href={src} download={info.name}>{Icon.file}{info.name}</a>;
  }, [api, storeKey]);

  if (popout && popoutError && !cfg) return <div className="lc-popout-msg">Open the chat from the store's website, then choose "Pop out widget".</div>;
  if (!cfg || hidden || mode === 'hidden') return null;
  if (!matchesDisplayRules(cfg.displayRules, location.href)) return null;
  if ((mobile && !cfg.layout.showOnMobile) || (!mobile && !cfg.layout.showOnDesktop)) return null;

  return (
    <ChatWindow
      cfg={cfg} open={open} onToggle={toggle} mode={mode} online={avail.online} messages={messages} typing={typing} unread={unread}
      agentReadSeq={agentReadSeq} banner={banner} layout={{ mobile, popout }} Attachment={Attachment}
      visitorName={visitor?.name || ''}
      onChangeName={async (name) => { const r = await call('/contact', { method: 'POST', body: { name } }); setVisitor((x) => ({ ...x, ...r.visitor })); }}
      // Transcripts are downloaded (no email needed); the email route stays on the server but isn't offered.
      onEmailTranscript={null}
      onDownloadTranscript={conv ? () => downloadTranscript(`${api}/api/widget/${storeKey}/conversations/${convRef.current.id}/transcript`, token.current) : null}
      soundOn={soundOn}
      onToggleSound={cfg.sound ? () => setSoundOn((v) => { store.set(`lc_sound_${storeKey}`, v ? 'off' : 'on'); return !v; }) : null}
      onEndChat={conv && conv.status !== 'RESOLVED' ? async () => { await call(`/conversations/${convRef.current.id}/end`, { method: 'POST' }); setConv((c) => (c ? { ...c, status: 'RESOLVED' } : c)); setEnded(true); } : null}
      ended={ended} onStartNew={() => setEnded(false)}
      canUpload={!!conv && cfg.behavior?.fileUpload !== false}
      preview={(mobile ? cfg.behavior?.messagePreviewMobile : cfg.behavior?.messagePreviewDesktop) === false ? null : preview}
      onDismissPreview={() => setPreview(null)}
      onSend={(t) => { setBanner(null); send(t); }}
      onRetry={(m) => deliver(m.clientMsgId)}
      onUpload={upload}
      onTyping={(t, draft) => convRef.current && sendWs('typing', {
        conversationId: convRef.current.id, typing: t,
        // Draft text only goes to agents when the store allows typing previews.
        ...(cfg.behavior?.visitorTypingPreview !== false ? { preview: draft } : {}),
      })}
      onPrechat={async (v) => {
        const r = await call('/contact', { method: 'POST', body: { values: v } });
        setVisitor((x) => ({ ...x, ...r.visitor }));
        if (r.conversation) {
          setConv({ id: r.conversation.id, status: r.conversation.status });
          convRef.current = { id: r.conversation.id, status: r.conversation.status };
          lastSeq.current = Math.max(lastSeq.current, r.conversation.lastSeq || 0);
          await syncAfterCreate(r.conversation.id);
        }
        setMode('chat');
        // All answers become the visitor's first message ("Name : …" per line); the server puts the welcome message
        // before it and the "please wait" message after it.
        const details = prechatDetails(cfg.preChatForm?.fields || [], v);
        if (details) send(details, { prechat: true });
      }}
      onOffline={async (v) => {
        const r = await call('/offline', { method: 'POST', body: { ...v, clientMsgId: uid() } });
        setVisitor((x) => ({ ...x, name: v.name, email: v.email }));
        lastSeq.current = r.message.seq;
        setMessages([r.message]);
        setMode('offline_sent');
        setTimeout(() => setConv({ id: r.conversationId, status: 'OPEN' }), 4000);
      }}
      onContact={async (v, msg) => {
        await call('/contact', { method: 'POST', body: { ...v, conversationId: convRef.current?.id } });
        if (msg.id) store.set(`lc_form_${msg.id}`, '1');
        setMessages((list) => list.map((m) => (m === msg || (m.id && m.id === msg.id) ? { ...m, formDone: true } : m)));
        setVisitor((x) => ({ ...x, ...v }));
      }}
    />
  );
}
