# Database

PostgreSQL via Prisma (`server/prisma/schema.prisma`). Use a database dedicated to this app.

## Main models

| Model | Purpose |
|---|---|
| `User`, `StoreMember` | Accounts (bcrypt hashes, `tokenVersion` for revoking sessions) and per-store roles/presence |
| `Store`, `WidgetConfig` | Tenants (public key, allowed domains, retention days, encrypted SMTP), draft/published widget versions |
| `Visitor` | Anonymous visitors (SHA-256 of the browser token), page/device info, ban fields (`bannedAt`, `bannedById`, `banReason`) |
| `Conversation`, `Message`, `Attachment` | Chats (status, priority, assignee, tags, `folder` INBOX/TRASH/SPAM, retention timestamps, read/delivered seq), messages (unique `conversationId+seq` and `conversationId+clientMsgId`), private files |
| `Ticket`, `TicketMessage`, `TicketAttachment` | Email tickets (per-store number, unique `storeId+requestId`), thread entries with email status, files |
| `SavedReply`, `Trigger`, `TriggerExecution` | Shortcuts (public/private), automation rules and their run log |
| `Job` | Durable job queue |
| `Webhook`, `WebhookDelivery` | Outgoing webhooks and delivery log |
| `UsageDaily`, `AuditLog` | Usage counters, audit trail |

Every tenant-owned row carries `storeId`; queries always filter by it.

## Migrations

`server/prisma/migrations` (applied in order):

1. `20261016091854_init`
2. `20261017120000_saved_reply_access` - shortcut access levels
3. `20261019100000_tickets` - ticket tables + `Store.ticketSeq`
4. `20261019120000_ban_and_folders` - visitor ban columns, `Conversation.folder` (default `INBOX`) + index
5. `20261019140000_visitor_page_views` - `VisitorPageView` table (navigation history)
6. `20261019150000_shopify_integration` - `Store.shopifyDomain`, `Store.shopifyToken` (encrypted)
7. `20261019170000_visitor_attributes` - `Visitor.attributes` (pre-chat answers, nullable JSON)
8. `20261021100000_visitor_location` - `Visitor.country`, `Visitor.city` (approximate, nullable)
9. `20261021120000_store_widget_enabled` - `Store.widgetEnabled` (master switch, default true)
10. `20261022100000_visitor_ip_user_agent` - `Visitor.ip`, `Visitor.userAgent` (trigger conditions; nullable)
11. `20261024100000_trigger_timer_from` - `Trigger.timerFrom` (default `EVENT`; existing triggers unchanged)

All migrations after `init` are additive (new tables, nullable columns or columns with defaults). Existing rows are not modified.

### Safe procedure

```bash
cd chat/server
npx prisma migrate status        # read-only: shows pending migrations
# back up first (pg_dump), then:
npx prisma migrate deploy        # applies pending files only
```

Never use `prisma migrate dev`, `migrate reset` or `db push` on a database with real data. To check for drift without changing anything: `npx prisma migrate diff --from-url "$DATABASE_URL" --to-migrations prisma/migrations --shadow-database-url <empty scratch db> --script` (empty output = no drift).

## Retention

`Conversation.expiresAt = lastActivityAt + retentionDays` (default 30, per store). Only visitor messages and an explicit resume move it; page views, agent/bot/system messages and notes do not. A durable job (every `RETENTION_SWEEP_MINUTES`) deletes only the **attachments/media** of expired conversations (and queues file deletion in the same transaction); the conversation and its text messages are kept, with `Message.attachmentId` cleared and `Message.meta.removedAttachment = { filename }` left as a marker. Trash/Spam do not change retention. Tickets are not subject to it.

## Backups

Back up the database and `UPLOAD_DIR` together (attachments are referenced by path). Test restores on a separate database.
