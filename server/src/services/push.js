// Push notifications to the mobile app via the Expo Push API (https://exp.host). Runs as a durable
// job so a slow/failed push never delays chat. Same audience rules as toAgents(): active store
// members (AGENT role only for unassigned or own chats) plus the main admin.
import { prisma } from '../config.js';
import { registerJob } from './jobs.js';

export const EXPO_URL = 'https://exp.host/--/api/v2/push/send';
const RANK = { AGENT: 1, SUPERVISOR: 2, ADMIN: 3, OWNER: 4 };

export async function recipients(conv) {
  const members = await prisma.storeMember.findMany({ where: { storeId: conv.storeId, user: { isActive: true } }, select: { userId: true, role: true } });
  const ids = new Set(members.filter((m) => RANK[m.role] >= RANK.SUPERVISOR || !conv.assigneeId || conv.assigneeId === m.userId).map((m) => m.userId));
  for (const u of await prisma.user.findMany({ where: { role: 'SUPER_ADMIN', isActive: true }, select: { id: true } })) ids.add(u.id);
  return prisma.pushDevice.findMany({ where: { userId: { in: [...ids] } } });
}

registerJob('push_message', async ({ conversationId, messageId, isNew }) => {
  const [conv, msg] = await Promise.all([
    prisma.conversation.findUnique({ where: { id: conversationId }, include: { visitor: true, store: { select: { name: true } } } }),
    prisma.message.findUnique({ where: { id: messageId } }),
  ]);
  if (!conv || !msg || conv.folder === 'SPAM') return;
  const devices = await recipients(conv);
  if (!devices.length) return;
  const who = conv.visitor?.name || conv.visitor?.email || 'Visitor';
  const body = (msg.body || 'Sent an attachment').slice(0, 180);
  const messages = devices.map((d) => ({
    to: d.token, sound: 'default', priority: 'high', channelId: 'chats',
    title: isNew ? `New chat on ${conv.store.name}: ${who}` : `${who} · ${conv.store.name}`, body,
    data: { conversationId: conv.id, storeId: conv.storeId },
  }));
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json', ...(process.env.EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}) };
  for (let i = 0; i < messages.length; i += 100) { // Expo accepts up to 100 per request
    const batch = messages.slice(i, i + 100);
    const res = await fetch(EXPO_URL, { method: 'POST', headers, body: JSON.stringify(batch), signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`Expo push HTTP ${res.status}`); // job retries with backoff
    const { data = [] } = await res.json();
    // Uninstalled apps / expired tokens: forget them so we stop sending.
    const dead = data.map((t, j) => (t.details?.error === 'DeviceNotRegistered' ? batch[j].to : null)).filter(Boolean);
    if (dead.length) await prisma.pushDevice.deleteMany({ where: { token: { in: dead } } });
  }
});
