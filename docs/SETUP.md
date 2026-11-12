# Local setup

## Prerequisites

- Node.js (developed and tested on Node 24) and npm
- PostgreSQL (any recent version; tested locally on a standard install)
- Optional: an SMTP account (needed for tickets and email notifications)

## Install

```bash
cd chat/server && npm ci && npx prisma generate
cd ../client && npm ci
```

Use `npm ci` (lockfile) rather than `npm install`. If npm reports that install scripts were held back, run `npx prisma generate` yourself as above.

## Environment variables (`chat/server/.env`)

Copy `server/.env.example` to `server/.env` and fill in values. Never commit `.env` (it is git-ignored).

| Name | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string for this app's own database |
| `JWT_SECRET` | yes in production (32+ chars) | Signs dashboard login tokens |
| `ENC_KEY` | yes (64 hex chars) | Encrypts webhook secrets and per-store SMTP passwords at rest. If missing the server only logs a warning and starts, but webhooks and store SMTP settings cannot be saved |
| `API_URL` | yes | Public URL of this server; the widget script and WebSockets are served from it |
| `ADMIN_URL` | yes | Dashboard URL (normally `API_URL/admin`); used for CORS and links in emails |
| `PORT` | no (4100) | HTTP port |
| `NODE_ENV` | `production` when deployed | Enables production checks (secret length, webhook SSRF guard, no localhost widget bypass) |
| `UPLOAD_DIR` | no (`./uploads`) | Private attachment storage; must be persistent and backed up |
| `MAX_UPLOAD_MB` | no (10) | Max attachment size |
| `SHOPIFY_API_VERSION` | no (`2026-07`) | Shopify Admin API version used for customer/order lookups |
| `RUN_WORKERS` | no (true) | Run the job poller and retention sweep in this process |
| `RETENTION_SWEEP_MINUTES` | no (60) | How often expired chats are deleted |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | no | Platform SMTP fallback; stores can set their own in Settings → Notifications. Empty = no email |
| `BITRIX24_WEBHOOK_URL`, `BITRIX24_DIALOG_ID` | no | Bitrix24 inbound webhook (base URL, `im` scope; contains a secret) and the receiving user id. When both are set, every new chat and offline message is sent to that user as a Bitrix24 chat message (name, email, pre-chat answers, first message, page, inbox link). Failures are retried; bad credentials are logged as `[bitrix24]` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | for `npm run seed` only | First super admin; remove the password from the environment after seeding |

Generate secrets with `openssl rand -hex 32`.

## Database

```bash
cd chat/server
npx prisma migrate deploy   # applies new migration files only; never drops data
npm run seed                # creates the first super admin (safe to re-run)
```

Use a dedicated database. Do not run `prisma migrate dev` or `prisma migrate reset` against a database with data you care about.

## Run locally

Production-like (one server serves API, dashboard and widget):

```bash
cd chat/client && npm run build
cd ../server && npm start          # http://localhost:4100/admin
```

Development (hot reload):

```bash
cd chat/server && npm run dev      # API on :4100
cd chat/client && npm run dev      # dashboard on http://localhost:5174/admin/ (proxies /api and /ws to :4100)
```

Test storefront: serve `client/demo/` with any static server and open `/?key=<store public key>&api=http://localhost:4100`.
