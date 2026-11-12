// Store administration. Every /stores/:storeId route passes requireStore(minRole), and every query
// inside is additionally filtered by storeId, so ids from another store are simply "not found".
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { DateTime } from 'luxon';
import { prisma, clock, config, DAY_MS } from '../config.js';
import { requireAuth, requireStore, requireSuper, isSuper, RANK, storeRole } from '../lib/auth.js';
import { asyncRoute, audit, httpError, newPublicKey, newChatLinkId, hostOf, randomToken } from '../lib/util.js';
import { encryptJson } from '../lib/crypto.js';
import { DEFAULT_WIDGET_CONFIG, widgetConfigSchema, getPublishedConfig, withFieldTypes } from '../services/stores.js';
import { emailConfigured, assertPublicUrl, WEBHOOK_EVENTS, queueWebhook, sendEmailNow, emailStatus } from '../services/notify.js';
import { normalizeShopDomain, sealToken, shopifyConnected, testShopify } from '../services/shopify.js';
import { enqueue } from '../services/jobs.js';
import { connectedAgentIds, toAgents, toStoreVisitors, disconnectUser, disconnectVisitor } from '../realtime.js';

const r = Router();
r.use(requireAuth);

const domain = z.string().trim().toLowerCase().max(200).transform(hostOf).transform((h) => h.replace(/\.$/, ''))
  .refine((h) => /^(\*\.)?[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(h) || h === 'localhost' || h === '127.0.0.1', 'is not a valid domain');
const emailList = z.array(z.string().trim().toLowerCase().email()).max(20);
const storePublic = (s, role) => ({
  id: s.id, name: s.name, publicKey: s.publicKey, chatLinkId: s.chatLinkId, allowedOrigins: s.allowedOrigins, timezone: s.timezone, isActive: s.isActive, widgetEnabled: s.widgetEnabled,
  retentionDays: s.retentionDays, publishedVersion: s.publishedVersion, createdAt: s.createdAt,
  ...(RANK[role] >= RANK.ADMIN ? {
    notifyEmails: s.notifyEmails, emailOnNewChat: s.emailOnNewChat, emailOnOffline: s.emailOnOffline, hasOwnSmtp: !!s.emailConfig,
    previousKeyExpires: s.previousKeyExpires, lastWidgetSeenAt: s.lastWidgetSeenAt, lastWidgetOrigin: s.lastWidgetOrigin,
  } : {}),
});

// ---------- Stores ----------

r.get('/stores', asyncRoute(async (req, res) => {
  const where = isSuper(req.user) ? {} : { id: { in: req.user.memberships.map((m) => m.storeId) } };
  const stores = await prisma.store.findMany({ where, orderBy: { name: 'asc' } });
  res.json(stores.map((s) => ({ ...storePublic(s, storeRole(req.user, s.id)), myRole: storeRole(req.user, s.id) })));
}));

const createStoreSchema = z.object({
  name: z.string().trim().min(1).max(80),
  allowedOrigins: z.array(domain).max(20).default([]),
  timezone: z.string().refine((tz) => DateTime.local().setZone(tz).isValid, 'unknown timezone').default('UTC'),
  ownerEmail: z.string().trim().toLowerCase().email().optional(),
});

/** Retries on the astronomically rare collision (8-digit keyspace); `tx` so it sees in-transaction inserts too. */
async function uniqueChatLinkId(tx) {
  for (let i = 0; i < 10; i++) {
    const id = newChatLinkId();
    if (!(await tx.store.findFirst({ where: { chatLinkId: id }, select: { id: true } }))) return id;
  }
  throw httpError(500, 'Could not generate a unique chat link id, please try again');
}

r.post('/stores', requireSuper, asyncRoute(async (req, res) => {
  const input = createStoreSchema.parse(req.body);
  const store = await prisma.$transaction(async (tx) => {
    const s = await tx.store.create({ data: { name: input.name, allowedOrigins: input.allowedOrigins, timezone: input.timezone, publicKey: newPublicKey(), chatLinkId: await uniqueChatLinkId(tx) } });
    const cfg = { ...DEFAULT_WIDGET_CONFIG, businessHours: { ...DEFAULT_WIDGET_CONFIG.businessHours, timezone: input.timezone } };
    await tx.widgetConfig.create({ data: { storeId: s.id, version: 0, status: 'DRAFT', config: cfg } });
    await tx.widgetConfig.create({ data: { storeId: s.id, version: 1, status: 'PUBLISHED', config: cfg, note: 'Initial version', createdById: req.user.id } });
    if (input.ownerEmail) {
      const owner = await tx.user.findUnique({ where: { email: input.ownerEmail } });
      if (!owner) throw httpError(400, `No user with email ${input.ownerEmail}. Create the user first.`);
      // Two roles only (main admin + agents): the optional user joins the new store as an agent.
      await tx.storeMember.create({ data: { storeId: s.id, userId: owner.id, role: 'AGENT' } });
    }
    return tx.store.update({ where: { id: s.id }, data: { publishedVersion: 1 } });
  });
  await audit(req, 'store.created', { storeId: store.id, target: store.name });
  res.status(201).json(storePublic(store, 'SUPER'));
}));

r.get('/stores/:storeId', requireStore('AGENT'), asyncRoute(async (req, res) => {
  const s = await prisma.store.findUnique({ where: { id: req.params.storeId } });
  if (!s) throw httpError(404, 'Store not found');
  res.json({ ...storePublic(s, req.storeRole), myRole: req.storeRole });
}));

const smtpSchema = z.object({ host: z.string().trim().min(1), port: z.number().int().min(1).max(65535), secure: z.boolean(), user: z.string().trim().min(1), pass: z.string().min(1), from: z.string().trim().max(200).optional() });
const updateStoreSchema = z.object({
  name: z.string().trim().min(1).max(80),
  allowedOrigins: z.array(domain).max(20),
  timezone: z.string().refine((tz) => DateTime.local().setZone(tz).isValid, 'unknown timezone'),
  notifyEmails: emailList,
  emailOnNewChat: z.boolean(),
  emailOnOffline: z.boolean(),
  isActive: z.boolean(),
  retentionDays: z.number().int().min(1).max(365),
  smtp: smtpSchema.nullable(),
}).partial();

r.patch('/stores/:storeId', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const input = updateStoreSchema.parse(req.body);
  if ((input.retentionDays !== undefined || input.isActive !== undefined) && RANK[req.storeRole] < RANK.OWNER) throw httpError(403, 'Only the store owner can change retention or deactivate the store');
  const { smtp, ...data } = input;
  if (smtp !== undefined) data.emailConfig = smtp ? encryptJson(smtp) : null;
  const before = await prisma.store.findUnique({ where: { id: req.params.storeId } });
  const store = await prisma.store.update({ where: { id: req.params.storeId }, data });
  // Retention change applies to existing conversations: recompute their deadline from lastActivityAt.
  if (input.retentionDays !== undefined && input.retentionDays !== before.retentionDays) {
    await prisma.$executeRaw`UPDATE "Conversation" SET "expiresAt" = "lastActivityAt" + make_interval(days => ${input.retentionDays}::int) WHERE "storeId" = ${store.id}`;
  }
  await audit(req, 'store.updated', { storeId: store.id, meta: { fields: Object.keys(input) } });
  res.json(storePublic(store, req.storeRole));
}));

