# Architecture

## Components

| Component | Tech | Served at |
|---|---|---|
| API + WebSockets + job worker | Node.js, Express, `ws`, Prisma 5.22, PostgreSQL | `API_URL` (default port 4100) |
| Agent dashboard | React 18, Vite 5, antd 5 | `API_URL/admin` (static files from `client/dist/admin`) |
| Website widget | React in a Shadow DOM, one IIFE file | `API_URL/widget/chat.js` |

One Node process does everything: REST, both WebSocket endpoints, the durable job poller and the retention sweep (`RUN_WORKERS=true`).

## REST API (`server/src/routes`)

| File | Prefix | Used by | Auth |
|---|---|---|---|
| `auth.js` | `/api/auth` | dashboard | login → JWT |
| `admin.js` | `/api` | dashboard | JWT + store role (stores, members, settings, widget config, presence, webhooks) |
| `inbox.js` | `/api/stores/:storeId/...` | dashboard | conversations, messages, uploads, bulk actions, bans, live visitors |
| `tickets.js` | `/api/stores/:storeId/tickets...` | dashboard | tickets, replies, ticket files |
| `triggers.js`, `reports.js` | `/api` | dashboard | triggers, executions, reports |
| `widget.js` | `/api/widget/:key/...` | widget | store public key + visitor token header; domain allowlist |

Dashboard routes accept CORS only from `ADMIN_URL`'s origin; widget routes accept any origin at the CORS layer, then enforce the store's domain allowlist (`services/stores.js → checkOrigin`).

## WebSockets (`server/src/realtime.js`)

- `/ws/agent?token=JWT` - one socket per dashboard tab; subscribed to every store the user belongs to (super admins subscribe explicitly).
- `/ws/visitor?key=PUBLIC_KEY&vt=VISITOR_TOKEN` - one per widget; origin allowlist enforced on upgrade.
- Server → agent events: `message`, `conversation`, `conversations_moved`, `conversations_deleted`, `typing`, `receipt`, `presence`, `visitor_online`, `visitor_page`, `visitor_updated`, `visitor_banned`, `notification`, `ticket_created`, `ticket`, `ticket_message`, `ticket_removed`, `widget_published`.
- `toAgents(storeId, type, data, conv)` only sends to sockets subscribed to that store; when `conv` is given, AGENT-role sockets only get it if the chat is unassigned or theirs.
- Fan-out is in memory (single instance; see BUILD-DEPLOY.md).

## Data flow: a visitor message

1. Widget `POST /api/widget/:key/messages` with a client-generated `clientMsgId`.
2. `sendVisitorMessage` (transaction, per-visitor advisory lock): resume the visitor's open Inbox conversation or create one; insert the message (unique on `conversationId + clientMsgId`, so retries don't duplicate).
3. After commit: `toAgents('message', { conversation, message, isNewConversation, isOffline })`, trigger and webhook events are emitted.
4. Dashboards update the list/thread and play a sound; agents reply via `POST /api/stores/:id/conversations/:cid/messages`, which reaches the widget with `toVisitor('message')`.
5. After a disconnect both sides recover missed messages over REST (`?after=<last seq>`), not by socket replay.

## Background jobs (`services/jobs.js`)

Postgres `Job` table claimed with `FOR UPDATE SKIP LOCKED`. Used for trigger waits/actions, emails, ticket emails, webhooks, Bitrix24 alerts (`services/bitrix.js`), file deletion and retention. Retries back off `2^attempt × 15s` (max 1 h); `dedupeKey` makes enqueues idempotent; jobs stuck `RUNNING` for 5 minutes are retried.
