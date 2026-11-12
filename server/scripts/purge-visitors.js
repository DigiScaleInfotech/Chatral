// One-off cleanup: permanently delete ALL visitors and their chats (messages, files, page history,
// trigger runs) from every store - or from the stores you name. Stores, users, settings, triggers,
// saved replies, tickets and reports counters are kept.
//
//   node scripts/purge-visitors.js                       # dry run: only prints what would be deleted
//   node scripts/purge-visitors.js --yes                 # delete from ALL stores
//   node scripts/purge-visitors.js --yes --store <id>    # only one store (repeat --store for several)
//
// Back up the database first (pg_dump). This cannot be undone.
import 'dotenv/config';
import fs from 'node:fs/promises';
import { prisma } from '../src/config.js';
import { safeUploadPath } from '../src/services/retention.js';

const args = process.argv.slice(2);
const confirm = args.includes('--yes');
const storeIds = args.flatMap((a, i) => (a === '--store' && args[i + 1] ? [args[i + 1]] : []));
const where = storeIds.length ? { storeId: { in: storeIds } } : {};

const stores = await prisma.store.findMany({ where: storeIds.length ? { id: { in: storeIds } } : {}, select: { id: true, name: true }, orderBy: { name: 'asc' } });
console.log(`Database: ${new URL(process.env.DATABASE_URL).pathname.slice(1)} on ${new URL(process.env.DATABASE_URL).host}`);
for (const s of stores) {
  const [visitors, chats] = await Promise.all([
    prisma.visitor.count({ where: { storeId: s.id } }),
    prisma.conversation.count({ where: { storeId: s.id } }),
  ]);
  console.log(`  ${s.name.padEnd(30)} ${String(visitors).padStart(6)} visitors  ${String(chats).padStart(6)} chats`);
}

if (!confirm) {
  console.log('\nDry run - nothing deleted. Re-run with --yes to delete (back up the database first).');
  await prisma.$disconnect();
  process.exit(0);
}

const files = await prisma.attachment.findMany({ where, select: { storagePath: true } });
const result = await prisma.$transaction(async (tx) => {
  const execs = await tx.triggerExecution.deleteMany({ where: { ...where, visitorId: { not: null } } });
  const jobs = await tx.job.deleteMany({ where: { ...where, type: { in: ['run_trigger', 'bitrix_notify'] }, status: 'PENDING' } });
  const visitors = await tx.visitor.deleteMany({ where }); // cascades: chats, messages, attachments rows, page views
  return { visitors: visitors.count, triggerRuns: execs.count, pendingJobs: jobs.count };
});
let removed = 0;
for (const f of files) {
  try { await fs.rm(safeUploadPath(f.storagePath), { force: true }); removed++; } catch (e) { console.warn('  could not remove a file:', e.message); }
}
console.log(`\nDeleted ${result.visitors} visitors (with their chats), ${result.triggerRuns} trigger runs, ${result.pendingJobs} pending jobs, ${removed} files.`);
await prisma.$disconnect();
