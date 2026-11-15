// Creates the first super admin from ADMIN_EMAIL / ADMIN_PASSWORD. Safe to re-run (never overwrites).
import bcrypt from 'bcryptjs';
import { prisma } from './config.js';

const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || '';
if (!email || password.length < 10) {
  console.log('Skipping seed: ADMIN_EMAIL or ADMIN_PASSWORD (10+ chars) not set.');
  process.exit(0);
}
const existing = await prisma.user.findUnique({ where: { email } });
if (existing) {
  if (existing.role !== 'SUPER_ADMIN') {
    await prisma.user.update({ where: { email }, data: { role: 'SUPER_ADMIN', isActive: true } });
    console.log(`Updated existing user ${email} to SUPER_ADMIN.`);
  } else {
    console.log(`User ${email} already exists as SUPER_ADMIN - nothing changed.`);
  }
} else {
  await prisma.user.create({ data: { email, name: 'Platform Admin', role: 'SUPER_ADMIN', passwordHash: await bcrypt.hash(password, 12) } });
  console.log(`Created super admin ${email}`);
}
await prisma.$disconnect();