r.delete('/stores/:storeId', requireSuper, asyncRoute(async (req, res) => {
  const { confirmName } = z.object({ confirmName: z.string() }).parse(req.body || {});
  const store = await prisma.store.findUnique({ where: { id: req.params.storeId } });
  if (!store) throw httpError(404, 'Store not found');
  if (confirmName !== store.name) throw httpError(400, 'Type the store name exactly to confirm deletion');
  const files = await prisma.attachment.findMany({ where: { storeId: store.id }, select: { storagePath: true } });
  await prisma.$transaction(async (tx) => {
    for (const f of files) await enqueue('delete_file', { storagePath: f.storagePath }, { tx });
    await tx.job.updateMany({ where: { storeId: store.id, status: 'PENDING', type: { not: 'delete_file' } }, data: { status: 'CANCELLED' } });
    await tx.usageDaily.deleteMany({ where: { storeId: store.id } });
    await tx.store.delete({ where: { id: store.id } });
  });
  await audit(req, 'store.deleted', { target: store.name, meta: { storeId: store.id } });
  res.json({ ok: true });
}));

// Key rotation: new key immediately; the old one keeps working for `graceDays` so the site can be updated.
r.post('/stores/:storeId/rotate-key', requireStore('OWNER'), asyncRoute(async (req, res) => {
  const { graceDays } = z.object({ graceDays: z.number().int().min(0).max(30).default(7) }).parse(req.body || {});
  const old = await prisma.store.findUnique({ where: { id: req.params.storeId } });
  const store = await prisma.store.update({
    where: { id: old.id },
    data: { publicKey: newPublicKey(), previousKey: graceDays ? old.publicKey : null, previousKeyExpires: graceDays ? new Date(clock.now().getTime() + graceDays * DAY_MS) : null },
  });
  await audit(req, 'store.key_rotated', { storeId: store.id, meta: { graceDays } });
  res.json(storePublic(store, req.storeRole));
}));

