
const { startGame, nextTurn, checkGuess, handleDraw } = require('./game');

const rooms = new Map();

function makeRoomId() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

function handleConnection(socket, io) {

  socket.on('create_room', ({ playerName, category }, cb) => {
    const roomId = makeRoomId();
    const player = { id: socket.id, name: playerName, score: 0 };
    rooms.set(roomId, {
      id: roomId, host: socket.id,
      players: [player], category: category || 'sports',
      gameState: 'lobby', currentWord: '',
      drawerIndex: 0, round: 0, maxRounds: 3, timer: null
    });
    socket.join(roomId);
    socket.roomId = roomId;
    cb({ roomId, room: sanitize(rooms.get(roomId)) });
    io.to(roomId).emit('room_update', sanitize(rooms.get(roomId)));
  });
  socket.on('join_room', ({ playerName, roomId }, cb) => {
    const room = rooms.get(roomId);
    if (!room) return cb({ error: 'Room not found' });
    if (room.players.length >= 10) return cb({ error: 'Room full' });
    if (room.gameState !== 'lobby') return cb({ error: 'Game in progress' });
    const player = { id: socket.id, name: playerName, score: 0 };
    room.players.push(player);
    socket.join(roomId);
    socket.roomId = roomId;
    cb({ roomId, room: sanitize(room) });
    io.to(roomId).emit('room_update', sanitize(room));
  });

  socket.on('start_game', () => {
    const room = rooms.get(socket.roomId);
    if (!room || socket.id !== room.host) return;
    if (room.players.length < 2) return;
    startGame(room, io);
  });
socket.on('draw', (data) => {
  handleDraw(socket, io, data);
});

socket.on('guess', ({ message }) => {
  const room = rooms.get(socket.roomId);
  if (room) checkGuess(room, io, socket, message);
});
   socket.on('disconnect', () => {
    const room = rooms.get(socket.roomId);
    if (!room) return;
    room.players = room.players.filter(p => p.id !== socket.id);
    if (room.players.length === 0) {
      if (room.timer) clearTimeout(room.timer);
      rooms.delete(socket.roomId);
      return;
    }
    if (room.host === socket.id) room.host = room.players[0].id;
    io.to(socket.roomId).emit('room_update', sanitize(room));
    if (room.gameState === 'playing') {
      const drawer = room.players[room.drawerIndex];
      if (!drawer || drawer.id === socket.id) nextTurn(room, io, rooms);
    }
  });
}

function sanitize(room) {
  return { ...room, currentWord: '', timer: null };
}

module.exports = { rooms, handleConnection };