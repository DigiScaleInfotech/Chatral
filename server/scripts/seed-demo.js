// DEV ONLY: creates two demo stores with an owner + agent each, through the real API.
// Usage: API running locally, then `node scripts/seed-demo.js`. Uses ADMIN_EMAIL/ADMIN_PASSWORD and DEMO_PASSWORD from .env.
import 'dotenv/config';

const API = process.env.API_URL || 'http://localhost:4100';
const pass = process.env.DEMO_PASSWORD;
if (!pass || process.env.NODE_ENV === 'production') { console.error('Set DEMO_PASSWORD (and never run this in production).'); process.exit(1); }

async function call(method, path, body, token) {
  const r = await fetch(API + '/api' + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok && r.status !== 409) throw new Error(`${method} ${path} → ${r.status} ${JSON.stringify(d)}`);
  return d;
}

const { token } = await call('POST', '/auth/login', { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
const existing = await call('GET', '/stores', null, token);
for (const [name, slug] of [['Aurora Jewels', 'aurora'], ['Blue Peak Outdoors', 'bluepeak']]) {
  let store = existing.find((s) => s.name === name);
  if (!store) store = await call('POST', '/stores', { name, allowedOrigins: [`${slug}.example.com`] }, token);
  for (const role of ['OWNER', 'AGENT']) {
    await call('POST', `/stores/${store.id}/members`, { email: `${slug}-${role.toLowerCase()}@example.test`, name: `${name.split(' ')[0]} ${role === 'OWNER' ? 'Owner' : 'Agent'}`, password: pass, role }, token).catch((e) => console.log('member exists?', e.message.slice(0, 80)));
  }
  console.log(`${name}: key ${store.publicKey}  storefront http://localhost:5600/?key=${store.publicKey}&name=${encodeURIComponent(name)}`);
}
console.log('Users: <slug>-owner@example.test / <slug>-agent@example.test, password = DEMO_PASSWORD from .env');
