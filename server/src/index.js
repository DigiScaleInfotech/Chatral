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

// One-time Fresh Panel Reset: Purge old test stores/users and ensure ONLY Chatral Store and chatral.official@gmail.com exist
try {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "_SystemMigration" (
      "key" TEXT PRIMARY KEY,
      "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  const ranPurge = await prisma.$queryRawUnsafe(`
    SELECT "key" FROM "_SystemMigration" WHERE "key" = 'fresh_purge_test_stores_v4';
  `);
  if (!ranPurge || ranPurge.length === 0) {
    console.log('[db] Initiating full purge of old test stores and users...');
    
    // 1. Delete all other stores, keeping only the user's active Chatral Store key or Chatral Store
    await prisma.store.deleteMany({
      where: {
        AND: [
          { name: { not: 'Chatral Store' } },
          { publicKey: { not: 'pk_yU4JQtndJuFviYy6d94ZzZE-' } },
        ],
      },
    }).catch((e) => console.warn('Store purge warning:', e?.message));

    // 2. Ensure only chatral.official@gmail.com exists
    await prisma.user.deleteMany({
      where: {
        email: { not: 'chatral.official@gmail.com' },
      },
    }).catch((e) => console.warn('User purge warning:', e?.message));

    // 3. Ensure SUPER_ADMIN exists
    const adminEmail = 'chatral.official@gmail.com';
    let superAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!superAdmin) {
      const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123456', 12);
      superAdmin = await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Chatral Super Admin',
          role: 'SUPER_ADMIN',
          isActive: true,
          passwordHash,
        },
      });
    }

    // 4. Update or create the official Chatral Store with key pk_yU4JQtndJuFviYy6d94ZzZE-
    let chatralStore = await prisma.store.findFirst({
      where: {
        OR: [
          { publicKey: 'pk_yU4JQtndJuFviYy6d94ZzZE-' },
          { name: 'Chatral Store' },
        ],
      },
    });

    if (chatralStore) {
      chatralStore = await prisma.store.update({
        where: { id: chatralStore.id },
        data: {
          name: 'Chatral Store',
          publicKey: 'pk_yU4JQtndJuFviYy6d94ZzZE-',
          allowedOrigins: ['localhost', '127.0.0.1', 'chatral.com', '*.chatral.com'],
          widgetEnabled: true,
          isActive: true,
        },
      });
    } else {
      chatralStore = await prisma.store.create({
        data: {
          name: 'Chatral Store',
          allowedOrigins: ['localhost', '127.0.0.1', 'chatral.com', '*.chatral.com'],
          timezone: 'Asia/Kolkata',
          publicKey: 'pk_yU4JQtndJuFviYy6d94ZzZE-',
          chatLinkId: newChatLinkId(),
          plan: 'STARTER',
          planStatus: 'ACTIVE',
          planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          widgetEnabled: true,
          isActive: true,
        },
      });
    }

    const cfg = { ...DEFAULT_WIDGET_CONFIG, businessHours: { ...DEFAULT_WIDGET_CONFIG.businessHours, timezone: 'Asia/Kolkata' } };
    await prisma.widgetConfig.upsert({
      where: { storeId_version: { storeId: chatralStore.id, version: 1 } },
      update: { status: 'PUBLISHED', config: cfg },
      create: { storeId: chatralStore.id, version: 1, status: 'PUBLISHED', config: cfg, note: 'Initial setup' },
    }).catch(() => {});

    // 5. Connect chatral.official@gmail.com as OWNER of Chatral Store
    await prisma.storeMember.upsert({
      where: { userId_storeId: { userId: superAdmin.id, storeId: chatralStore.id } },
      update: { role: 'OWNER' },
      create: { userId: superAdmin.id, storeId: chatralStore.id, role: 'OWNER' },
    }).catch(() => {});

    // 6. Reset any dangling assignments
    await prisma.conversation.updateMany({ data: { assigneeId: null } }).catch(() => {});
    await prisma.ticket.updateMany({ data: { assigneeId: null } }).catch(() => {});

    await prisma.$executeRawUnsafe(`
      INSERT INTO "_SystemMigration" ("key") VALUES ('fresh_purge_test_stores_v4');
    `);
    console.log('[db] Full purge complete! Only Chatral Store (pk_yU4JQtndJuFviYy6d94ZzZE-) and chatral.official@gmail.com remain.');
  }
} catch (e) {
  console.warn('[db] Fresh purge warning (non-fatal):', e?.message || e);
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
