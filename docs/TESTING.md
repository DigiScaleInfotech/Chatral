# Testing

## Commands

```bash
# Backend: integration tests against a REAL PostgreSQL database that is TRUNCATED by the tests.
# Point DATABASE_URL at a throwaway database - never at one with data you need.
cd chat/server
DATABASE_URL=postgresql://USER@localhost:5432/livechat_test npm test

# Frontend: unit/component tests (Vitest + jsdom), no server needed
cd chat/client && npm test

# Production build (dashboard + widget)
cd chat/client && npm run build
```

The backend test helper runs `prisma migrate deploy` on the test database and truncates all tables before the suite.

## Automated coverage (last run 2026-10-21: backend 83/83, frontend 65/65, build OK)

| Suite | Covers |
|---|---|
| `server/test/tenancy-chat.test.js` | Store isolation, roles, visitor identity/resume, messaging, dedupe, receipts, offline form, uploads, allowlist |
| `server/test/retention.test.js` | 30-day rolling retention rules and sweep |
| `server/test/triggers.test.js` | Trigger engine, waits, cooldowns, execution log |
| `server/test/reports.test.js` | Report metrics |
| `server/test/users.test.js` | Platform users, deletion guards |
| `server/test/tawk-gaps.test.js` | Shortcut access, sequential waits, visitor monitoring, widget toggles, `isNewConversation` flag |
| `server/test/tickets.test.js` | Ticket creation/validation, real SMTP delivery to an in-test server, retries, threading, failures, permissions, isolation |
| `server/test/inbox-actions.test.js` | Ban/unban enforcement, Trash/Spam/restore, resume rules, permanent-delete guard, bulk permissions, isolation, live events |
| `server/test/users.test.js` (roles) | One main admin + agents, agent store access, master widget switch, bulk visitor delete, store creation adds an agent |
| `server/test/bitrix.test.js` | Bitrix24 alert against a simulated portal: one message per chat, retries, bad credentials, off when unconfigured |
| `server/test/tracking-shopify.test.js` | Availability without presence, retention notice value, page-view timeline (order, live, isolation, retention), Shopify settings/lookup with simulated Shopify (admin-only, domain check, encrypted token, errors, isolation) |
| `client/src/admin/*.test.js(x)` | Sound classification/dedupe/unlock, notification rules, transcript printing (escaping), Tickets page and form, inbox table, visitors page, users admin |

## Manual browser checks (performed on a test database)

- Visitor ↔ agent messaging in real time with two agents; new-chat and message sounds once each; agent replies silent.
- API restart: automatic reconnect, same conversation, no duplicates; offline message saved and announced.
- Store isolation: a second store's agent socket received no events.
- Tickets: offline message → ticket → reply → note → status change; email caught by a local SMTP server.
- Inbox: bulk move to Trash and restore (other agent's list updated live), ban → widget blocked with message, print transcript, 390 px layout.
- Responsive: 320/390/768/1024/1440 px for Tickets; all dashboard pages at 768 px.

## Not verified

- A real website over HTTPS on a public domain; email through a real provider.
- Audible sound on speakers; Safari autoplay rules; browsers other than Chromium.
- Multi-instance deployment.
- Printing to paper/PDF (the print call and transcript content are verified; the browser dialog is not).
