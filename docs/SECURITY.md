# Security

## Authentication

- Dashboard login issues a JWT (7 days) signed with `JWT_SECRET`, containing the user id and `tokenVersion`. Changing the password or signing out everywhere bumps `tokenVersion`, which invalidates all other sessions. Deactivated users are rejected.
- Passwords: bcrypt (cost 12); login compares against a dummy hash for unknown emails (no user enumeration by timing). Login is rate-limited (20 attempts / 15 min per IP).
- Visitors are anonymous: a random token in browser storage, stored server-side only as SHA-256.

## Authorization and tenant isolation

- Every store route checks the caller's role in **that** store (`requireStore(minRole)`); super admins can act on any store.
- Roles: one main admin (super admin) and agents; the server refuses a second main admin and only grants the Agent store role (legacy Owner/Admin/Supervisor memberships keep their rights). Agents only see unassigned chats/tickets and their own; legacy supervisor+ and the main admin see all. Bulk actions apply the same scope and skip (report) anything outside it.
- WebSocket events are only sent to sockets subscribed to the event's store, with the same agent scoping. Tests verify that another store's owner receives none of them.
- Ban/Trash/Spam/permanent delete are restricted (Supervisor+, Admin+ for delete) and audit-logged.

## Widget security

- **Domain allowlist** per store, enforced on the server for every widget API call and on the visitor WebSocket upgrade. Only listed domains work (`example.com` also covers `www.example.com`; `*.example.com` covers subdomains; ports are ignored). **A store with no domains is blocked on every website** (the Installation health check shows this). Origins are parsed strictly: credentials, paths and non-http(s) schemes are rejected. `localhost` is not special - add `localhost` to a store's domains to use the local demo storefront. Requests without an `Origin` header (scripts, curl) are refused; only the automated test suite (`NODE_ENV=test`) allows them. The dashboard's own origin (widget preview) and the pop-out window page are always allowed.
- The main admin can switch a store's widget off (`Store.widgetEnabled`); the widget API and visitor socket then refuse that store.
- Banned visitors get 403 on message, offline, contact and upload endpoints.
- The widget renders in a Shadow DOM; message text is rendered as text, not HTML.

## Uploads

- Type is detected from file contents (magic bytes) - PNG, JPEG, GIF, WEBP, PDF, plain text - and must match the extension; HTML/SVG/script-like text is rejected. Size limit `MAX_UPLOAD_MB`.
- Stored under `UPLOAD_DIR` with random names; never served statically. Downloads go through authenticated routes with `X-Content-Type-Options: nosniff`, a sandboxing CSP and `attachment` disposition for non-images.

## Secrets

- `BITRIX24_WEBHOOK_URL` contains a secret: keep it only in `.env`; regenerate it in Bitrix24 if it was ever shared.
- Dependencies: `nodemailer` is pinned to 10.0.16 (fixes advisories in 6.x, including cross-tenant TLS servername reuse); `npm audit --omit=dev` is clean on the server. Client: `react-router-dom` 6 has a moderate advisory fixed only in v7 (open redirect via user-supplied link targets, and SSR - neither used here); dev-only tooling (vitest, esbuild dev server) has advisories that don't ship in the build.

- Keep secrets only in `server/.env` (git-ignored) or your host's secret store. `.env.example` contains names and empty values only.
- `ENC_KEY` encrypts webhook signing secrets and per-store SMTP passwords at rest.
- Webhooks are signed (`X-Livechat-Signature: sha256=HMAC(secret, timestamp.body)`); in production, webhook URLs must be `https://` and may not resolve to private addresses (SSRF guard).
- If a secret is ever committed or shared: rotate it (`JWT_SECRET` signs everyone out; changing `ENC_KEY` makes stored webhook/SMTP secrets unreadable, so re-enter them).

## Production checklist

- `NODE_ENV=production`, strong `JWT_SECRET` and `ENC_KEY`, HTTPS only, correct `trust proxy` hop count.
- Domain allowlist set for every store.
- Database and uploads backed up; `npm audit` / `npm audit signatures` on install.
- The dashboard sends a strict CSP (`script-src 'self'`, `frame-ancestors 'none'`); helmet defaults are on for the API.

## Incident history

- [SECURITY_INCIDENT_2026-10-19.md](SECURITY_INCIDENT_2026-10-19.md) - GitHub credential misuse and malware re-injection (open containment steps in section 7).
- [IMPLEMENTATION_REPORT.md](IMPLEMENTATION_REPORT.md) - first malware incident (2026-10-16).
