# Code map - where things live, and how they work

This is for a developer who needs to **make a specific change** and wants to go straight to the right
file instead of reading the whole codebase. It's organized by feature area, not by directory, because
that's how change requests usually arrive ("fix the sound", "add a trigger condition", "add a field to
the pre-chat form"). Each section says exactly which files are involved and how data flows between them.

For *what the product does* see [FEATURES.md](FEATURES.md). For *why* certain decisions were made
(multi-tenancy, retention, security) see [ARCHITECTURE.md](ARCHITECTURE.md), [DATABASE.md](DATABASE.md)
and [SECURITY.md](SECURITY.md). This document is the missing piece: *where* in the code each of those
things actually lives.

## Contents

1. [Repository layout](#1-repository-layout)
2. [How to trace any request](#2-how-to-trace-any-request)
3. [Conventions used everywhere](#3-conventions-used-everywhere)
4. Area-by-area map:
   [auth & roles](#41-auth-roles--multi-tenancy) ·
   [database](#42-database-schema--migrations) ·
   [realtime](#43-realtime-websockets) ·
   [messaging core](#44-chat-messaging-the-core-pipeline) ·
   [widget config](#45-widget-design--config-draft--publish) ·
   [the widget](#46-the-embeddable-widget-clientsrcwidget) ·
   [dashboard shell](#47-admin-dashboard-shell--routing-clientsrcadmin) ·
   [inbox](#48-inbox-folders-bulk-actions-ban-assignment) ·
   [tickets](#49-tickets--email) ·
   [triggers](#410-triggers--automation-engine) ·
   [notifications](#411-notifications-email-webhooks-bitrix24-push-sounds) ·
   [transcripts](#412-transcripts-download) ·
   [visitors & reports](#413-visitor-tracking--reports) ·
   [platform admin](#414-platform-admin-super-admin-stores-users) ·
   [Shopify](#415-shopify-integration) ·
   [jobs & retention](#416-background-jobs--retention) ·
   [uploads](#417-file-uploads)
5. [Cookbook: exact steps for common changes](#5-cookbook-exact-steps-for-common-changes)
6. [Testing your change](#6-testing-your-change)

---

## 1. Repository layout

```
chat/
  server/
    prisma/
      schema.prisma          every database table (see §4.2)
      migrations/             one dated folder per schema change, applied in order
    src/
      app.js                  Express app: mounts every router, CORS, CSP, static files, error handler
      index.js                process entry point (starts the HTTP server + background workers)
      config.js               env vars, the Prisma client singleton, the `clock` (see §6)
      errors.js               turns Zod/Prisma errors into HTTP responses
      lib/
        auth.js                JWT, roles, requireAuth/requireStore/requireSuper middleware
        crypto.js               AES-GCM encrypt/decrypt for secrets at rest (SMTP passwords, Shopify tokens, webhook secrets)
        util.js                 misc: origin parsing, audit log, asyncRoute wrapper, httpError
      realtime.js             WebSocket hub: both /ws/agent and /ws/visitor live here (see §4.3)
      routes/                 one file per REST area - thin: parse input, call a service, respond
      services/               the actual business logic (see area sections below)
      triggers/               the automation engine: catalog (definitions) + engine (execution)
    test/                   integration tests, one file per feature area (real Postgres, see §6)
    scripts/                 one-off ops scripts (seed-demo.js, purge-visitors.js)
  client/
    src/admin/              the agent dashboard (React + antd), served at /admin
      main.jsx                routing + the app Shell (top nav, store switcher, socket wiring)
      api.js                   fetch wrapper + shared formatting/role helpers
      socket.js                the dashboard's one WebSocket connection
      pages/                   one file per nav item (Inbox.jsx, Tickets.jsx, Triggers.jsx, ...)
      components/              shared pieces used by more than one page
    src/widget/              the embeddable chat widget, built as a single IIFE script
      embed.jsx                mounts the widget into a Shadow DOM on the host page
      ChatApp.jsx               all state + the API/WebSocket client for the widget
      ChatWindow.jsx            pure UI (also reused by the dashboard's live preview)
      styles.js                 the widget's entire CSS, as a template string (no separate .css file)
    vite.config.js           builds the dashboard → dist/admin
    vite.widget.config.js    builds the widget → dist/widget/chat.js (one file, no code-splitting)
  docs/                    you are here
```

Both apps are served by the **same Node process** (`server/src/app.js`): the API, both WebSocket
endpoints, the static dashboard build, and the static widget script. There's no separate frontend
server in production.

## 2. How to trace any request

Every server-side feature follows the same shape. If you're unsure where to even start, trace it in
this order:

1. **Find the route.** `grep -rn "the/url/path" server/src/routes` - every endpoint is a one-line
   `r.get(...)`/`r.post(...)`/etc. Routes are intentionally thin: they parse the request with a Zod
   schema, check permissions (`requireStore('ADMIN')` etc. - see §4.1), call one or two functions in
   `services/`, and shape the response. If you need to change *what data comes back* or *what's
   allowed*, the route file is usually enough.
2. **Follow it into `services/`.** This is where the actual logic lives: database writes, realtime
   pushes (`toAgents`/`toVisitor`), audit logging, event emission (`emit('trigger', ...)`,
   `emit('webhook', ...)`). If you need to change *what happens* (not just *what's returned*), you're
   editing here.
3. **Check `services/events.js` consumers.** Several things (the trigger engine, email alerts, the
   Bitrix24 integration, webhooks, push notifications) don't call each other directly - they listen for
   `emit('conversation.created', ...)`, `emit('trigger', ...)` or `emit('webhook', ...)` from
   `services/conversations.js`. `grep -rn "events.on(" server/src` to see every listener. This exists
   so `conversations.js` doesn't need to import six unrelated modules.
4. **On the client**, find the page in `client/src/admin/pages/` (named after the nav item) or the
   widget in `client/src/widget/ChatApp.jsx`. Every API call goes through `api()` (dashboard,
   `src/admin/api.js`) or `call()` (widget, defined inside `ChatApp.jsx`) - `grep` the endpoint path
   there to find the calling component.
5. **Realtime updates** arrive as a named socket event (e.g. `message`, `conversation`,
   `ticket_created`). `grep -rn "'eventName'" client/src/admin` to find every page that reacts to it.

## 3. Conventions used everywhere

Follow these so a new change fits in without a refactor:

- **Every store-scoped route** uses `requireStore(minRole)` from `lib/auth.js` and reads
  `req.params.storeId`. Never trust a `storeId` from the request body for an authorization decision -
  always the URL param, which the middleware has already checked. See §4.1.
- **Input validation is a Zod schema** at the top of the route, parsed with `.parse(req.body)`. Thrown
  `ZodError`s are turned into field-level 400 responses automatically by the error handler in `app.js`
  (`zodToResponse` in `errors.js`) - you don't need your own try/catch for validation.
- **Route handlers are wrapped in `asyncRoute`** (`lib/util.js`) so a thrown error (or rejected
  promise) reaches Express's error handler instead of crashing the process. Use `httpError(status,
  message)` to throw a specific HTTP status with a message the client will show as-is.
- **Side effects that aren't "respond to this HTTP request"** go through the job queue
  (`services/jobs.js`) or the event emitter (`services/events.js`), not inline in the route. Emails,
  webhooks, Bitrix24 alerts, push notifications and trigger actions are all jobs - they survive a
  restart and retry on failure. If you're adding something that calls an external service, make it a
  job (see §4.11 for the pattern).
- **Realtime pushes happen inside the service function**, right after the database write, in the same
  function that made the change - not in the route. This keeps "a conversation changed" and "tell the
  agents" together. Use `toAgents(storeId, type, data, conv)` / `toVisitor(visitorId, type, data)` from
  `realtime.js`.
- **Every destructive or sensitive action is audit-logged**: `await audit(req, 'action.name', { storeId,
  target, meta })` from `lib/util.js`. Check `server/src/routes/admin.js` for the string naming pattern
  (`store.created`, `member.added`, `widget.published`, ...) and match it.
- **Secrets at rest are encrypted**, never stored plain: `lib/crypto.js`'s `encryptJson`/`decryptJson`
  with `ENC_KEY`. Used for per-store SMTP passwords, the Shopify Admin API token, and webhook signing
  secrets. If you add a new secret field, encrypt it the same way - don't add a new plaintext column.
- **On the client, every page gets its per-store context from `useApp()`** (`main.jsx`): `{ me, isSuper,
  storeId, store, role, can, reloadMe, setUnread, connected }`. `can('SUPERVISOR')` etc. checks the
  current user's role in the current store client-side (the server re-checks independently - the client
  check is only for hiding UI the user couldn't use anyway).
- **Tests live next to the feature, named after it**, in `server/test/*.test.js` (`node:test`, real
  Postgres) and `client/src/**/*.test.jsx` (Vitest). When you add a route or a non-trivial client
  behaviour, add a test in the matching file rather than creating a new one, unless the feature is
  genuinely new (then follow the existing file's setup pattern - see §6).

## 4. Area-by-area map

### 4.1 Auth, roles & multi-tenancy

| | |
|---|---|
| Server | `server/src/lib/auth.js` (everything), `server/src/routes/auth.js` (login/me/password/logout-all/push device registration) |
| Client | `client/src/admin/pages/Login.jsx`, `client/src/admin/main.jsx` (`Ctx`/`useApp`, loads `/auth/me` on boot) |
| DB | `User`, `StoreMember` |

- Login issues a JWT (7 days) containing the user id and `tokenVersion`
  (`signToken`/`userFromToken` in `lib/auth.js`). Bumping `tokenVersion` (password change, "sign out
  everywhere", deactivation) invalidates every other token immediately - `userFromToken` checks it on
  every request.
- **Two kinds of role**: a platform-level `User.role` (`SUPER_ADMIN` or `USER`) and a per-store
  `StoreMember.role` (`OWNER`/`ADMIN`/`SUPERVISOR`/`AGENT`, ranked in that order by `RANK` in
  `lib/auth.js`). `storeRole(user, storeId)` resolves which one applies - a super admin is always
  `'SUPER'`, outranking everything. As of the "one main admin" change, new store members can only be
  created as `AGENT` from the dashboard (enforced in `routes/admin.js`'s `member.added` schema), but
  older `OWNER`/`ADMIN`/`SUPERVISOR` memberships keep working.
- `requireStore(minRole)` is the middleware on almost every store-scoped route. It reads
  `req.params.storeId`, looks up the role, and sets `req.storeRole` for the handler to use (e.g. to
  decide if a bulk action should also allow self-assignment for `AGENT`s).
- **Tenant isolation is "every tenant-owned query filters by `storeId`"** - there's no database-level
  row security; it's a convention enforced by always deriving `storeId` from `req.params.storeId` (which
  `requireStore` has already authorized) rather than from the request body. When adding a new query,
  copy the `where: { storeId: req.params.storeId, ... }` pattern from a neighbouring route.

### 4.2 Database schema & migrations

| | |
|---|---|
| Schema | `server/prisma/schema.prisma` |
| Migrations | `server/prisma/migrations/<timestamp>_<name>/migration.sql` |

Full model reference: [DATABASE.md](DATABASE.md). To **add a column or table**:

1. Edit `schema.prisma`.
2. Create a migration folder by hand: `server/prisma/migrations/<YYYYMMDDHHMMSS>_<short_name>/migration.sql`
   with plain `ALTER TABLE ... ADD COLUMN ...` (nullable, or `DEFAULT` a value so existing rows aren't
   broken - every migration so far is additive; follow that pattern). This repo creates migration SQL
   by hand rather than via `prisma migrate dev`, because `migrate dev` can prompt to reset the dev
   database, which must never touch real data (see [DATABASE.md](DATABASE.md)'s warning).
3. Run `npx prisma generate` in `server/` so the Prisma client's TypeScript/JS types match (needed
   before code using the new field will type-check/run cleanly against the client's generated API,
   though this is a plain-JS project so it mostly affects autocomplete and the `include`/`select`
   shapes available).
4. Apply it to your dev/test database with `npx prisma migrate deploy` (never `migrate reset` -
   see [DATABASE.md](DATABASE.md)).

### 4.3 Realtime (WebSockets)

| | |
|---|---|
| Server | `server/src/realtime.js` (the whole hub) |
| Client (dashboard) | `client/src/admin/socket.js` (connection), consumed via `onSocket()` in `main.jsx` and individual pages |
| Client (widget) | the WebSocket code inside `client/src/widget/ChatApp.jsx` (`connect()`/`sendWs()`) |

Two separate WebSocket endpoints, both upgraded in the one `attachRealtime()` function:

- **`/ws/agent?token=JWT`** - one per open dashboard tab. On connect it subscribes to every store the
  user is a member of (a super admin subscribes explicitly per store, via a `{type:'subscribe'}`
  message sent when they switch stores - see `subscribeStore()` in `socket.js`). Roles are captured at
  connect time in `ws.roles`; if a user's access changes server-side, call `disconnectUser(userId)` from
  `realtime.js` to force a reconnect so it re-authorizes.
- **`/ws/visitor?key=PUBLIC_KEY&vt=VISITOR_TOKEN`** - one per widget instance. The domain allowlist is
  enforced at the upgrade (`checkOrigin`, see §4.6), not just on the REST endpoints.
- **Sending events**: `toAgents(storeId, type, data, conv)` from any service function. Pass `conv` when
  the event is about a specific conversation - `AGENT`-role sockets then only receive it if the chat is
  unassigned or theirs (SUPERVISOR+ and super admins always receive it). `toVisitor(visitorId, type,
  data)` for the one visitor. `toStoreVisitors(storeId, type, data)` broadcasts to every visitor of a
  store (used for `config_updated` on publish).
- **Adding a new event type**: just call `toAgents`/`toVisitor` with a new `type` string from wherever
  the change happens - there's no registration step. On the client, add a branch in the relevant page's
  `onSocket((type, d) => { if (type === 'yourType') ... })` handler, or in `main.jsx`'s top-level handler
  if it's global (unread counts, sounds, toasts).
- **Single-instance only**: the socket maps (`agentSockets`, `visitorSockets`) are in-memory. Running
  more than one API process means each only sees its own sockets - see
  [ARCHITECTURE.md](ARCHITECTURE.md) for what a multi-instance deployment would need.

### 4.4 Chat messaging (the core pipeline)

| | |
|---|---|
| Server | `server/src/services/conversations.js` (all of it), called from `routes/widget.js` (visitor side) and `routes/inbox.js` (agent side) |
| Client (widget) | `client/src/widget/ChatApp.jsx` - `send()`, the `'message'` WS handler, `boot()` |
| Client (dashboard) | `client/src/admin/pages/Inbox.jsx` - the message list, composer, `onSocket` handler |
| DB | `Conversation`, `Message` |

This is the file to understand before touching anything chat-related. The four entry points:

- **`sendVisitorMessage(store, visitor, {...})`** - the only way a visitor message is created. Wrapped
  in a transaction with a per-visitor Postgres advisory lock (`lockVisitor`) so two near-simultaneous
  first messages from the same browser tab can't create two conversations. It resumes the visitor's
  existing non-expired conversation if there is one (`findResumable`), otherwise creates one. Idempotent
  on `clientMsgId` (a client-generated id) - a retried request returns the original message instead of
  duplicating it. After the transaction commits, it pushes to agents (`toAgents('message', ...)`), to
  the visitor's other tabs (`toVisitor`), enqueues a push-notification job, and (if the chat isn't in
  Spam) emits `'conversation.created'` (first message only) and `'trigger'` events that the trigger
  engine, email alerts and Bitrix24 all listen for.
- **`sendStaffMessage(storeId, conversationId, {...})`** - agent replies, internal notes (`senderType:
  'NOTE'`), bot messages (trigger actions, the welcome/please-wait messages) and system messages ("X
  joined the chat") all go through this one function, distinguished by `senderType`. Notes never reach
  the visitor (`toVisitor` is skipped for `senderType === 'NOTE'`). An `AGENT` message also sets
  `firstResponseAt` (used by Reports) and clears `unreadForAgent`.
- **`updateConversation(storeId, id, data, actor)`** - status/priority/assignee/tags changes. Emits the
  right trigger/webhook events on a status change to `RESOLVED`, and posts a system message when the
  assignee changes.
- **`messagesAfter(conversationId, afterSeq, { forVisitor })`** - reconnect recovery. Neither side
  replays missed messages over the socket; both re-fetch anything after their last-known `seq` over
  REST. `forVisitor: true` strips internal notes.
- **`visitorView(message)`** is the one function that decides what a visitor is allowed to see about a
  message (no internal notes, agents always shown as `"Customer Support"` via `AGENT_PUBLIC_NAME`, never
  the real agent name or id). If you add a new message field that should stay internal, don't add it to
  `visitorView`'s return shape.

### 4.5 Widget design / config (draft → publish)

| | |
|---|---|
| Server | `server/src/routes/admin.js` lines ~322-400 (`/stores/:id/widget*` routes), `server/src/services/stores.js` (`DEFAULT_WIDGET_CONFIG`, `widgetConfigSchema`, `getPublishedConfig`) |
| Client | `client/src/admin/pages/WidgetEditor.jsx` (the editor), `client/src/admin/components/ShadowPreview.jsx` (live preview pane) |
| DB | `WidgetConfig` (one store has many rows: `version: 0` is always the draft; `version: 1, 2, 3...` are published snapshots) |

- **The config shape and every default value** live in `DEFAULT_WIDGET_CONFIG` in `services/stores.js` -
  colors, launcher position/size, fonts, message texts, pre-chat form fields, business hours, behaviour
  toggles. `widgetConfigSchema` (Zod) is the validation for the whole shape. **To add a new widget
  setting**, add it to both: the default object (so old configs get a sensible value via
  `withFieldTypes`'s spread-merge pattern) and the schema (so it validates), then add the form field in
  `WidgetEditor.jsx`, then read it in `ChatApp.jsx`/`ChatWindow.jsx`.
- **Draft vs published**: `PUT /widget/draft` upserts the `version: 0` row - this is what the editor
  saves to as you type/change settings, and never affects the live site. `POST /widget/publish` copies
  the current draft into a new `version: N` row (wrapped in a Postgres advisory lock so two publishes
  can't race), bumps `Store.publishedVersion`, and immediately pushes the new config to every connected
  visitor (`toStoreVisitors('config_updated')`) and every agent dashboard (`toAgents('widget_published')`
  - used to update the live preview). The **widget itself only ever fetches/receives the published
  config**, never the draft - `getPublishedConfig(store)` reads whichever version
  `store.publishedVersion` points to.
- **"Clear history"** (`DELETE /widget/versions`) deletes old published snapshots but always keeps
  `version: 0` (the draft) and whichever version is currently live - it only shortens the version-history
  list in the editor.
- A config saved before a new field existed is backfilled by `withFieldTypes()` (same file) - this is
  the pattern to follow if you add a field that needs a non-trivial default for old rows (see how
  `afterPrechat` was backfilled when it was added).

### 4.6 The embeddable widget (`client/src/widget`)

| File | Role |
|---|---|
| `embed.jsx` | The script a merchant pastes onto their site. Reads `data-store` from its own `<script>` tag, creates a `position: fixed` host div, attaches an **open Shadow DOM** to it (so the host page's CSS can't break the widget and the widget's CSS can't leak out), and mounts `<ChatApp>` inside. |
| `ChatApp.jsx` | All widget state and the entire API/WebSocket client. No UI markup - renders `<ChatWindow>` with props. |
| `ChatWindow.jsx` | Pure presentational component. Also imported directly by `WidgetEditor.jsx` (the design live preview) and `Triggers.jsx` (the trigger message live preview) - both wrap it in `components/ShadowPreview.jsx`, a small generic shadow-root portal, to get the real widget CSS isolation. Because of this reuse, **don't put any widget-only API calls here** - everything data-related belongs in `ChatApp.jsx` and gets passed down as a prop/callback. |
| `styles.js` | The complete widget CSS as one exported template string, injected into the shadow root by `embed.jsx`. There's no separate `.css` file - search here for any visual change. |

How it boots (`ChatApp.jsx`):

1. On mount, calls `POST /api/widget/:key/session` with the visitor's stored token (if any) - this
   identifies or creates the `Visitor` row, returns the published widget config, availability
   (business hours), and the resumable conversation (if one exists and hasn't expired).
2. Opens the `/ws/visitor` socket (`connect()`) for live messages/typing/receipts; falls back to polling
   availability if there's no active conversation yet.
3. `send(text, extra)` adds an optimistic pending message locally, then POSTs it; `clientMsgId` makes
   retries safe. Incoming `'message'` socket events are merged into state by id/`clientMsgId` so nothing
   shows twice.
4. The pre-chat form, if enabled, is rendered before `mode: 'chat'`; on submit all the answers are
   joined into one `"Label : value"` per line and sent as the visitor's first message (see
   `prechatDetails()`, exported for its test). The server then sandwiches it between the welcome message
   and the "please wait" message (see `routes/widget.js`'s `/messages` handler) - both come from
   `WidgetConfig.messages`.
5. `preventStuckZoom()` (near the top of the file) works around an iOS Safari bug where the whole page
   can get stuck zoomed in after focusing a form field - scoped to the widget's own shadow root, iOS
   only. See its doc comment before touching it.

**Display rules, business hours, offline mode**: `matchesDisplayRules()` (page include/exclude
patterns), `isWithinBusinessHours()` (`services/stores.js`, shared with the server so the editor preview
and the live widget agree) and the `mode` state machine (`'prechat' | 'chat' | 'offline' |
'offline_sent' | 'hidden'`) in `ChatApp.jsx` together decide what's on screen.

### 4.7 Admin dashboard shell & routing (`client/src/admin`)

| File | Role |
|---|---|
| `main.jsx` | `Shell` component: top nav, store switcher, the `useApp()` context, the dashboard's one `onSocket` handler (routes every realtime event to unread counts / toasts / sounds), and the `<Routes>` table |
| `api.js` | `api(path, opts)` fetch wrapper (auth header, 401 → redirect to login, error shaping), `showError()`, shared formatters (`fmtDur`, `ROLE_LABEL`, `PRIORITY_COLOR`, ...) |
| `socket.js` | the one `WebSocket` connection, reconnect with backoff, `subscribeStore()` |
| `theme.js` | antd theme tokens (colors, density) - edit here for a global visual change, not per-component |

**Adding a new dashboard page**: create `pages/YourPage.jsx`, add a `<Route>` in `main.jsx` (follow the
existing pattern - gated on `storeId &&` for store-scoped pages, `isSuper &&` for platform-only ones),
and add a nav entry in the `Shell`'s menu items array (same file, search for the existing menu `items`
array built from icons + labels).

Every page follows the same shape: `useApp()` for `storeId`/role, `useEffect` that calls `api(...)` to
load data, an `onSocket` subscription (via `onSocket()` from `socket.js`) for live updates filtered by
`d.storeId === storeId`, and antd components for the UI. Look at `Visitors.jsx` for the shortest
complete example of this pattern.

### 4.8 Inbox (folders, bulk actions, ban, assignment)

| | |
|---|---|
| Server | `server/src/routes/inbox.js` |
| Client | `client/src/admin/pages/Inbox.jsx` (large - the conversation list, thread view, composer, bulk toolbar, ⋯ menu all live here) |
| DB | `Conversation.folder` (`INBOX`/`TRASH`/`SPAM`), `Visitor.bannedAt`/`bannedById`/`banReason` |

- **List/detail/messages/read-receipts/transcript download**: straightforward REST routes, each scoped
  by `requireStore('AGENT')` plus the `scope(req)` helper (top of `inbox.js`) that restricts an `AGENT`
  to unassigned + their own conversations (SUPERVISOR+ see everything).
- **Bulk actions** (`POST /conversations/bulk`) take `{ ids, action: 'assign'|'status'|'folder'|'delete',
  ...}`. Chats the caller isn't allowed to touch are silently skipped and reported back as `skipped` -
  **to add a new bulk action, add a case to the `if/else` chain here** and a matching option in the
  bulk-actions toolbar in `Inbox.jsx`.
- **Trash/Spam**: moving to either requires SUPERVISOR+; permanent delete (`DELETE
  /conversations/:id` or the `'delete'` bulk action) requires ADMIN+ and only works on chats already out
  of the Inbox folder - this is enforced server-side, not just hidden in the UI.
- **Ban**: `POST/DELETE /visitors/:visitorId/ban` sets/clears `Visitor.bannedAt` etc. Enforcement is in
  `routes/widget.js`'s `notBanned` middleware (applied to the visitor-facing message/offline/upload/
  contact endpoints), not in `inbox.js` - banning doesn't touch the WebSocket connection, only blocks
  new writes.
- **Live visitor monitoring** (`GET /visitors/live`) and **Shopify lookup** (`GET
  /conversations/:id/shopify`) are also in this file despite not being strictly "inbox" - see §4.13 and
  §4.15.

### 4.9 Tickets & email

| | |
|---|---|
| Server | `server/src/routes/tickets.js` (routes), `server/src/services/tickets.js` (logic), `server/src/services/notify.js` (SMTP + the email job) |
| Client | `client/src/admin/pages/Tickets.jsx`, `client/src/admin/components/TicketForm.jsx` |
| DB | `Ticket`, `TicketMessage`, `TicketAttachment` |

- **`createTicket`/`addTicketMessage`/`updateTicket`** in `services/tickets.js` are the equivalents of
  `conversations.js`'s functions for the ticket world. A ticket reply is an email - sending is a durable
  job (see §4.16's pattern) via `queueEmail`/`sendEmailNow` in `notify.js`, so it retries on a temporary
  SMTP failure and the UI shows a real "Sending.../Emailed/Not delivered" status rather than assuming
  success.
- **`ticketEmailReady(store)`** (= `emailConfigured(store)`) gates whether ticket creation/replying is
  even offered - a store with no SMTP (its own, via `Store.emailConfig`, or the server-wide `SMTP_*` env
  vars as fallback - see `smtpFor()` in `notify.js`) can't create tickets. If you're debugging "tickets
  don't work", check this function first.
- **Threading**: `Message-ID`/`In-Reply-To`/`References` headers and a `[#N]` subject prefix keep
  replies in the customer's existing email thread - see `sendEmailNow`'s header construction in
  `notify.js` and how `createTicket` assigns the per-store sequential number (`Store.ticketSeq`,
  incremented in the same transaction as ticket creation to avoid a race).
- **Inbound email replies are not implemented** - a customer's email reply lands in the SMTP `from`
  mailbox, not back in the ticket thread. This would need an inbound-parse webhook or IMAP polling;
  there's no scaffolding for it yet.

### 4.10 Triggers / automation engine

| | |
|---|---|
| Server | `server/src/triggers/catalog.js` (definitions + validation schema), `server/src/triggers/engine.js` (execution), `server/src/routes/triggers.js` (CRUD + copy-to-other-stores), `server/src/triggers/visitorInfo.js` (browser/platform/search-engine parsing used by some conditions) |
| Client | `client/src/admin/pages/Triggers.jsx` (list, editor, execution log, the "copy to other stores" modal) |
| DB | `Trigger`, `TriggerExecution` |

This is the most intricate area in the codebase; read `engine.js` top-to-bottom before changing it.

- **`catalog.js` is the single source of truth for what a trigger can express.** `EVENTS` (what can
  start a trigger), `FIELDS` (every condition, grouped - this is what populates the condition dropdown
  in the UI, with `type`, available `ops`, and for `enum` fields the allowed `options`), `ACTIONS` (what
  a trigger can do), `FREQUENCIES`, `TIMER_FROM` (event / last-customer-message / last-message delay
  anchors), and `TEMPLATES` (the built-in starter triggers offered in "From template"). `triggerSchema`
  (Zod) validates a trigger against all of this - **both the dashboard and the server validate against
  the exact same definitions**, served to the client via `GET /trigger-catalog`
  (`catalog()` at the bottom of the file).
- **`engine.js`'s `dispatch(evt)`** is called for every chat event (`emit('trigger', {...})` from
  `conversations.js` or recursively from a trigger action). It finds matching enabled triggers for that
  event+store, and for each one either runs it immediately (`delaySeconds === 0`) or schedules a durable
  `run_trigger` job for later. A cheap pre-check (`frequencyBlocked`) avoids scheduling redundant delayed
  runs for high-frequency events like `page_view`.
- **`execute(executionId)`** (what the `run_trigger` job calls) does an atomic `SCHEDULED → RUNNING`
  claim (so two workers can't run the same execution), re-checks the trigger is still enabled and hasn't
  been edited since (`trigger.version !== exec.triggerVersion` cancels it - editing a trigger
  invalidates anything already queued under the old definition), re-evaluates every condition against
  **fresh** data (`buildContext`), and only then runs the actions. "Still on site" / "Still on page"
  conditions (type `'wait'` in `FIELDS`) split a trigger's conditions into segments - each wake-up checks
  one segment and, if a wait follows, reschedules itself rather than completing.
- **Message-based timers** (`timerFrom: 'LAST_VISITOR'`/`'LAST_MESSAGE'`): `timerDue()` computes the
  real deadline from the conversation's `lastVisitorMessageAt`/`lastAgentMessageAt`. `execute()` checks
  if a newer message pushed that deadline later and, if so, re-parks the **same** execution at the new
  time instead of running - this is why a trigger with this timer mode never double-sends even though
  many messages can arrive before it wakes.
- **`buildContext({ storeId, visitorId, conversationId, text })`** assembles every value a condition
  might reference (`values` map, keyed by the same field keys as `FIELDS`) - this is where you compute a
  new value if you add a new condition field. See §5 for the exact steps to add one.
- **Actions** (`runAction`) are a `switch` on `action.type` - `send_message`, `send_saved_reply`,
  `show_contact_form`, `assign`, `add_tags`, `set_priority`, `notify`, `webhook`. `deliverBot()` is the
  shared path for the three message-sending actions: if there's a conversation it calls
  `sendStaffMessage`; if not (the chat doesn't exist yet - a proactive "Welcome" trigger), it stores the
  message as `proactive` on the execution and pushes it to the visitor's socket, to become the first
  real message once they reply (see `sendVisitorMessage`'s `proactive` parameter in §4.4).
- **Loop guard**: `loopGuard()` caps automated actions per conversation/visitor per minute
  (`LOOP_MAX`/`LOOP_WINDOW_MS` constants) so a trigger that (mis)fires another trigger can't spiral.
  `MAX_DEPTH` caps how many trigger-caused-trigger hops are allowed at all.

### 4.11 Notifications (email, webhooks, Bitrix24, push, sounds)

All four server-side notification channels are **jobs registered via `registerJob()`**
(`services/jobs.js`), triggered by listening for `emit('conversation.created', ...)` or
`emit('webhook', ...)` from `services/conversations.js` (see §3's convention). This is the pattern to
copy if you add a new outbound integration.

| Channel | File | Trigger |
|---|---|---|
| New-chat/offline email to the team | `services/notify.js` (`events.on('conversation.created', ...)` near the top) | every new chat/offline message, if the store has email configured and `emailOnNewChat`/`emailOnOffline` is on |
| Outgoing webhooks | `services/notify.js` (`registerJob('webhook', ...)`) | `emit('webhook', {storeId, event, data})` calls from `conversations.js` (also SSRF-guarded via `assertPublicUrl` in production) |
| Bitrix24 chat alert | `services/bitrix.js` | same `'conversation.created'` event; only active if `BITRIX24_WEBHOOK_URL`/`BITRIX24_DIALOG_ID` env vars are set (`bitrixConfig()`) |
| Mobile push | `services/push.js` | `enqueue('push_message', ...)` called directly from `sendVisitorMessage` in `conversations.js` (every visitor message, not just new chats) - sent via Expo's push API to tokens in `PushDevice` |
| Dashboard sounds (client-only) | `client/src/admin/sounds.js` (engine) + `client/src/admin/components/SoundControl.jsx` (UI) | a `'message'` socket event, filtered through `notifications.js`'s pure classification rules |

**Dashboard sounds in detail** (the most-edited part of this list): `sounds.js` exports `playSound(kind,
prefs)` where `kind` is `'newConversation'` or `'message'`. Per-kind the user can pick a built-in `TONES`
entry or upload their own file (`saveSoundFile`/`loadSoundFile`, stored as a data URL in `localStorage`,
decoded with `decodeAudioData` - **not** via `fetch()`, because the dashboard's CSP blocks that; see the
comment in `dataUrlToBuffer`/`decodeAudio`) and a repeat count (`MAX_REPEAT`). Preferences persist in
`localStorage` per browser, not server-side - there's no `SoundPrefs` database table. `notifications.js`
decides *whether* to sound (muted other-store events, de-duplication by message id via
`createDeduper()`) and `main.jsx` wires the socket handler to it.

### 4.12 Transcripts (download)

| | |
|---|---|
| Server | `server/src/services/transcript.js` (the shared text builder), two routes in `routes/widget.js` (visitor's own chat) and `routes/inbox.js` (staff, any chat they can see) |
| Client | widget: the ⋯ menu / chat-ended card in `ChatWindow.jsx`, `downloadTranscript()` in `ChatApp.jsx`. Dashboard: the ⋯ menu in `Inbox.jsx` (`downloadStaffTranscript()`) |

`transcriptText({ conv, store, forVisitor })` builds one plain-text file either way; `forVisitor: true`
strips internal notes and renames agents to `"Customer Support"` (same rule as `visitorView`, §4.4).
Both download endpoints respond with `Content-Disposition: attachment` and `Content-Type:
application/octet-stream` (not `text/plain`) so the browser always saves the file instead of navigating
to it - this matters specifically for the widget, which is embedded inside someone else's page that may
intercept normal link clicks. There's also an older `POST /:key/transcript` (emails it instead) still on
the server for backward compatibility, but the widget UI no longer offers it.

### 4.13 Visitor tracking & reports

| | |
|---|---|
| Server | `server/src/services/visitors.js` (identify/page-view/location), `server/src/routes/inbox.js`'s `GET /visitors/live`, `server/src/routes/reports.js` |
| Client | `client/src/admin/pages/Visitors.jsx`, `client/src/admin/pages/Reports.jsx` |
| DB | `Visitor`, `VisitorPageView` |

- **`identifyVisitor`** (called from `routes/widget.js`'s `/session`) matches a visitor by the hashed
  token in their browser storage, or creates one. `locate(ip)` does an approximate IP→country/city
  lookup via the bundled `geoip-lite` package (no outbound call). `recordPageView` logs navigation for
  the "Visitor navigated to..." timeline agents see in the conversation panel.
- **`GET /visitors/live`** (Visitors page) only lists visitors who filled the pre-chat form or started a
  chat - pure browsing isn't shown (see the `engaged` filter at the top of that route) - with a
  selectable time window from 5 minutes up to "all time".
- **Reports** (`routes/reports.js`) is a single big aggregation query over `Conversation`/`Message` for
  a date range, plus the "audience" breakdown (top countries/cities from `Visitor.country`/`city`, and a
  tally of any single-choice pre-chat question's answers, pulled from `Visitor.attributes`). There's no
  separate reports table - everything is computed on read.

### 4.14 Platform admin (super admin, stores, users)

| | |
|---|---|
| Server | `server/src/routes/admin.js` (stores CRUD, store members, platform users, the widget-enabled master switch) |
| Client | `client/src/admin/pages/Platform.jsx` (super-admin-only; store list + user list + "copy triggers" entry point) |

Store creation/deletion and the cross-store user list are `requireSuper`-only. The **"Widget on site"
master switch** (`PUT /platform/stores/:storeId/widget-enabled`, `Store.widgetEnabled`) is checked in
`services/stores.js`'s `loadStoreByKey()` - when off, the widget's own `/session` call 404s, same as an
inactive store, so flipping it takes effect immediately for every visitor without touching the domain
allowlist or anything else.

### 4.15 Shopify integration

| | |
|---|---|
| Server | `server/src/services/shopify.js`, the `/integrations/shopify*` routes in `routes/admin.js`, the `GET /conversations/:id/shopify` route in `routes/inbox.js` |
| Client | `client/src/admin/components/ShopifyPanel.jsx` (shown in the conversation side panel) |
| DB | `Store.shopifyDomain`, `Store.shopifyToken` (encrypted) |

A store connects a `.myshopify.com` domain and an Admin API token (custom app, `read_customers` +
`read_orders` scopes). `findCustomer(store, email)` queries Shopify's Admin GraphQL API for the matching
customer and their last order, looked up by the visitor's email (or one an agent types in). The token is
write-only from the dashboard (never returned once saved - `sealToken`/`shopifyConnected` in
`shopify.js`).

### 4.16 Background jobs & retention

| | |
|---|---|
| Server | `server/src/services/jobs.js` (the queue itself), `server/src/services/retention.js` (the one built-in sweep) |
| DB | `Job` |

**The pattern for anything that shouldn't block an HTTP response or that talks to an external
service**: `registerJob('your_type', async (payload, job) => { ... })` once, somewhere imported by
`app.js` (follow the `import './services/push.js'`-style side-effect imports at the top of `app.js`),
then `enqueue('your_type', payload, { storeId, dedupeKey, runAt })` from wherever the event happens.
Handlers must be **idempotent** - a crash after the real side-effect but before the job is marked `DONE`
re-runs it. Throw an error with `.permanent = true` to skip retries (e.g. invalid credentials that won't
fix themselves on their own); otherwise it retries with exponential backoff up to `maxAttempts`.
`dedupeKey` makes a second `enqueue()` with the same key a no-op - use it to make sure, e.g., "notify
about this message" can only ever be queued once even if the calling code runs twice.

`retention.js`'s `sweepExpired()` runs on a timer (`RETENTION_SWEEP_MINUTES`) via a self-scheduling
`retention_sweep` job, deleting conversations past `Conversation.expiresAt` along with their messages and
queuing their files for deletion (`delete_file` job) in the same transaction. See
[DATABASE.md](DATABASE.md) for exactly what extends `expiresAt`.

### 4.17 File uploads

| | |
|---|---|
| Server | `server/src/services/attachments.js`, upload/download routes in `routes/widget.js`, `routes/inbox.js`, `routes/tickets.js` |
| DB | `Attachment`, `TicketAttachment` |

Files are validated by **magic bytes**, not the claimed `Content-Type` or extension (`saveUpload` in
`attachments.js`) - only PNG/JPEG/GIF/WEBP/PDF/plain text are accepted, and the detected type must match
the file extension given. Stored under `UPLOAD_DIR` with a random generated name (`writeUpload`), never
served statically - every download goes through an authenticated route
(`streamAttachment`/`safeUploadPath`, the latter also used by `retention.js` and `transcript.js`'s
attachment-filename lookups) which sets `X-Content-Type-Options: nosniff` and forces `attachment`
disposition for anything that isn't an image.

## 5. Cookbook: exact steps for common changes

**Add a widget design setting** (e.g. a new color or text field): add it to `DEFAULT_WIDGET_CONFIG` and
`widgetConfigSchema` in `server/src/services/stores.js` → add the form field in
`client/src/admin/pages/WidgetEditor.jsx` → read `cfg.yourField` in `client/src/widget/ChatApp.jsx` or
`ChatWindow.jsx` → if it needs a sensible default for stores that published before your change, handle
that in `withFieldTypes()` in `stores.js` (see §4.5).

**Add a new trigger condition**: add an entry to `FIELDS` in `server/src/triggers/catalog.js` (key,
group, label, `type`, `ops`) → compute its value in `buildContext()`'s `values` object in
`server/src/triggers/engine.js` → it appears in the dashboard's condition dropdown automatically (driven
by the catalog, `client/src/admin/pages/Triggers.jsx`) - no client change needed unless the value type
needs special input UI (look at how `'wait'` or `'enum'` types render differently there).

**Add a new trigger action**: add an entry to `ACTIONS` in `catalog.js` and a Zod case to the
`actionSchema` discriminated union (same file) → add a `case 'your_action':` in `runAction()` in
`engine.js` → add the action's own fields to the trigger editor form in `Triggers.jsx` (follow an
existing action's `ActionFields` branch).

**Add a new bulk inbox action**: add the action key to the Zod schema in `routes/inbox.js`'s bulk route
→ add an `else if (b.action === 'your_action')` branch there → add the button to the bulk toolbar in
`Inbox.jsx` and wire it to call `bulk({ action: 'your_action', ... })`.

**Add a role permission check somewhere new**: use `requireStore('MINROLE')` on the server route (that's
the real check) and `can('MINROLE')` from `useApp()` on the client (just to hide UI the user can't use
anyway - never rely on the client check alone).

**Change what happens on a new chat / message / resolved conversation**: find the matching `emit(...)`
call in `services/conversations.js` and either change the payload there, or (for a new side-effect)
`events.on('that-event', async (payload) => {...})` somewhere new, following the job-queue pattern in
§4.11/§4.16 if it does anything beyond a quick in-memory update.

**Add a new outbound integration** (another Bitrix24-style alert): copy the shape of
`services/bitrix.js` almost exactly - a config-from-env function, a message-building function, an
`events.on('conversation.created', ...)` listener that enqueues a job, and a `registerJob(...)` that does
the actual HTTP call with a `.permanent = true` error for non-retryable failures. Import it for its side
effect in `app.js`.

**Add a field to the pre-chat form's available types**: add it to `PRECHAT_TYPES` and the validation
switch inside `cleanPrechatValue()` in `services/stores.js` → add the corresponding input to the form
builder in `WidgetEditor.jsx`'s pre-chat section → add rendering for it in whatever renders the live
form in `ChatWindow.jsx`.

**Change a database model**: see §4.2.

## 6. Testing your change

Full detail in [TESTING.md](TESTING.md). The short version:

- **Backend**: `cd server && npm test` runs every `test/*.test.js` against a real Postgres database
  pointed to by `TEST_DATABASE_URL` (falls back to `postgresql://postgres@localhost:5433/livechat_test`
  - **never point this at a database with real data**; the test harness truncates every table at the
  start of each file's `before()`). Tests spin up a real `createServer()` instance on a random port and
  make real HTTP/WebSocket calls (`test/helpers.js`'s `call()`/`socket()`/`say()`/`visit()` helpers).
  There's a virtual `clock` (`server/src/config.js`) the tests advance manually (`mods.clock.advance(ms)`)
  instead of using real `setTimeout` delays, and `mods.jobs.drain()` to run due jobs synchronously -
  copy this pattern from `test/triggers.test.js` or `test/trigger-timer.test.js` for anything
  involving delays or the job queue.
- **Frontend**: `cd client && npm test` (Vitest + Testing Library). Server calls are mocked via `vi.mock('../api.js', ...)`
  - look at any existing `*.test.jsx` for the pattern (e.g. `TriggerTimer.test.jsx` for a full
  page-with-catalog-mock example, `sounds.test.js` for pure-function tests with a fake
  `AudioContext`).
- Add your test to the file matching the feature area from the table of contents above, not a new file,
  unless there genuinely isn't one yet.