r.get('/stores/:storeId/diagnostics', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const s = await prisma.store.findUnique({ where: { id: req.params.storeId } });
  const [members, cfg] = await Promise.all([prisma.storeMember.count({ where: { storeId: s.id } }), getPublishedConfig(s)]);
  const now = clock.now();
  const seenRecently = s.lastWidgetSeenAt && now - s.lastWidgetSeenAt < 7 * DAY_MS;
  const checks = [
    { key: 'active', ok: s.isActive, label: 'Store is active', fix: 'Turn the store on in Settings.' },
    { key: 'domains', ok: s.allowedOrigins.length > 0, warn: false, label: s.allowedOrigins.length ? `Allowed domains: ${s.allowedOrigins.join(', ')}` : 'No allowed domains - the widget is blocked on every website until you add your shop domain', fix: 'Add your shop domain (e.g. violetjewels.com) in Settings → Installation → Allowed Website Domains.' },
    { key: 'installed', ok: !!seenRecently, label: s.lastWidgetSeenAt ? `Widget last loaded ${DateTime.fromJSDate(s.lastWidgetSeenAt).toRelative()} from ${s.lastWidgetOrigin || 'unknown origin'}` : 'Widget has never loaded', fix: 'Paste the snippet before </body> (Shopify: theme.liquid) and open your site.' },
    { key: 'rejected', ok: !(s.lastRejectedAt && now - s.lastRejectedAt < DAY_MS), warn: true, label: s.lastRejectedAt ? `Blocked a load from ${s.lastRejectedOrigin} ${DateTime.fromJSDate(s.lastRejectedAt).toRelative()}` : 'No blocked origins', fix: `If ${s.lastRejectedOrigin || 'that domain'} is yours, add it to the allowed domains.` },
    { key: 'published', ok: s.publishedVersion != null, label: s.publishedVersion != null ? `Published widget version v${s.publishedVersion}` : 'Widget not published', fix: 'Publish the widget design.' },
    { key: 'agents', ok: members > 0, label: `${members} team member(s)`, fix: 'Invite at least one agent.' },
    { key: 'online', ok: connectedAgentIds(s.id).size > 0, warn: true, label: `${connectedAgentIds(s.id).size} agent(s) connected now`, fix: 'Visitors see the offline form while nobody is online.' },
    { key: 'hours', ok: true, label: cfg.businessHours.enabled ? `Business hours on (${cfg.businessHours.timezone})` : 'Business hours off (always open when agents are online)' },
    { key: 'email', ok: emailConfigured(s), warn: true, label: emailConfigured(s) ? 'Email notifications can be sent' : 'No SMTP configured - email notifications are disabled', fix: 'Add SMTP in Settings → Notifications or set SMTP_* on the server.' },
    { key: 'oldkey', ok: !(s.previousKeyExpires > now), warn: true, label: s.previousKeyExpires > now ? `Old key still accepted until ${s.previousKeyExpires.toISOString().slice(0, 10)}` : 'No old key in grace period', fix: 'Update the snippet on your site with the new key.' },
  ];
  res.json({ checks, snippet: snippetFor(s.publicKey), shopify: shopifyFor(s.publicKey), chatLink: chatLinkFor(s.allowedOrigins, s.chatLinkId) });
}));

export const snippetFor = (key) => `<script src="${config.apiUrl}/widget/chat.js" data-store="${key}" async></script>`;
const shopifyFor = (key) => `{% comment %} Live chat {% endcomment %}\n<script src="${config.apiUrl}/widget/chat.js" data-store="${key}" async></script>`;
// Opens the chat widget automatically when visited, from any page on the store's own site - add it as the
// URL of a "Chat with us" link, button, QR code, etc. Needs at least one allowed domain to build a real URL.
export const chatLinkFor = (allowedOrigins, chatLinkId) => (allowedOrigins[0] ? `https://${hostOf(allowedOrigins[0]).replace(/^\*\./, '')}/#lc-${chatLinkId}` : null);

// ---------- Presence / own settings ----------

r.put('/stores/:storeId/presence', requireStore('AGENT'), asyncRoute(async (req, res) => {
  const { presence } = z.object({ presence: z.enum(['ONLINE', 'AWAY', 'OFFLINE']) }).parse(req.body);
  if (isSuper(req.user) && !req.user.memberships.some((m) => m.storeId === req.params.storeId)) throw httpError(400, 'Join the store as a member to take chats');
  await prisma.storeMember.update({ where: { userId_storeId: { userId: req.user.id, storeId: req.params.storeId } }, data: { presence } });
  toAgents(req.params.storeId, 'presence', { userId: req.user.id, presence });
  res.json({ presence });
}));

r.patch('/stores/:storeId/me', requireStore('AGENT'), asyncRoute(async (req, res) => {
  const data = z.object({ emailNotify: z.boolean() }).parse(req.body);
  if (isSuper(req.user) && !req.user.memberships.some((m) => m.storeId === req.params.storeId)) throw httpError(400, 'You are not a member of this store');
  await prisma.storeMember.update({ where: { userId_storeId: { userId: req.user.id, storeId: req.params.storeId } }, data });
  res.json(data);
}));

// ---------- Members ----------

r.get('/stores/:storeId/members', requireStore('AGENT'), asyncRoute(async (req, res) => {
  const rows = await prisma.storeMember.findMany({ where: { storeId: req.params.storeId }, include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, isActive: true } } }, orderBy: { role: 'desc' } });
  const connected = connectedAgentIds(req.params.storeId);
  res.json(rows.map((m) => ({ userId: m.userId, role: m.role, presence: m.presence, connected: connected.has(m.userId), maxChats: m.maxChats, emailNotify: m.emailNotify, ...m.user })));
}));

