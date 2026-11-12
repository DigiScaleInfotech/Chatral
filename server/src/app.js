import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ZodError } from 'zod';
import { config } from './config.js';
import { zodToResponse, prismaToResponse } from './errors.js';
import { attachRealtime } from './realtime.js';
import widgetRoutes, { onVisitorEvent } from './routes/widget.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import inboxRoutes from './routes/inbox.js';
import ticketRoutes from './routes/tickets.js';
import triggerRoutes from './routes/triggers.js';
import reportRoutes from './routes/reports.js';
import analyticsRoutes from './routes/analytics.js';
// Side-effect imports register event listeners + job handlers.
import './triggers/engine.js';
import './services/notify.js';
import './services/push.js';
import './services/retention.js';

export function createServer() {
  const app = express();
  const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(express.json({ limit: '100kb' }));

  // Widget API is called from merchant sites; the per-store origin allowlist is enforced inside the routes.
  app.use('/api/widget', cors({ origin: true, allowedHeaders: ['Content-Type', 'X-Visitor-Token', 'X-Filename'], maxAge: 600 }), widgetRoutes);
  const adminCors = cors({ origin: new URL(config.adminUrl).origin });
  app.use('/api/auth', adminCors, authRoutes);
  app.use('/api', adminCors, adminRoutes, inboxRoutes, ticketRoutes, triggerRoutes, reportRoutes, analyticsRoutes);

  // Static: embeddable widget + admin SPA (client: npm run build).
  // Pop-out chat window: a full-page widget on this server's origin. It refuses to start until the
  // store page that opened it hands over the visitor session via postMessage (no token in the URL).
  app.get('/widget/popout', (req, res) => {
    const key = String(req.query.key || '');
    if (!/^pk_[A-Za-z0-9_-]{6,64}$/.test(key)) return res.status(400).send('Invalid chat link');
    res.set({
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' https: data: blob:; connect-src 'self' ws: wss:; frame-ancestors 'none'; base-uri 'none'",
      'Cache-Control': 'no-store',
    });
    res.type('html').send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Chat</title>
<style>html,body{margin:0;height:100%;background:#f1f5f9;font-family:system-ui,sans-serif}</style></head>
<body><script src="/widget/chat.js" data-store="${key}" data-popout="1"></script></body></html>`);
  });
  app.use('/widget', express.static(path.join(clientDist, 'widget'), { maxAge: '5m' }));
  // The dashboard keeps its JWT in localStorage, so lock down what its pages may load or run.
  // antd injects inline styles, hence 'unsafe-inline' for styles only.
  const adminCsp = helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'], imgSrc: ["'self'", 'https:', 'data:', 'blob:'],
      connectSrc: ["'self'", 'ws:', 'wss:'], objectSrc: ["'none'"], baseUri: ["'self'"], frameAncestors: ["'none'"], formAction: ["'self'"],
    },
  });
  app.use('/admin', adminCsp);
  app.use('/admin', express.static(path.join(clientDist, 'admin')));
  app.get('/admin/*', (req, res) => res.sendFile(path.join(clientDist, 'admin/index.html')));
  app.get('/favicon.ico', (req, res) => res.sendFile(path.join(clientDist, 'admin/favicon.ico')));
  app.get('/apple-touch-icon.png', (req, res) => res.sendFile(path.join(clientDist, 'admin/apple-touch-icon.png')));
  app.get('/', (req, res) => res.redirect('/admin/'));
  app.get('/health', (req, res) => res.json({ ok: true }));

  app.use((err, req, res, next) => {
    if (err instanceof ZodError) return res.status(400).json(zodToResponse(err));
    const db = prismaToResponse(err);
    if (db) return res.status(db[0]).json(db[1]);
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid request data' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large' });
    if (!err.status) console.error(err);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Something went wrong on our side. Please try again.' });
  });

  const server = http.createServer(app);
  const wss = attachRealtime(server, { onVisitorEvent });
  return { app, server, wss };
}
