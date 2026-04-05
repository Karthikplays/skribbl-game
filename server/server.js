const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
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

app.use(express.static(path.join(__dirname, '../client/dist')));

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
  console.log('Connected:', socket.id);
  handleConnection(socket, io);
  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.get('/health', (_, res) => res.json({ ok: true }));

// Keep Render free tier awake
const SELF_URL = process.env.RENDER_EXTERNAL_URL;
if (SELF_URL) {
  setInterval(() => {
    fetch(`${SELF_URL}/health`).catch(() => {});
  }, 14 * 60 * 1000);
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server on port ${PORT}`);
  console.log(`Allowed origins:`, allowedOrigins);
});