// Creates the first super admin from ADMIN_EMAIL / ADMIN_PASSWORD. Safe to re-run (never overwrites).
import bcrypt from 'bcryptjs';
import { prisma } from './config.js';

const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || '';
if (!email || password.length < 10) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (10+ chars) in .env first.');
  process.exit(1);
}
const existing = await prisma.user.findUnique({ where: { email } });
if (existing) {
  console.log(`User ${email} already exists - nothing changed.`);
} else {
  await prisma.user.create({ data: { email, name: 'Platform Admin', role: 'SUPER_ADMIN', passwordHash: await bcrypt.hash(password, 12) } });
  console.log(`Created super admin ${email}`);
}
await prisma.$disconnect();
