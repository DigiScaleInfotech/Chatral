// One agent WebSocket for the whole dashboard, with backoff reconnect. Consumers subscribe to events;
// on reconnect they get a 'reconnected' event so they can re-fetch anything missed.
const listeners = new Set();
let ws = null;
let retry = 0;
let stopped = false;
const subscribed = new Set();

export function connectSocket() {
  stopped = false;
  const token = localStorage.getItem('token');
  if (!token || (ws && ws.readyState <= 1)) return;
  const rawApiUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || (typeof location !== 'undefined' && (location.host.endsWith('.vercel.app') || (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1')) ? 'https://chatral-backend.onrender.com' : '');
  let wsUrl;
  if (rawApiUrl) {
    try {
      const parsed = new URL(rawApiUrl);
      const wsProto = parsed.protocol === 'https:' ? 'wss' : 'ws';
      wsUrl = `${wsProto}://${parsed.host}/ws/agent?token=${encodeURIComponent(token)}`;
    } catch {
      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      wsUrl = `${proto}://${location.host}/ws/agent?token=${encodeURIComponent(token)}`;
    }
  } else {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    wsUrl = `${proto}://${location.host}/ws/agent?token=${encodeURIComponent(token)}`;
  }
  const sock = new WebSocket(wsUrl);
  ws = sock;
  sock.onopen = () => {
    const was = retry;
    retry = 0;
    for (const id of subscribed) sock.send(JSON.stringify({ type: 'subscribe', data: { storeId: id } }));
    emit(was ? 'reconnected' : 'connected', {});
  };
  sock.onmessage = (e) => {
    try { const ev = JSON.parse(e.data); emit(ev.type, ev.data || {}); } catch { /* ignore */ }
  };
  sock.onclose = () => {
    if (ws !== sock) return;
    ws = null;
    emit('disconnected', {});
    if (!stopped) setTimeout(connectSocket, Math.min(30_000, 1000 * 2 ** retry++));
  };
}

export function disconnectSocket() { stopped = true; ws?.close(); ws = null; }

/** Super admins aren't members of every store; they subscribe to the one they're viewing. */
export function subscribeStore(storeId) {
  subscribed.add(storeId);
  if (ws?.readyState === 1) ws.send(JSON.stringify({ type: 'subscribe', data: { storeId } }));
}

export function sendSocket(type, data) { if (ws?.readyState === 1) ws.send(JSON.stringify({ type, data })); }

export function onSocket(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit(type, data) { for (const fn of listeners) fn(type, data); }
