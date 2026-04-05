const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const { handleConnection } = require('./rooms');
const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  credentials: true,
}));

app.use(express.json());
app.use(compression()); // gzip compression
const clientPath = path.join(__dirname, '../client/dist');

app.use(express.static(clientPath, {
  maxAge: '1d', // cache static assets
  index: false,
}));
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

io.on('connection', (socket) => {
  console.log('✅ Connected:', socket.id);

  try {
    handleConnection(socket, io);
  } catch (err) {
    console.error('Socket error:', err);
  }

  socket.on('disconnect', () => {
    console.log('❌ Disconnected:', socket.id);
  });
});

app.get('/health', (_, res) => {
  res.status(200).json({ ok: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'), (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Internal Server Error');
    }
  });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

const SELF_URL = process.env.RENDER_EXTERNAL_URL;

if (SELF_URL) {
  setInterval(() => {
    fetch(`${SELF_URL}/health`).catch(() => {});
  }, 14 * 60 * 1000);
}
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Allowed origins:`, allowedOrigins);
});