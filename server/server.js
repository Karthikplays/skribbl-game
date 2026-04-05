const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const path       = require('path');
const compression = require('compression');
const { handleConnection } = require('./rooms');

/* ─── Constants ─────────────────────────────────────────────────── */
const PORT        = process.env.PORT || 3001;
const CLIENT_PATH = path.join(__dirname, '../client/dist');
const IS_PROD     = process.env.NODE_ENV === 'production';

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.CLIENT_URL,
].filter(Boolean);

/* ─── App ────────────────────────────────────────────────────────── */
const app    = express();
const server = http.createServer(app);

/* ─── Socket.IO ──────────────────────────────────────────────────── */
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'], credentials: true },
  transports: ['websocket', 'polling'],
  pingTimeout:  20000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6,   // 1 MB — prevent oversized draw payloads
});

/* ─── Middleware ─────────────────────────────────────────────────── */
app.use(cors({ origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'], credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10kb' }));

// Lightweight security headers (no extra dependency needed)
app.use((_, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

/* ─── Static (SPA) ───────────────────────────────────────────────── */
app.use(express.static(CLIENT_PATH, {
  maxAge: IS_PROD ? '7d' : 0,
  index: false,
  etag: true,
}));

/* ─── Routes ─────────────────────────────────────────────────────── */
app.get('/health', (_, res) => {
  res.json({
    ok:      true,
    uptime:  Math.floor(process.uptime()),
    players: io.engine.clientsCount,
    env:     IS_PROD ? 'production' : 'development',
  });
});

// SPA fallback — must be last route
app.use((req, res) => {
  res.sendFile(path.join(CLIENT_PATH, 'index.html'), (err) => {
    if (err) {
      console.error('index.html not found:', err.message);
      res.status(404).json({
        error: 'Client build not found — run: cd client && npm run build',
      });
    }
  });
});

/* ─── Global error handler ───────────────────────────────────────── */
app.use((err, req, res, next) => {
  console.error('[Express error]', err.stack);
  res.status(err.status || 500).json({
    error: IS_PROD ? 'Internal server error' : err.message,
  });
});

/* ─── Sockets ────────────────────────────────────────────────────── */
io.on('connection', (socket) => {
  log(`+ ${socket.id}  (total: ${io.engine.clientsCount})`);

  try {
    handleConnection(socket, io);
  } catch (err) {
    console.error('[Socket setup error]', err);
    socket.disconnect(true);
  }

  socket.on('error', (err) => {
    console.error(`[Socket error] ${socket.id}`, err.message);
  });

  socket.on('disconnect', (reason) => {
    log(`- ${socket.id}  (${reason})  remaining: ${io.engine.clientsCount}`);
  });
});

/* ─── Keep-alive ping (Render free tier) ────────────────────────── */
if (process.env.RENDER_EXTERNAL_URL) {
  setInterval(() => {
    fetch(`${process.env.RENDER_EXTERNAL_URL}/health`)
      .then(r => r.ok && log('keep-alive ok'))
      .catch(() => {});
  }, 14 * 60 * 1000);
}

/* ─── Start ──────────────────────────────────────────────────────── */
server.listen(PORT, () => {
  log(`Server on port ${PORT}`);
  log(`Origins: ${ALLOWED_ORIGINS.join(', ')}`);
});

/* ─── Graceful shutdown ──────────────────────────────────────────── */
function shutdown(signal) {
  log(`${signal} — shutting down gracefully`);
  io.close();
  server.close(() => {
    log('Closed. Bye.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 8000).unref(); // force-exit after 8s
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('uncaughtException',  (err) => {
  console.error('[Uncaught exception]', err);
  shutdown('uncaughtException');
});
process.on('unhandledRejection', (err) => {
  console.error('[Unhandled rejection]', err);
  shutdown('unhandledRejection');
});

/* ─── Helper ─────────────────────────────────────────────────────── */
function log(msg) {
  const ts = new Date().toISOString().slice(11, 19); // HH:MM:SS
  console.log(`[${ts}] ${msg}`);
}