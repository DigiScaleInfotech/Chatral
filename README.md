# Live Chat Platform (multi-store)

A self-hosted, tawk.to-style live chat for many independent stores: embeddable widget, agent inbox, trigger engine, 30-day rolling retention, reports and webhooks.

Stack: Express + Prisma + PostgreSQL, React + Vite + antd, JWT auth, AES-GCM secret encryption, Shadow-DOM embed with a store public key. Full documentation: [docs/README.md](docs/README.md).

```
chat/
  server/   Express API, WebSockets (ws), Prisma schema + migrations, job queue, tests
  client/   Admin dashboard (dist/admin) + embeddable widget (dist/widget/chat.js)
  client/demo/index.html   local test storefront (hostile CSS, SPA navigation)
```

## Requirements
- Node 20+ (tested on 24), PostgreSQL 14+ (tested on 18)
- One process serves the API, WebSockets, `/admin` and `/widget/chat.js`

## Local setup
```bash
cd chat/server
cp .env.example .env          # set DATABASE_URL, JWT_SECRET, ENC_KEY, ADMIN_EMAIL, ADMIN_PASSWORD; NODE_ENV=development
npm install
npx prisma migrate deploy     # creates tables (non-destructive)
npm run seed                  # first super admin
cd ../client && npm install && npm run build
cd ../server && npm start     # http://localhost:4100/admin
```
Dashboard dev server with hot reload: `cd chat/client && npm run dev` → http://localhost:5174/admin/ (proxies `/api` and `/ws` to :4100).

Optional demo data (dev only): set `DEMO_PASSWORD` in `.env`, start the API, run `node scripts/seed-demo.js`. It prints storefront URLs like `http://localhost:5600/?key=pk_…` – serve `client/demo` on port 5600 (`python -m http.server 5600 --directory client/demo`).

## Tests
```bash
cd chat/server
# needs a separate, throwaway test database; it is TRUNCATED by the tests.
# Never point this at the real database. Default: postgresql://postgres@localhost:5433/livechat_test
TEST_DATABASE_URL=postgresql://user@localhost:5433/livechat_test npm test
```
Frontend unit tests (widget UI, embed, alert rules): `cd chat/client && npm test`.

## Installing the widget on a store
Dashboard → Store settings → Installation shows the snippet:
```html
<script src="https://chat.yourdomain.com/widget/chat.js" data-store="pk_…" async></script>
```
- **Any site:** paste before `</body>` on every page.
- **Shopify:** Online Store → Themes → Edit code → `layout/theme.liquid` → before `</body>`. Add both `yourshop.com` and `yourshop.myshopify.com` to *Allowed domains*.
- Design edits are drafted and **published** in *Widget design*; the snippet never changes.
- *Rotate key* (main admin): new key immediately, old key keeps working for 7 days.
- The *Installation check* shows: last load + origin, blocked origins, published version, agents online, SMTP status, old-key grace.

## Production deployment
1. Create a dedicated Postgres database/user. Set every value in `.env.example` (`NODE_ENV=production`, strong `JWT_SECRET`, `ENC_KEY`).
2. `npm ci && npx prisma migrate deploy && npm run seed` in `server/`; `npm ci && npm run build` in `client/`.
3. Run `npm start` under a process manager (systemd/pm2). Put it behind HTTPS (nginx/Caddy) and **forward WebSocket upgrades** for `/ws/`:
   ```nginx
   location / { proxy_pass http://127.0.0.1:4100; proxy_http_version 1.1;
     proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade";
     proxy_set_header Host $host; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_read_timeout 75s; }
   ```
4. `UPLOAD_DIR` must be persistent and backed up together with the database.
5. `app.set('trust proxy', 1)` assumes **exactly one** reverse proxy in front (needed for correct rate limiting by client IP). Adjust it if you have more hops (e.g. a CDN plus nginx).
6. Migrations: `prisma migrate deploy` only applies new migration files and never drops data. Never run `prisma migrate dev` or `migrate reset` against production.
7. Background work runs inside the API process (`RUN_WORKERS=true`): a 1-second job poller (trigger delays, emails, webhooks, file deletion) and a retention sweep enqueued every `RETENTION_SWEEP_MINUTES`. Jobs live in Postgres, so a restart loses nothing; stuck `RUNNING` jobs are retried after 5 minutes.

### Running more than one API instance
Jobs and the retention sweep are already safe across instances (`FOR UPDATE SKIP LOCKED`, unique dedupe keys). What is **not** shared yet:
- **Realtime fan-out** (`src/realtime.js`) keeps sockets in memory. A message saved by instance A only reaches sockets on A. Add a pub/sub (Redis, or Postgres `LISTEN/NOTIFY`) behind `toAgents`/`toVisitor`/`disconnectUser`, and make agent presence/"connected" checks query it.
- **Rate limits** (`express-rate-limit`) are per process. Use a shared store (e.g. `rate-limit-redis`).
- **Uploads** are on local disk. Use a shared volume or object storage.
- Use sticky sessions at the load balancer for WebSockets (not required for correctness once pub/sub exists, but reduces reconnect churn).
Until then run a single instance (vertical scaling is fine).

## Key behaviours
- **Roles:** one **main admin** (super admin, all stores) and any number of **agents**, each given access to selected stores. Agents see unassigned + their own chats. (Owner/Admin/Supervisor memberships created before this rule keep working but can no longer be granted.)
- **Retention:** `expiresAt = lastActivityAt + retentionDays` (default 30, per store). Only visitor messages and explicit resume (reopening the widget on an existing chat) move it. Page views, widget loads, heartbeats, agent/bot/system messages and notes do not. An hourly durable job deletes expired conversations with their messages and files.
- **Returning visitors:** a random per-store token in browser storage (server keeps only its SHA-256). Same token → same visitor → the non-expired conversation resumes with the same id and history. Cleared storage → new anonymous visitor; no history leaks.
- **Tickets (Inbox → Tickets):** email support threads, numbered per store (#1, #2…). Create from scratch (**New ticket**), or from any chat / offline message (**Create ticket** in the conversation header; the chat transcript, without internal notes, is copied into the ticket so it survives chat retention). Statuses Open / Pending / Closed; an email reply to a closed ticket reopens it. Agents see unassigned + their own tickets; supervisors and above see all and can assign anyone.
  - **Email is required.** Tickets are delivered over the store's SMTP settings (Settings → Notifications) or the server's `SMTP_*`. Without SMTP, creating a ticket or sending a reply is refused with a clear message (notes still work).
  - **Delivery status is real:** each reply shows *Sending…* until the SMTP server accepts it, then *Emailed*. 4xx/network errors are retried with backoff (up to 5 attempts); 5xx rejections and auth failures are marked *Not delivered* with the error, and can be retried from the thread. One job per reply (unique dedupe key) and client-generated ids on create/reply mean double clicks and network retries never send twice. Replies thread in the customer's mail client (`Message-ID` / `In-Reply-To` / `References`, subject `[#N]`).
  - **Inbound customer replies are not imported yet.** Customers reply to the SMTP `from` address and those emails stay in that mailbox. Importing them needs an inbound-mail service (e.g. an inbound-parse webhook from your email provider, or IMAP polling) - not built.
  - Tickets are not removed by the 30-day chat retention; they are kept until the store is deleted.
- **Triggers:** server-side engine; see `server/src/triggers/`. Delays are durable jobs; conditions are re-checked when they run.