const assertCanGrant = (req, role) => {
  if (RANK[req.storeRole] < RANK.OWNER && RANK[role] >= RANK.OWNER) throw httpError(403, 'Only owners can grant or change the Owner role');
};

r.post('/stores/:storeId/members', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const input = z.object({
    email: z.string().trim().toLowerCase().email(),
    name: z.string().trim().min(1).max(80).optional(),
    password: z.string().min(10, 'must be at least 10 characters').max(200).optional(),
    // Two roles only: one main admin (super admin) and agents. Store members are always agents.
    role: z.enum(['AGENT'], { message: 'Team members can only be agents' }).default('AGENT'),
    maxChats: z.number().int().min(1).max(100).default(10),
  }).parse(req.body);
  assertCanGrant(req, input.role);
  let user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    if (!input.name || !input.password) throw httpError(400, 'New user: please enter a name and an initial password');
    user = await prisma.user.create({ data: { email: input.email, name: input.name, passwordHash: await bcrypt.hash(input.password, 12) } });
  }
  await prisma.storeMember.create({ data: { userId: user.id, storeId: req.params.storeId, role: input.role, maxChats: input.maxChats } });
  await audit(req, 'member.added', { storeId: req.params.storeId, target: user.email, meta: { role: input.role } });
  res.status(201).json({ userId: user.id });
}));

r.patch('/stores/:storeId/members/:userId', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const input = z.object({ role: z.enum(['AGENT'], { message: 'Team members can only be agents' }), maxChats: z.number().int().min(1).max(100) }).partial().parse(req.body);
  const m = await prisma.storeMember.findUnique({ where: { userId_storeId: { userId: req.params.userId, storeId: req.params.storeId } } });
  if (!m) throw httpError(404, 'Member not found');
  if (m.role === 'OWNER' || input.role) assertCanGrant(req, input.role === 'OWNER' || m.role === 'OWNER' ? 'OWNER' : input.role);
  if (m.role === 'OWNER' && input.role && input.role !== 'OWNER') await assertNotLastOwner(req.params.storeId);
  await prisma.storeMember.update({ where: { userId_storeId: { userId: m.userId, storeId: m.storeId } }, data: input });
  if (input.role && input.role !== m.role) disconnectUser(m.userId);
  await audit(req, 'member.updated', { storeId: req.params.storeId, target: m.userId, meta: input });
  res.json({ ok: true });
}));

async function assertNotLastOwner(storeId) {
  if ((await prisma.storeMember.count({ where: { storeId, role: 'OWNER' } })) <= 1) throw httpError(400, 'A store must keep at least one owner');
}

r.delete('/stores/:storeId/members/:userId', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const m = await prisma.storeMember.findUnique({ where: { userId_storeId: { userId: req.params.userId, storeId: req.params.storeId } } });
  if (!m) throw httpError(404, 'Member not found');
  if (m.role === 'OWNER') { assertCanGrant(req, 'OWNER'); await assertNotLastOwner(m.storeId); }
  await prisma.$transaction([
    prisma.conversation.updateMany({ where: { storeId: m.storeId, assigneeId: m.userId, status: { not: 'RESOLVED' } }, data: { assigneeId: null } }),
    prisma.storeMember.delete({ where: { userId_storeId: { userId: m.userId, storeId: m.storeId } } }),
  ]);
  disconnectUser(m.userId);
  await audit(req, 'member.removed', { storeId: m.storeId, target: m.userId });
  res.json({ ok: true });
}));

// Master widget switch (main admin): hides the widget on every website at once; all store settings are kept.
r.put('/platform/stores/:storeId/widget-enabled', requireSuper, asyncRoute(async (req, res) => {
  const { enabled } = z.object({ enabled: z.boolean() }).parse(req.body);
  const s = await prisma.store.update({ where: { id: req.params.storeId }, data: { widgetEnabled: enabled } }).catch(() => null);
  if (!s) throw httpError(404, 'Store not found');
  await audit(req, enabled ? 'widget.enabled' : 'widget.disabled', { storeId: s.id });
  res.json({ ok: true, widgetEnabled: s.widgetEnabled });
}));

// ---------- Platform users (super admin) ----------

r.get('/users', requireSuper, asyncRoute(async (req, res) => {
  const users = await prisma.user.findMany({ include: { memberships: { include: { store: { select: { name: true } } } } }, orderBy: { createdAt: 'asc' } });
  res.json(users.map((u) => ({ id: u.id, email: u.email, name: u.name, role: u.role, isActive: u.isActive, createdAt: u.createdAt, memberships: u.memberships.map((m) => ({ storeId: m.storeId, storeName: m.store.name, role: m.role })) })));
}));

const storeIdsSchema = z.array(z.string().min(1).max(64)).max(500);

