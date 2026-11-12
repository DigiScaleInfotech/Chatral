import crypto from 'node:crypto';

const key = () => {
  const hex = process.env.ENC_KEY;
  if (!hex || hex.length !== 64) throw new Error('ENC_KEY must be 32 bytes hex (openssl rand -hex 32)');
  return Buffer.from(hex, 'hex');
};

export function encryptJson(obj) {
  if (obj == null) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(obj), 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64')).join('.');
}

export function decryptJson(str) {
  if (!str) return null;
  const [iv, tag, data] = str.split('.').map((s) => Buffer.from(s, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8'));
}

export const randomToken = (n = 24) => crypto.randomBytes(n).toString('base64url');
