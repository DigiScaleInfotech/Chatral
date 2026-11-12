# Implementation report – Multi-store live chat

Last updated: 2026-10-16 (final pre-deployment review). Nothing in this review was committed, pushed or deployed.

## ⚠️ Security incident – read first
The original commits `ab23158` and `4727ad8` contained an **obfuscated malware payload** appended (after ~18,000 characters of whitespace padding) to `client/vite.config.js`.

**Cleanup done (local only):**
- The local history was rewritten. Those commits are now `eb8b07d` and `8db61e2` with a clean config; the fix commit is gone because nothing is left to fix; `bf3f567` is the head with identical code. Every object in the repo was scanned clean.
- The same payload was found in `Downloads/node-image-upload-main.zip` → `src/routes/image.routes.js`. That entry was cleaned (the real routes were kept) and is the likely original source.
- `Chat Widget.zip` is no longer in Downloads.
- No payload remains in any file under the user profile (including `node_modules`, global npm and the npx cache) or in any ZIP in Downloads.
- GitHub still has the old commits; see `../HISTORY_CLEANUP.md`.

- What it is (decoded as text only, never executed): a Node loader using `child_process.spawn` (detached, `unref`) and `eval`, which looks up its next stage via public Ethereum RPC endpoints: `1rpc.io`, `eth-mainnet.public.blastapi.io`, `eth.blockscout.com`, `eth.drpc.org`, `ethereum-rpc.publicnode.com`.
- It ran every time Vite ran (`npm run dev` / `npm run build`) while the infected config was present. Vite was run on this machine during that window, so **treat the machine as compromised**.
- Both commits are on GitHub (`origin/main` history). Anyone checking them out and running Vite gets infected.

Required actions (owner decision – not done by this review):
1. Run a full anti-malware scan; check startup items, scheduled tasks and unknown `node` processes; consider reinstalling the OS.
2. From a clean device, rotate **everything reachable from this machine**: GitHub (password, tokens, SSH keys), npm tokens, browser-saved passwords/sessions, cloud/hosting credentials, crypto wallets.
3. Rotate application secrets (key names only):
   - Calendar app (`server.zip` → `.env`): `DATABASE_URL` password, `JWT_SECRET`, `ENC_KEY`, `GOOGLE_CLIENT_SECRET` (and review the OAuth client), `ADMIN_PASSWORD`. In `.env.production`: `DATABASE_URL` password, `JWT_SECRET`, `ENC_KEY`.
   - Live chat (`chat/server/.env`, local development values): `JWT_SECRET`, `ENC_KEY`, `ADMIN_PASSWORD`, `DEMO_PASSWORD`. These are not production values, but they were inside `Chat Widget.zip`.
4. Replace the GitHub history with the cleaned local history (push steps in `../HISTORY_CLEANUP.md`). Needs the owner's permission.

## Secrets in distributables
- `Downloads/Chat Widget.zip` was rewritten without `chat/server/.env`, `node_modules`, `dist`, `uploads` and macOS metadata. It has since been deleted.
- `Downloads/server.zip` (calendar app) still contains `.env`, `.env.production` and their `__MACOSX` copies with real values. It was **not modified** because it may be the only copy of that configuration. Remove the files from any copy you share, after backing them up somewhere safe.
- Git: `.env` was never committed (only `server/.env.example`). `.gitignore` excludes `.env*`, `node_modules`, `dist`, `uploads`.

## Dependency integrity (this review)
- Lockfiles resolve every package from `https://registry.npmjs.org`. There are no `preinstall`/`postinstall`/`prepare` scripts in the project.
- Clean `npm ci` from the lockfiles: `npm audit signatures` → server: 99 packages with verified registry signatures (14 attestations); client: 240 verified (57 attestations).
- No payload markers were found in tracked files, the build output (`client/dist`), or the Vite configs inside the ZIPs in `Downloads`.

## What the project contains
`chat/server`: Express + Prisma/PostgreSQL API, WebSockets (`ws`), durable Postgres job queue, trigger engine, retention sweep. One migration: `20261016091854_init`.
`chat/client`: antd dashboard (`dist/admin`) and the Shadow-DOM embed widget (`dist/widget/chat.js`, 55.6 kB gzip).
Features: per-store roles (Owner/Admin/Supervisor/Agent + platform super admin); installation snippet, domain allowlist, diagnostics and key rotation; widget designer with draft/publish/versions and live preview; real-time inbox; Basic/Advanced triggers with durable delays and execution logs; 30-day rolling retention; email/webhook notifications; reports; privacy export/erase.