/** Agent store access: add the ticked stores as AGENT, remove agent memberships that were unticked. Other roles are left alone. */
async function syncAgentStores(req, userId, storeIds) {
  const wanted = new Set(storeIds);
  const valid = new Set((await prisma.store.findMany({ where: { id: { in: [...wanted] } }, select: { id: true } })).map((s) => s.id));
  if (valid.size !== wanted.size) throw httpError(400, 'Unknown store');
  const current = await prisma.storeMember.findMany({ where: { userId } });
  const add = [...wanted].filter((id) => !current.some((m) => m.storeId === id));
  const remove = current.filter((m) => m.role === 'AGENT' && !wanted.has(m.storeId));
  await prisma.$transaction([
    ...add.map((storeId) => prisma.storeMember.create({ data: { userId, storeId, role: 'AGENT' } })),
    ...remove.flatMap((m) => [
      prisma.conversation.updateMany({ where: { storeId: m.storeId, assigneeId: userId, status: { not: 'RESOLVED' } }, data: { assigneeId: null } }),
      prisma.storeMember.delete({ where: { userId_storeId: { userId, storeId: m.storeId } } }),
    ]),
  ]);
  if (add.length || remove.length) {
    disconnectUser(userId); // reconnects with the new store list
    await audit(req, 'user.stores', { target: userId, meta: { added: add, removed: remove.map((m) => m.storeId) } });
  }
}

r.post('/users', requireSuper, asyncRoute(async (req, res) => {
  const input = z.object({ email: z.string().trim().toLowerCase().email(), name: z.string().trim().min(1).max(80), password: z.string().min(10).max(200), role: z.enum(['USER'], { message: 'There is only one main admin; new users are agents' }).default('USER'), storeIds: storeIdsSchema.default([]) }).parse(req.body);
  const u = await prisma.user.create({ data: { email: input.email, name: input.name, role: input.role, passwordHash: await bcrypt.hash(input.password, 12) } });
  await audit(req, 'user.created', { target: u.email, meta: { role: u.role } });
  await syncAgentStores(req, u.id, input.storeIds);
  res.status(201).json({ id: u.id });
}));

r.patch('/users/:id', requireSuper, asyncRoute(async (req, res) => {
  const input = z.object({ name: z.string().trim().min(1).max(80), isActive: z.boolean(), role: z.enum(['SUPER_ADMIN', 'USER']), password: z.string().min(10).max(200), storeIds: storeIdsSchema }).partial().parse(req.body);
  if (req.params.id === req.user.id && (input.isActive === false || input.role === 'USER')) throw httpError(400, 'You cannot demote or deactivate yourself');
  if (input.role === 'SUPER_ADMIN' && await prisma.user.count({ where: { role: 'SUPER_ADMIN', id: { not: req.params.id } } })) {
    throw httpError(409, 'There is already a main admin. Only one is allowed.');
  }
  const { password, storeIds, ...data } = input;
  if (password) data.passwordHash = await bcrypt.hash(password, 12);
  if (password || input.isActive === false || input.role) data.tokenVersion = { increment: 1 };
  await prisma.user.update({ where: { id: req.params.id }, data });
  if (data.tokenVersion) disconnectUser(req.params.id);
  if (storeIds) await syncAgentStores(req, req.params.id, storeIds);
  await audit(req, 'user.updated', { target: req.params.id, meta: { fields: Object.keys(input) } });
  res.json({ ok: true });
}));

// Permanently delete a user account. Store data stays: memberships go (FK cascade), their
// conversations become unassigned, messages keep the sender name, audit rows keep the id.
r.delete('/users/:id', requireSuper, asyncRoute(async (req, res) => {
  if (req.params.id === req.user.id) throw httpError(400, 'You cannot delete your own account');
  const deleted = await prisma.$transaction(async (tx) => {
    // Serialise deletions so two admins can't remove the last super admin concurrently.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('platform:user-delete'))`;
    const user = await tx.user.findUnique({ where: { id: req.params.id }, include: { memberships: { include: { store: { select: { name: true } } } } } });
    if (!user) throw httpError(404, 'User not found');
    if (user.role === 'SUPER_ADMIN' && (await tx.user.count({ where: { role: 'SUPER_ADMIN', isActive: true, id: { not: user.id } } })) === 0) {
      throw httpError(409, 'This is the last active super admin. Make someone else a super admin first.');
    }
    const soleOwnerOf = [];
    for (const m of user.memberships.filter((x) => x.role === 'OWNER')) {
      if ((await tx.storeMember.count({ where: { storeId: m.storeId, role: 'OWNER' } })) === 1) soleOwnerOf.push(m.store.name);
    }
    if (soleOwnerOf.length) throw httpError(409, `${user.name} is the only owner of ${soleOwnerOf.join(', ')}. Assign another owner first.`);
    await tx.conversation.updateMany({ where: { assigneeId: user.id }, data: { assigneeId: null } });
    // Private shortcuts are personal and unusable by anyone else once the owner is gone.
    await tx.savedReply.deleteMany({ where: { ownerId: user.id, access: 'PRIVATE' } });
    await tx.user.delete({ where: { id: user.id } });
    return user;
  });
  disconnectUser(deleted.id);
  await audit(req, 'user.deleted', { target: deleted.email, meta: { userId: deleted.id, role: deleted.role, stores: deleted.memberships.map((m) => m.storeId) } });
  res.json({ ok: true });
}));

