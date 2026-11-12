# Troubleshooting

## Startup

| Symptom | Cause / fix |
|---|---|
| `JWT_SECRET must be set (32+ chars) in production` | Set a 32+ character `JWT_SECRET` (`openssl rand -hex 32`). |
| `ENC_KEY is missing/invalid` warning | Set `ENC_KEY` to 64 hex characters; without it webhooks and store SMTP settings can't be saved. |
| `Cannot find module '@prisma/client'` / Prisma errors after install | Run `npm ci` then `npx prisma generate` in `server/` (npm may hold back install scripts). |
| `npx prisma ...` prints an unknown-command error | `node_modules` is missing, so npx fetched another Prisma version. Run `npm ci` first; use `npx --no-install prisma`. |
| Dashboard shows a blank page / 404 at `/admin` | Build the client: `cd client && npm run build`. |
| Port already in use | Change `PORT` or stop the other process. |

## Database

| Symptom | Fix |
|---|---|
| `The table ... does not exist` / missing column | Pending migration: `npx prisma migrate status`, back up, `npx prisma migrate deploy`. |
| `P3015 Could not find the migration file` | A migration folder without `migration.sql` exists; remove the stray empty folder. |
| Tests wiped data | The backend tests truncate their database. Only run them with a throwaway `DATABASE_URL`. |

## HTTPS, WebSockets, widget

| Symptom | Fix |
|---|---|
| Widget doesn't appear on an `https://` site; console shows mixed content | Serve the API over HTTPS and set `API_URL`/`ADMIN_URL` to the `https://` URL. |
| `This website is not allowed to use this chat widget` (403) / widget doesn't appear | Add the site's domain in Store settings → Installation (subdomains: `*.example.com`). A store with no domains is blocked everywhere. For the local demo add `localhost` (and open it as `localhost`, not `127.0.0.1`). |
| Widget script and session load (200) but nothing shows | The theme hides empty `div`s (Shopify Dawn: `div:empty{display:none}`); fixed in the current `chat.js` - rebuild the client and hard-refresh. Also check Platform → **Widget on site** is On and the store's display rules/desktop/mobile toggles. |
| Visitor location shows "Unknown" | Only visits after the location update are located. Behind nginx, pass the client IP: `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` (and keep `trust proxy` = number of proxies). |
| No Bitrix24 message for a new chat | Both `BITRIX24_WEBHOOK_URL` and `BITRIX24_DIALOG_ID` must be set (restart with `pm2 restart livechat --update-env`); the webhook needs the `im` scope. Check `pm2 logs` for `[bitrix24]`. |
| `Cannot find package 'ws'` / every test file fails at start | `node_modules` is missing: `npm ci` then `npx prisma generate`. |
| WebSocket fails behind nginx | Forward `Upgrade`/`Connection` headers for `/ws/` and set `proxy_read_timeout` ≥ 60 s (see BUILD-DEPLOY.md). |
| Widget shows the offline form | It is outside the store's business hours (agent online status is not used). |
| "You can no longer send messages in this chat." | That visitor was banned; unban from the chat's ⋯ menu. |
| Visitor's old chat isn't resumed | It expired (retention) or was deleted permanently. Chats in Trash/Spam do continue. |
| Console full of `WebSocket connection ... failed` | Logged while the server was down; clients retry with backoff and recover missed messages after reconnecting. |

## Sounds

| Symptom | Fix |
|---|---|
| Header icon says "Sound blocked by browser" | Click anywhere in the dashboard or press "Enable sound" (browser autoplay policy). |
| No sound for a message | Sounds play only for visitor messages; check the master and per-sound switches in the header sound menu. |

## Email / tickets

| Symptom | Fix |
|---|---|
| "Email is not set up" | Configure SMTP in Store settings → Notifications & SMTP (host, port, security, username, password, from address) and press "Send test email", or set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` and restart. |
| Not receiving new-chat emails | Check Store settings → Notifications & SMTP → Email delivery: SMTP must be configured, and the recipient list must include a real address (team members with "Email me" on, or Notification emails). Super admins who aren't store members don't receive store alerts. The server log shows `[email] … not sent - …` with the reason. |
| Reply stays "Sending…" | Temporary SMTP error; it is retried with backoff (hover for the last error). Check the worker is running (`RUN_WORKERS` not `false`). |
| Reply shows "Not delivered" | Permanent rejection (bad address, auth). Fix the cause and press Retry. |
| Reports show "Reports could not be loaded" | The server returned an error; check the server log for the exception, and that `npx prisma migrate status` shows no pending migrations. |
| Customer's reply isn't in the ticket | Inbound email is not implemented; replies stay in the `From` mailbox. |

## Printing

| Symptom | Fix |
|---|---|
| "Printing is not available in this browser." | The browser blocked printing from a frame; use a desktop browser (Chrome, Edge, Firefox). |
