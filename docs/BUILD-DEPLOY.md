# Build and deploy

## Build

```bash
cd chat/client && npm ci && npm run build     # dist/admin (dashboard) + dist/widget/chat.js
cd ../server && npm ci && npx prisma generate
```

The API serves `client/dist` itself; no separate web server is needed for the dashboard or widget.

## Deploy steps

1. Create a dedicated PostgreSQL database and user.
2. Set all variables from [SETUP.md](SETUP.md) with `NODE_ENV=production`, a strong `JWT_SECRET` (32+ chars; the server refuses to start in production without it) and `ENC_KEY` (64 hex; without it the server starts but webhooks and store SMTP settings cannot be saved).
3. **Back up the database**, then `npx prisma migrate deploy` (applies only new, additive migration files).
4. `npm run seed` once for the first super admin.
5. Run `npm start` under a process manager (systemd, pm2, Docker restart policy).
6. Put HTTPS in front and forward WebSocket upgrades for `/ws/`.

## HTTPS is required for real websites

A shop on `https://` cannot load an `http://` script or open a `ws://` socket (mixed content). Set `API_URL` and `ADMIN_URL` to the public `https://` address; the widget derives `wss://` from its script URL automatically.

nginx example:

```nginx
location / {
  proxy_pass http://127.0.0.1:4100;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_read_timeout 75s;
}
```

`app.set('trust proxy', 1)` assumes exactly one proxy hop (needed for per-IP rate limits). Adjust it if a CDN sits in front as well.

For a quick test without a server you can use an HTTPS tunnel (e.g. Cloudflare Tunnel, ngrok) to a local instance; set `API_URL`/`ADMIN_URL` to the tunnel URL and restart.

## Install the widget on a store

Dashboard → Store settings → Installation: add the shop's domain(s) to the allowlist and paste the snippet before `</body>`. With no domains configured any site can load the widget (the diagnostics panel warns about this).

## Scaling limits (single instance)

Jobs and retention are safe across several instances. **Not** shared yet: WebSocket fan-out (in memory), rate limits (per process) and uploads (local disk). Run one instance until a pub/sub (Redis or Postgres LISTEN/NOTIFY), a shared rate-limit store and shared file storage are added.

## Rollback precautions

- Migrations are additive (new tables/columns with defaults); an older build ignores the new columns, so rolling back the code is safe. Do not hand-drop columns during a rollback.
- Restore from backup only as a last resort; it loses chats received since the backup.
- Keep `UPLOAD_DIR` and the database backed up together (attachments are referenced by path).
- Never run `prisma migrate reset` or `migrate dev` in production.