// ---------- Widget config: draft / publish / versions ----------

r.get('/stores/:storeId/widget', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const storeId = req.params.storeId;
  const [store, draft, versions] = await Promise.all([
    prisma.store.findUnique({ where: { id: storeId } }),
    prisma.widgetConfig.findUnique({ where: { storeId_version: { storeId, version: 0 } } }),
    prisma.widgetConfig.findMany({ where: { storeId, status: 'PUBLISHED' }, orderBy: { version: 'desc' }, select: { version: true, note: true, createdAt: true, createdById: true } }),
  ]);
  const published = await getPublishedConfig(store);
  const draftCfg = draft ? withFieldTypes({ ...DEFAULT_WIDGET_CONFIG, ...draft.config }) : published;
  res.json({ draft: draftCfg, published, publishedVersion: store.publishedVersion, hasUnpublished: JSON.stringify(draftCfg) !== JSON.stringify(published), versions, publicKey: store.publicKey });
}));

r.put('/stores/:storeId/widget/draft', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const cfg = widgetConfigSchema.parse(req.body);
  const storeId = req.params.storeId;
  await prisma.widgetConfig.upsert({
    where: { storeId_version: { storeId, version: 0 } },
    create: { storeId, version: 0, status: 'DRAFT', config: cfg, createdById: req.user.id },
    update: { config: cfg, createdById: req.user.id },
  });
  res.json({ ok: true });
}));

r.post('/stores/:storeId/widget/publish', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const { note } = z.object({ note: z.string().trim().max(200).optional() }).parse(req.body || {});
  const storeId = req.params.storeId;
  const { version, cfg } = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'publish:' + storeId}))`;
    const draft = await tx.widgetConfig.findUnique({ where: { storeId_version: { storeId, version: 0 } } });
    if (!draft) throw httpError(400, 'Nothing to publish');
    const cfg = widgetConfigSchema.parse({ ...DEFAULT_WIDGET_CONFIG, ...draft.config });
    const last = await tx.widgetConfig.findFirst({ where: { storeId }, orderBy: { version: 'desc' } });
    const v = (last?.version || 0) + 1;
    await tx.widgetConfig.create({ data: { storeId, version: v, status: 'PUBLISHED', config: cfg, note, createdById: req.user.id } });
    await tx.store.update({ where: { id: storeId }, data: { publishedVersion: v } });
    return { version: v, cfg };
  });
  toStoreVisitors(storeId, 'config_updated', { config: cfg });
  toAgents(storeId, 'widget_published', { version, config: cfg });
  await audit(req, 'widget.published', { storeId, meta: { version } });
  res.json({ version });
}));

r.post('/stores/:storeId/widget/restore/:version', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const storeId = req.params.storeId;
  const row = await prisma.widgetConfig.findFirst({ where: { storeId, version: Number(req.params.version), status: 'PUBLISHED' } });
  if (!row) throw httpError(404, 'Version not found');
  await prisma.widgetConfig.upsert({ where: { storeId_version: { storeId, version: 0 } }, create: { storeId, version: 0, status: 'DRAFT', config: row.config }, update: { config: row.config } });
  res.json({ draft: withFieldTypes({ ...DEFAULT_WIDGET_CONFIG, ...row.config }) });
}));

// Clear old published versions. Keeps the live version (store.publishedVersion) and the draft, so the
// storefront widget and the editor are unaffected; only the history list gets shorter.
r.delete('/stores/:storeId/widget/versions', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const storeId = req.params.storeId;
  const removed = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'publish:' + storeId}))`;
    const store = await tx.store.findUnique({ where: { id: storeId }, select: { publishedVersion: true } });
    if (store.publishedVersion == null) return 0; // nothing live to protect: refuse to guess
    const r2 = await tx.widgetConfig.deleteMany({ where: { storeId, status: 'PUBLISHED', version: { notIn: [0, store.publishedVersion] } } });
    return r2.count;
  });
  await audit(req, 'widget.versions_cleared', { storeId, meta: { removed } });
  const versions = await prisma.widgetConfig.findMany({ where: { storeId, status: 'PUBLISHED' }, orderBy: { version: 'desc' }, select: { version: true, note: true, createdAt: true, createdById: true } });
  res.json({ removed, versions });
}));

// ---------- Saved replies ----------

