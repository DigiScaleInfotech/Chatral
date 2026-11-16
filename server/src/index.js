import bcrypt from 'bcryptjs';
import { config, prisma } from './config.js';
import { createServer } from './app.js';
import { startWorker, stopWorker } from './services/jobs.js';
import { scheduleSweep } from './services/retention.js';
import { closeAll } from './realtime.js';
import { idle } from './services/events.js';
import { newPublicKey, newChatLinkId } from './lib/util.js';
import { DEFAULT_WIDGET_CONFIG } from './services/stores.js';

if (!/^[0-9a-fA-F]{64}$/.test(process.env.ENC_KEY || '')) {
  console.error('\n⚠️  ENC_KEY is missing/invalid - webhook secrets and store SMTP settings cannot be stored.\n   Fix: ENC_KEY=$(openssl rand -hex 32)\n');
}

const { server } = createServer();
let sweepTimer;

if (config.runWorkers) {
  startWorker();
  // Retention sweep: enqueued once per window (dedupe key), executed by whichever worker claims it.
  const tick = () => scheduleSweep().catch((e) => console.error('schedule sweep', e));
  tick();
  sweepTimer = setInterval(tick, 5 * 60_000);
}

// Auto self-heal schema migration for Supabase / Production PostgreSQL
try {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "plan" TEXT NOT NULL DEFAULT 'TRIAL';
    ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "planStatus" TEXT NOT NULL DEFAULT 'ACTIVE';
    ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "planExpiresAt" TIMESTAMP(3);
  `);
  console.log('[db] Store table schema verified: plan, planStatus, planExpiresAt columns ensured.');
} catch (e) {
  console.warn('[db] Auto-migration warning (non-fatal):', e?.message || e);
}

// One-time Fresh Panel Reset: Purge old test users and establish chatral.official@gmail.com as SUPER_ADMIN
try {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "_SystemMigration" (
      "key" TEXT PRIMARY KEY,
      "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  const ran = await prisma.$queryRawUnsafe(`
    SELECT "key" FROM "_SystemMigration" WHERE "key" = 'fresh_users_reset_chatral_official';
  `);
  if (!ran || ran.length === 0) {
    console.log('[db] Initiating one-time fresh panel reset for chatral.official@gmail.com...');
    // Clear old push devices, store memberships, and users
    await prisma.pushDevice.deleteMany({}).catch(() => {});
    await prisma.storeMember.deleteMany({}).catch(() => {});
    await prisma.user.deleteMany({}).catch(() => {});

    // Reset unassigned conversations & tickets
    await prisma.conversation.updateMany({ data: { assigneeId: null } }).catch(() => {});
    await prisma.ticket.updateMany({ data: { assigneeId: null } }).catch(() => {});

    // Create fresh SUPER_ADMIN
    const adminEmail = 'chatral.official@gmail.com';
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123456', 12);
    const superAdmin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Chatral Super Admin',
        role: 'SUPER_ADMIN',
        isActive: true,
        passwordHash,
      },
    });

    // Ensure all existing stores have chatral.official@gmail.com as OWNER
    const stores = await prisma.store.findMany();
    if (stores.length === 0) {
      const defaultStore = await prisma.store.create({
        data: {
          name: 'Chatral Store',
          allowedOrigins: ['localhost', '127.0.0.1'],
          timezone: 'Asia/Kolkata',
          publicKey: newPublicKey(),
          chatLinkId: newChatLinkId(),
          plan: 'STARTER',
          planStatus: 'ACTIVE',
          planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
      const cfg = { ...DEFAULT_WIDGET_CONFIG, businessHours: { ...DEFAULT_WIDGET_CONFIG.businessHours, timezone: 'Asia/Kolkata' } };
      await prisma.widgetConfig.create({
        data: { storeId: defaultStore.id, version: 1, status: 'PUBLISHED', config: cfg, note: 'Initial setup' },
      }).catch(() => {});
      await prisma.storeMember.create({
        data: { storeId: defaultStore.id, userId: superAdmin.id, role: 'OWNER' },
      }).catch(() => {});
    } else {
      for (const store of stores) {
        await prisma.storeMember.create({
          data: {
            storeId: store.id,
            userId: superAdmin.id,
            role: 'OWNER',
          },
        }).catch(() => {});
      }
    }

    await prisma.$executeRawUnsafe(`
      INSERT INTO "_SystemMigration" ("key") VALUES ('fresh_users_reset_chatral_official');
    `);
    console.log('[db] Fresh panel reset complete! chatral.official@gmail.com is now active SUPER_ADMIN.');
  }
} catch (e) {
  console.warn('[db] Fresh panel reset warning (non-fatal):', e?.message || e);
}

// Agents who were "online" when the process died have no socket now; reset so availability is truthful.
await prisma.storeMember.updateMany({ where: { presence: 'ONLINE' }, data: { presence: 'AWAY' } }).catch(() => {});

server.listen(config.port, () => console.log(`Live chat API listening on :${config.port}`));

async function shutdown() {
  console.log('Shutting down…');
  clearInterval(sweepTimer);
  stopWorker();
  closeAll();
  server.close();
  await idle();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
