// In-process realtime hub. Every push is scoped by storeId (agents) or visitorId (visitors),
// so one store's sockets never receive another store's events.
// Single-node: for several API replicas, put a pub/sub (e.g. Postgres LISTEN/NOTIFY or Redis) behind publish().
import { WebSocketServer } from 'ws';
import { prisma, clock } from './config.js';
import { userFromToken, storeRole } from './lib/auth.js';
import { loadStoreByKey, checkOrigin, getPublishedConfig } from './services/stores.js';
import { findVisitorByToken } from './services/visitors.js';

const agentSockets = new Map(); // storeId -> Set<ws>
const visitorSockets = new Map(); // visitorId -> Set<ws>
const add = (map, k, ws) => (map.get(k) || map.set(k, new Set()).get(k)).add(ws);
const del = (map, k, ws) => { map.get(k)?.delete(ws); if (!map.get(k)?.size) map.delete(k); };
const send = (ws, type, data) => { if (ws.readyState === 1) ws.send(JSON.stringify({ type, data })); };

/** Agents of a store that can see this conversation (AGENT role: unassigned or own). */
export function toAgents(storeId, type, data, conv = null) {
  for (const ws of agentSockets.get(storeId) || []) {
    const role = ws.roles[storeId];
    if (conv && role === 'AGENT' && conv.assigneeId && conv.assigneeId !== ws.user.id) continue;
    send(ws, type, { storeId, ...data });
  }
}

export function toVisitor(visitorId, type, data) {
  for (const ws of visitorSockets.get(visitorId) || []) send(ws, type, data);
}

export function toStoreVisitors(storeId, type, data) {
  for (const set of visitorSockets.values()) {
    for (const ws of set) {
      if (ws.storeId === storeId) send(ws, type, data);
    }
  }
}

export const visitorOnline = (visitorId) => (visitorSockets.get(visitorId)?.size || 0) > 0;

/** userIds with a live socket for the store. */
export function connectedAgentIds(storeId) {
  return new Set([...(agentSockets.get(storeId) || [])].map((ws) => ws.user.id));
}

export async function onlineAgentIds(storeId) {
  const connected = connectedAgentIds(storeId);
  if (!connected.size) return [];
  const rows = await prisma.storeMember.findMany({ where: { storeId, presence: 'ONLINE', userId: { in: [...connected] } }, select: { userId: true } });
  return rows.map((r) => r.userId);
}

/**
 * Store roles are captured when an agent socket connects. Call this whenever a user's access changes
 * (removed from a store, role change, deactivation, sessions revoked) so the socket reconnects and
 * re-authorises, or is refused.
 */
export function disconnectUser(userId) {
  for (const set of agentSockets.values()) for (const ws of set) if (ws.user.id === userId) ws.close(4001, 'Access changed');
}

export function disconnectVisitor(visitorId) {
  for (const ws of visitorSockets.get(visitorId) || []) ws.close(4001, 'Visitor removed');
}

export function closeAll() {
  for (const set of [...agentSockets.values(), ...visitorSockets.values()]) for (const ws of set) ws.terminate();
}

export function attachRealtime(server, { onVisitorEvent }) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024 });

  server.on('upgrade', async (req, socket, head) => {
    try {
      const url = new URL(req.url, 'http://x');
      if (url.pathname === '/ws/agent') {
        const user = await userFromToken(url.searchParams.get('token'));
        if (!user) return reject(socket, 401);
        wss.handleUpgrade(req, socket, head, (ws) => setupAgent(ws, user));
      } else if (url.pathname === '/ws/visitor') {
        const store = await loadStoreByKey(url.searchParams.get('key'));
        if (!store) return reject(socket, 404);
        if (!(await checkOrigin(store, req.headers.origin))) return reject(socket, 403);
        const visitor = await findVisitorByToken(store.id, url.searchParams.get('vt'));
        if (!visitor) return reject(socket, 401);
        wss.handleUpgrade(req, socket, head, (ws) => setupVisitor(ws, store, visitor));
      } else reject(socket, 404);
    } catch (e) {
      console.error('ws upgrade', e);
      reject(socket, 500);
    }
  });

  function setupAgent(ws, user) {
    ws.user = user;
    ws.roles = {};
    const storeIds = user.role === 'SUPER_ADMIN' ? null : user.memberships.map((m) => m.storeId);
    // Super admins subscribe explicitly to the stores they open; members to all of theirs.
    const subscribe = (id) => {
      const role = storeRole(user, id);
      if (!role) return;
      ws.roles[id] = role;
      add(agentSockets, id, ws);
      toAgents(id, 'presence', { userId: user.id, connected: true });
    };
    (storeIds || []).forEach(subscribe);
    alive(ws);
    ws.on('message', async (raw) => {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }
      const { type, data = {} } = msg;
      if (type === 'subscribe' && typeof data.storeId === 'string') subscribe(data.storeId);
      if (type === 'typing' && ws.roles[data.storeId]) {
        const conv = await prisma.conversation.findFirst({ where: { id: String(data.conversationId), storeId: data.storeId } });
        // Agents may only type into chats they can see (unassigned or their own).
        const hidden = ws.roles[data.storeId] === 'AGENT' && conv?.assigneeId && conv.assigneeId !== user.id;
        if (conv && !hidden && !data.note) {
          // Stores can turn off the "agent is typing" indicator for visitors.
          const cfg = await getPublishedConfig(await prisma.store.findUnique({ where: { id: conv.storeId } }));
          if (cfg.behavior?.agentTyping) toVisitor(conv.visitorId, 'typing', { conversationId: conv.id, from: 'agent', typing: !!data.typing });
        }
      }
    });
    ws.on('close', () => {
      for (const id of Object.keys(ws.roles)) {
        del(agentSockets, id, ws);
        if (!connectedAgentIds(id).has(user.id)) toAgents(id, 'presence', { userId: user.id, connected: false });
      }
    });
    send(ws, 'ready', { userId: user.id });
  }

  function setupVisitor(ws, store, visitor) {
    ws.storeId = store.id;
    ws.visitorId = visitor.id;
    add(visitorSockets, visitor.id, ws);
    alive(ws);
    toAgents(store.id, 'visitor_online', { visitorId: visitor.id, online: true });
    ws.on('message', async (raw) => {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }
      try {
        await onVisitorEvent(store, visitor, msg.type, msg.data || {});
      } catch (e) {
        if (!e.status) console.error('visitor ws', e);
      }
    });
    ws.on('close', () => {
      del(visitorSockets, visitor.id, ws);
      if (!visitorOnline(visitor.id)) toAgents(store.id, 'visitor_online', { visitorId: visitor.id, online: false });
    });
    send(ws, 'ready', { visitorId: visitor.id, at: clock.now() });
  }

  // Drop dead connections so presence stays truthful.
  const timer = setInterval(() => {
    for (const ws of wss.clients) {
      if (ws.isAlive === false) { ws.terminate(); continue; }
      ws.isAlive = false;
      ws.ping();
    }
  }, 30_000).unref();
  wss.on('close', () => clearInterval(timer));
  return wss;
}

function alive(ws) {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
}

function reject(socket, code) {
  socket.write(`HTTP/1.1 ${code} ${code === 401 ? 'Unauthorized' : code === 403 ? 'Forbidden' : 'Error'}\r\n\r\n`);
  socket.destroy();
}
