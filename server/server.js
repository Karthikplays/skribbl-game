const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { handleConnection } = require('./rooms');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);
  handleConnection(socket, io);
  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);
  });
});
app.get('/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});