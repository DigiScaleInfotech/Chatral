// Durable job queue on Postgres. Jobs survive restarts; workers claim with FOR UPDATE SKIP LOCKED
// so several processes can run safely. Handlers must be idempotent (a crash after the side effect
// but before "DONE" re-runs the job).
import os from 'node:os';
import { prisma, clock, utc } from '../config.js';

const handlers = new Map();
const workerId = `${os.hostname()}:${process.pid}`;
const STALE_MS = 5 * 60_000;

export const registerJob = (type, fn) => handlers.set(type, fn);

/** Enqueue. With dedupeKey, a second enqueue of the same key is a no-op (returns null). */
export async function enqueue(type, payload, { runAt = clock.now(), storeId = null, dedupeKey = null, maxAttempts = 5, tx = prisma } = {}) {
  try {
    return await tx.job.create({ data: { type, payload, runAt, storeId, dedupeKey, maxAttempts } });
  } catch (e) {
    if (e.code === 'P2002') return null;
    throw e;
  }
}

export async function cancelJobs(where) {
  return prisma.job.updateMany({ where: { ...where, status: 'PENDING' }, data: { status: 'CANCELLED', finishedAt: clock.now() } });
}

async function claim(limit) {
  const now = clock.now();
  return prisma.$queryRaw`
    UPDATE "Job" SET status = 'RUNNING', "lockedAt" = ${utc(now)}, "lockedBy" = ${workerId}, attempts = attempts + 1
    WHERE id IN (
      SELECT id FROM "Job" WHERE status = 'PENDING' AND "runAt" <= ${utc(now)}
      ORDER BY "runAt" LIMIT ${limit} FOR UPDATE SKIP LOCKED
    ) RETURNING *`;
}

export async function runJob(job) {
  const fn = handlers.get(job.type);
  try {
    if (!fn) throw new Error(`No handler for job type ${job.type}`);
    await fn(job.payload, job);
    await prisma.job.update({ where: { id: job.id }, data: { status: 'DONE', finishedAt: clock.now(), lastError: null } });
  } catch (e) {
    const final = job.attempts >= job.maxAttempts || e.permanent;
    const backoff = Math.min(60 * 60_000, 2 ** job.attempts * 15_000);
    await prisma.job.update({
      where: { id: job.id },
      data: final
        ? { status: 'FAILED', lastError: String(e.message || e).slice(0, 1000), finishedAt: clock.now() }
        : { status: 'PENDING', lastError: String(e.message || e).slice(0, 1000), runAt: new Date(clock.now().getTime() + backoff) },
    });
    if (final) console.error(`Job ${job.type} ${job.id} failed permanently:`, e.message);
  }
}

/** Process due jobs until none are left (or `max`). Returns how many ran. */
export async function drain({ max = 1000, batch = 20 } = {}) {
  let n = 0;
  while (n < max) {
    const jobs = await claim(batch);
    if (!jobs.length) break;
    await Promise.all(jobs.map(runJob));
    n += jobs.length;
  }
  return n;
}

export async function recoverStale() {
  return prisma.job.updateMany({
    where: { status: 'RUNNING', lockedAt: { lt: new Date(clock.now().getTime() - STALE_MS) } },
    data: { status: 'PENDING', lockedBy: null },
  });
}

let timer = null;
export function startWorker(intervalMs = 1000) {
  let busy = false;
  let ticks = 0;
  timer = setInterval(async () => {
    if (busy) return;
    busy = true;
    try {
      if (ticks++ % 60 === 0) await recoverStale();
      await drain({ max: 200 });
    } catch (e) {
      console.error('job worker', e);
    } finally {
      busy = false;
    }
  }, intervalMs);
}
export const stopWorker = () => clearInterval(timer);