// Access: PUBLIC replies are shared with the store team (managed by supervisors+, usable by triggers);
// PRIVATE replies belong to one user and are invisible to everyone else.
const replySchema = z.object({
  shortcut: z.string().trim().toLowerCase().regex(/^[a-z0-9_-]{1,30}$/, 'use letters, numbers, - or _'),
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(2000),
  access: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
});
const visibleReplies = (req) => ({ storeId: req.params.storeId, OR: [{ access: 'PUBLIC' }, { access: 'PRIVATE', ownerId: req.user.id }] });
const canManageReply = (req, reply) => (reply.access === 'PRIVATE' ? reply.ownerId === req.user.id : RANK[req.storeRole] >= RANK.SUPERVISOR);
const replyView = (req, r) => ({ ...r, canEdit: canManageReply(req, r) });

r.get('/stores/:storeId/saved-replies', requireStore('AGENT'), asyncRoute(async (req, res) => {
  const rows = await prisma.savedReply.findMany({ where: visibleReplies(req), orderBy: { shortcut: 'asc' } });
  res.json(rows.map((r) => replyView(req, r)));
}));
r.post('/stores/:storeId/saved-replies', requireStore('AGENT'), asyncRoute(async (req, res) => {
  const input = replySchema.parse(req.body);
  if (input.access === 'PUBLIC' && RANK[req.storeRole] < RANK.SUPERVISOR) throw httpError(403, 'Only supervisors and admins can create team (public) shortcuts. Make it private instead.');
  const reply = await prisma.savedReply.create({ data: { ...input, storeId: req.params.storeId, ownerId: req.user.id } });
  res.status(201).json(replyView(req, reply));
}));
r.put('/stores/:storeId/saved-replies/:id', requireStore('AGENT'), asyncRoute(async (req, res) => {
  const input = replySchema.parse(req.body);
  const reply = await prisma.savedReply.findFirst({ where: { id: req.params.id, ...visibleReplies(req) } });
  if (!reply) throw httpError(404, 'Saved reply not found');
  if (!canManageReply(req, reply) || !canManageReply(req, { ...reply, access: input.access })) throw httpError(403, 'You cannot edit this shortcut');
  // Making a shared reply private hands it to the editor.
  const ownerId = input.access === 'PRIVATE' ? reply.ownerId || req.user.id : reply.ownerId;
  const updated = await prisma.savedReply.update({ where: { id: reply.id }, data: { ...input, ownerId } });
  res.json(replyView(req, updated));
}));
r.delete('/stores/:storeId/saved-replies/:id', requireStore('AGENT'), asyncRoute(async (req, res) => {
  const reply = await prisma.savedReply.findFirst({ where: { id: req.params.id, ...visibleReplies(req) } });
  if (!reply) throw httpError(404, 'Saved reply not found');
  if (!canManageReply(req, reply)) throw httpError(403, 'You cannot delete this shortcut');
  await prisma.savedReply.delete({ where: { id: reply.id } });
  res.json({ ok: true });
}));

// ---------- Webhooks (admin-approved endpoints) ----------

const hookView = (h) => ({ id: h.id, name: h.name, url: h.url, events: h.events, enabled: h.enabled, createdAt: h.createdAt });
const hookSchema = z.object({ name: z.string().trim().min(1).max(80), url: z.string().trim().url().max(500), events: z.array(z.enum(WEBHOOK_EVENTS)).max(10).default([]), enabled: z.boolean().default(true) });

r.get('/stores/:storeId/webhooks', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const hooks = await prisma.webhook.findMany({ where: { storeId: req.params.storeId }, include: { deliveries: { orderBy: { createdAt: 'desc' }, take: 10 } } });
  res.json({ events: WEBHOOK_EVENTS, webhooks: hooks.map((h) => ({ ...hookView(h), deliveries: h.deliveries })) });
}));
r.post('/stores/:storeId/webhooks', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const input = hookSchema.parse(req.body);
  await assertPublicUrl(input.url);
  const secret = 'whsec_' + randomToken(24);
  const h = await prisma.webhook.create({ data: { ...input, storeId: req.params.storeId, secret: encryptJson(secret) } });
  await audit(req, 'webhook.created', { storeId: req.params.storeId, target: input.url });
  res.status(201).json({ ...hookView(h), secret }); // secret shown once
}));
r.put('/stores/:storeId/webhooks/:id', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const input = hookSchema.parse(req.body);
  await assertPublicUrl(input.url);
  const n = await prisma.webhook.updateMany({ where: { id: req.params.id, storeId: req.params.storeId }, data: input });
  if (!n.count) throw httpError(404, 'Webhook not found');
  await audit(req, 'webhook.updated', { storeId: req.params.storeId, target: input.url });
  res.json({ ok: true });
}));
r.delete('/stores/:storeId/webhooks/:id', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const n = await prisma.webhook.deleteMany({ where: { id: req.params.id, storeId: req.params.storeId } });
  if (!n.count) throw httpError(404, 'Webhook not found');
  await audit(req, 'webhook.deleted', { storeId: req.params.storeId, target: req.params.id });
  res.json({ ok: true });
}));
r.post('/stores/:storeId/webhooks/:id/test', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const h = await prisma.webhook.findFirst({ where: { id: req.params.id, storeId: req.params.storeId } });
  if (!h) throw httpError(404, 'Webhook not found');
  await queueWebhook(h, 'webhook.test', { message: 'Test delivery' });
  res.json({ queued: true });
}));