## Defects fixed in the last two reviews (all with regression tests)
| Defect | Test proves it (fails on old code) |
|---|---|
| Unknown-email login ~4× faster than wrong password (account enumeration) | timing ratio test (old code: 0.26) |
| Agents could send typing indicators into other agents' chats | `tenancy-chat` regression |
| Widget never inherited the shop font | `client/src/widget/embed.test.jsx` |
| Duplicate alerts; targeted alerts shown to everyone | `client/src/admin/notifications.test.js` |
| Reports bucketed days and ranges in UTC instead of store timezone | `reports.test.js` (incl. range boundary) |
| Removed/deactivated agents kept receiving live messages over an open socket | `tenancy-chat` "cuts off their live socket" |
| No CSP on the dashboard (JWT in localStorage) | CSP header test + browser check (no violations) |
| Widget designer live preview rendered 0 px wide at every size | browser check |
| Widget panel cut off on phones narrower than the panel | browser check (CSS) |

No new code defects were found in this final review.

## Tests and builds actually executed (this review, after clean `npm ci`)
| Check | Result |
|---|---|
| Backend integration tests (`server: npm test`, real Postgres 18 + HTTP + WebSockets) | **36 / 36 passed** |
| Frontend unit tests (`client: npm test`, Vitest + jsdom) | **9 / 9 passed** (3 files) |
| Production builds (`client: npm run build`) | dashboard ✓, widget ✓ |
| Lint | No linter configured in the repo. ESLint 9 run from a scratch folder: 2 findings, both intentional omit-destructures |
| Type checks | Not configured (plain JavaScript) |

The backend suite covers: cross-store API/WS/file denial, origin allowlist, visitor-token scoping, persist-then-ack and idempotent `clientMsgId`, reconnect recovery, receipts/typing, role scoping and assignment rules, member/owner guards, key-rotation grace, token revocation and socket cut-off, upload sniffing, draft vs published config, 20-day continuity, rolling expiry (only qualifying activity), deletion incl. files, never-restored, concurrent sweepers, message-vs-sweep races, cleared/forged tokens, per-store retention, triggers (delay, recheck, idempotency, cancellation, loop guard, cooldown, ALL/ANY, validation, signed webhook, business hours, follow-up), timezone reports, login timing, CSP header.

## Browser checks (built app in the in-app browser, local demo storefront)
Done in this or the previous review:
- No horizontal overflow on 8 dashboard pages at 320/390/768/1024/1440 px (measured in the DOM; screenshots wider than ~700 px render scaled in this browser).
- Widget preview renders. Publishing a colour change reached the storefront without a snippet change.
- Exactly one toast for a visitor message while the owner was on another page.
- Dashboard pages show no CSP violations.
- The widget inherits the page font.
- The mobile full-screen panel is inset with rounded corners.
- Earlier session: two stores in one browser, live agent ↔ visitor chat, resume after reload, cross-store token rejection.

## Not verified / remaining limitations
- **Shopify:** never tested on a real Shopify storefront (none available); only a local demo page.
- **Email:** never tested against a real SMTP server; the code reports "not sent" when SMTP is absent.
- **Interrupted triggers:** an execution interrupted by a crash mid-run stays `RUNNING` and is not retried (avoids duplicate actions); it needs manual review in the logs.
- **Multiple servers:** realtime fan-out, rate limits and uploads are per process/disk. Run one instance, or add pub/sub (Redis or Postgres LISTEN/NOTIFY), a shared rate-limit store and shared file storage (see README).
- **Proxy:** `trust proxy` is set for exactly one reverse proxy.
- **Login token:** the dashboard JWT is in localStorage (mitigated by CSP, not eliminated).
- **No automated UI tests** for full dashboard pages (inbox, trigger builder); covered manually.
- **Desktop visuals:** above ~700 px, desktop layouts were checked by measurement, not by eye.

## Deployment readiness
The application code is ready for a **controlled deployment** (single instance, HTTPS, steps in README), **but only after** the security incident is handled:
1. Clean or rebuild the machine (or build on a clean CI runner).
2. Rotate the credentials listed above.
3. Purge the infected commits from GitHub.
4. Use new, never-exposed production secrets.
