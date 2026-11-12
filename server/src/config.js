import 'dotenv/config';
import path from 'node:path';
import { PrismaClient, Prisma } from '@prisma/client';

const isProd = process.env.NODE_ENV === 'production';

if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('JWT_SECRET must be set (32+ chars) in production');
}

export const config = {
  isProd,
  port: Number(process.env.PORT || 4100),
  apiUrl: (process.env.API_URL || 'http://localhost:4100').replace(/\/$/, ''),
  adminUrl: (process.env.ADMIN_URL || 'http://localhost:5174/admin').replace(/\/$/, ''),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  uploadDir: path.resolve(process.env.UPLOAD_DIR || './uploads'),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_MB || 10) * 1024 * 1024,
  // Run background workers (jobs, retention) in this process. Disable on extra web replicas if desired.
  runWorkers: process.env.RUN_WORKERS !== 'false',
  retentionSweepMinutes: Number(process.env.RETENTION_SWEEP_MINUTES || 60),
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== 'false',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
  },
};

export const prisma = new PrismaClient();

// Single source of "now" so tests can move time without touching the system clock.
let offsetMs = 0;
export const clock = {
  now: () => new Date(Date.now() + offsetMs),
  advance: (ms) => { offsetMs += ms; },
  reset: () => { offsetMs = 0; },
};

export const DAY_MS = 86_400_000;

/**
 * Timestamp columns are "timestamp without time zone" holding UTC. In raw SQL a bound JS Date is
 * interpreted in the DB session TimeZone, which shifts comparisons on non-UTC servers - always wrap
 * dates used in raw queries with utc().
 */
export const utc = (d) => Prisma.sql`(${d.toISOString()}::timestamptz AT TIME ZONE 'UTC')`;
