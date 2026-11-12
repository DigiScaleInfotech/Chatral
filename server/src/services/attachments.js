import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma, config } from '../config.js';
import { httpError, randomToken } from '../lib/util.js';
import { safeUploadPath } from './retention.js';

// Allowed types are verified by magic bytes, never trusted from the client's Content-Type.
const SNIFF = [
  { mime: 'image/png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/gif', test: (b) => b.subarray(0, 4).toString('latin1') === 'GIF8' },
  { mime: 'image/webp', test: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' },
  { mime: 'application/pdf', test: (b) => b.subarray(0, 5).toString('latin1') === '%PDF-' },
  {
    mime: 'text/plain',
    test: (b) => {
      if (b.includes(0)) return false;
      const head = b.subarray(0, 1024).toString('utf8');
      return !/^\s*<(?:\!doctype|html|head|body|script|svg|xml|\?xml)/i.test(head);
    },
  },
];

const ALLOWED_EXTS = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt', '.log', '.csv', '.text'],
};

const cleanName = (n) => String(n || 'file').replace(/[^\p{L}\p{N}._ ()-]/gu, '_').replace(/^\.+/, '').slice(0, 120) || 'file';

export async function saveUpload({ storeId, conversationId, filename, mime, buffer }) {
  const file = await writeUpload({ storeId, filename, mime, buffer });
  return prisma.attachment.create({ data: { storeId, conversationId, ...file } });
}

/** Validates (size, magic bytes, extension) and writes the file; returns what to store in the DB. */
export async function writeUpload({ storeId, filename, mime, buffer }) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw httpError(400, 'Empty file');
  if (buffer.length > config.maxUploadBytes) throw httpError(413, `File is too large (max ${Math.round(config.maxUploadBytes / 1048576)} MB)`);
  const claimed = String(mime || '').split(';')[0].trim().toLowerCase();
  const detected = SNIFF.find((s) => s.test(buffer));
  if (!detected || (claimed && claimed !== detected.mime)) {
    throw httpError(415, 'This file type is not allowed. Allowed: PNG, JPG, GIF, WEBP, PDF, TXT');
  }
  let name;
  try { name = cleanName(decodeURIComponent(String(filename || ''))); } catch { name = cleanName(filename); }
  const ext = path.extname(name).toLowerCase();
  const validExts = ALLOWED_EXTS[detected.mime] || [];
  if (ext && !validExts.includes(ext)) {
    throw httpError(415, 'Invalid file extension for detected file type');
  }
  if (!ext) {
    name = `${name}${validExts[0] || ''}`;
  }
  const storagePath = path.join(storeId, `${randomToken(16)}`);
  const full = safeUploadPath(storagePath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, buffer, { flag: 'wx' });
  return { filename: name, mime: detected.mime, size: buffer.length, storagePath };
}

/** Reads a stored upload (for email attachments). */
export const readUpload = (storagePath) => fs.readFile(safeUploadPath(storagePath));

export async function streamAttachment(att, res) {
  let data;
  try {
    data = await fs.readFile(safeUploadPath(att.storagePath));
  } catch {
    return res.status(404).json({ error: 'File not found' });
  }
  const inline = att.mime.startsWith('image/');
  res.set({
    'Content-Type': att.mime,
    'Content-Length': data.length,
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
    'Cache-Control': 'private, max-age=300',
    'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${att.filename.replace(/"/g, '')}"`,
  });
  res.end(data);
}