// ---------- Audit log ----------

r.get('/stores/:storeId/audit', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const rows = await prisma.auditLog.findMany({ where: { storeId: req.params.storeId }, orderBy: { createdAt: 'desc' }, take: 200 });
  const users = await prisma.user.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.userId).filter(Boolean))] } }, select: { id: true, name: true } });
  res.json(rows.map((r) => ({ ...r, userName: users.find((u) => u.id === r.userId)?.name || (r.userId ? 'Unknown' : 'System') })));
}));

// ---------- Privacy: visitor export / erase ----------

r.get('/stores/:storeId/visitors/:visitorId/export', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const v = await prisma.visitor.findFirst({ where: { id: req.params.visitorId, storeId: req.params.storeId }, include: { conversations: { include: { messages: { where: { senderType: { not: 'NOTE' } }, orderBy: { seq: 'asc' } }, attachments: { select: { id: true, filename: true, mime: true, size: true, createdAt: true } } } } } });
  if (!v) throw httpError(404, 'Visitor not found');
  const { tokenHash, ...visitor } = v;
  await audit(req, 'privacy.export', { storeId: req.params.storeId, target: v.id });
  res.set('Content-Disposition', `attachment; filename="visitor-${v.id}.json"`).json(visitor);
}));

/** Permanently delete visitors of one store with their chats, messages, page history and files. */
async function eraseVisitors(req, storeId, ids) {
  const found = await prisma.visitor.findMany({ where: { id: { in: ids }, storeId }, select: { id: true } });
  const vids = found.map((v) => v.id);
  if (!vids.length) return 0;
  const files = await prisma.attachment.findMany({ where: { storeId, conversation: { visitorId: { in: vids } } }, select: { storagePath: true } });
  await prisma.$transaction(async (tx) => {
    for (const f of files) await enqueue('delete_file', { storagePath: f.storagePath }, { storeId, tx });
    await tx.visitor.deleteMany({ where: { id: { in: vids }, storeId } });
  });
  for (const id of vids) { disconnectVisitor(id); await audit(req, 'privacy.erased', { storeId, target: id }); }
  return vids.length;
}

r.delete('/stores/:storeId/visitors/:visitorId', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  if (!(await eraseVisitors(req, req.params.storeId, [req.params.visitorId]))) throw httpError(404, 'Visitor not found');
  res.json({ ok: true });
}));

r.post('/stores/:storeId/visitors/bulk-delete', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const { ids } = z.object({ ids: z.array(z.string().min(1).max(64)).min(1).max(500) }).parse(req.body);
  res.json({ deleted: await eraseVisitors(req, req.params.storeId, ids) });
}));

// Shopify integration (customer + last order in the inbox). The token is write-only from the browser.
r.get('/stores/:storeId/integrations/shopify', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const s = await prisma.store.findUnique({ where: { id: req.params.storeId } });
  res.json({ domain: s.shopifyDomain, connected: shopifyConnected(s) });
}));

r.put('/stores/:storeId/integrations/shopify', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const input = z.object({ domain: z.string().max(200).nullable(), token: z.string().trim().min(10).max(200).optional() }).parse(req.body);
  const data = input.domain === null
    ? { shopifyDomain: null, shopifyToken: null }
    : { shopifyDomain: normalizeShopDomain(input.domain), ...(input.token ? { shopifyToken: sealToken(input.token) } : {}) };
  const s = await prisma.store.update({ where: { id: req.params.storeId }, data });
  await audit(req, input.domain === null ? 'shopify.disconnected' : 'shopify.saved', { storeId: s.id, meta: { domain: s.shopifyDomain } });
  res.json({ domain: s.shopifyDomain, connected: shopifyConnected(s) });
}));

r.post('/stores/:storeId/integrations/shopify/test', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  res.json(await testShopify(await prisma.store.findUnique({ where: { id: req.params.storeId } })));
}));

// Sends a real test email through this store's SMTP (or the platform's) and reports what the server said.
r.post('/stores/:storeId/email/test', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  const { to } = z.object({ to: z.string().trim().toLowerCase().email('Enter a valid email address').max(200) }).parse(req.body);
  const s = await prisma.store.findUnique({ where: { id: req.params.storeId } });
  const r2 = await sendEmailNow(s, { to, subject: `Test email from ${s.name}`, text: 'This is a test email from your live chat settings. If you received it, email delivery works.' });
  await audit(req, 'email.test', { storeId: s.id, meta: { to } });
  res.json({ ok: true, accepted: r2.accepted });
}));

r.get('/stores/:storeId/email/status', requireStore('ADMIN'), asyncRoute(async (req, res) => {
  res.json(await emailStatus(await prisma.store.findUnique({ where: { id: req.params.storeId } })));
}));

export default r;
