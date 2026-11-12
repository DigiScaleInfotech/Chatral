# LiveChat documentation

A multi-store live chat platform: an embeddable website widget, a real-time agent dashboard, email tickets, triggers, reports and webhooks. One deployment serves many stores; each store's data, members and settings are isolated.

| Document | What it covers |
|---|---|
| [CODE-MAP.md](CODE-MAP.md) | **Start here to make a change**: which file does what, how to trace a request, step-by-step recipes for common changes |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Components, APIs, WebSockets, data flow |
| [SETUP.md](SETUP.md) | Prerequisites, install, environment variables, database, local start |
| [BUILD-DEPLOY.md](BUILD-DEPLOY.md) | Production build, HTTPS, reverse proxy, migrations, rollback |
| [FEATURES.md](FEATURES.md) | Features, user flows, settings, permissions, known limitations |
| [REALTIME-CHAT.md](REALTIME-CHAT.md) | Connections, messaging, reconnects, offline messages, sounds |
| [TICKETS-EMAIL.md](TICKETS-EMAIL.md) | Ticket lifecycle, SMTP queue, retries, threading, limits |
| [DATABASE.md](DATABASE.md) | Schema, migrations, retention, backups |
| [SECURITY.md](SECURITY.md) | Auth, roles, isolation, allowlists, uploads, secrets |
| [TESTING.md](TESTING.md) | Test commands, coverage, manual checks, verified vs unverified |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Common problems and fixes |

## Repository layout

```
chat/
  server/   Node.js API + WebSocket server + job worker (Express, Prisma, PostgreSQL, ws)
    prisma/         schema.prisma and migrations
    src/routes/     REST endpoints (auth, admin, inbox, tickets, triggers, reports, widget)
    src/services/   conversations, tickets, notify (email + webhooks), jobs, retention, ...
    src/triggers/   trigger catalog and engine
    test/           integration tests (node:test, real PostgreSQL)
  client/   React dashboard (/admin) and the embeddable widget (/widget/chat.js)
    src/admin/      dashboard (Vite + antd)
    src/widget/     widget (Shadow DOM, built as one IIFE script)
    demo/           local test storefront
  docs/INBOX_AUDIT.md    feature comparison with tawk.to (2026-10-19, historical)
  docs/IMPLEMENTATION_REPORT.md    review of 2026-10-16, incl. the first malware incident (historical)
  docs/SECURITY_INCIDENT_2026-10-19.md  GitHub credential misuse / malware incident report
```

Status labels used in these docs: **Verified** = covered by automated tests and/or checked in a browser; **Not verified** = implemented but not exercised end to end; **Not implemented** = missing.
