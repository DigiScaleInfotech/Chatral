import { config, prisma } from './config.js';
import { createServer } from './app.js';
import { startWorker, stopWorker } from './services/jobs.js';
import { scheduleSweep } from './services/retention.js';
import { closeAll } from './realtime.js';
import { idle } from './services/events.js';

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
