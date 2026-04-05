const { getWord } = require('./words');

function startGame(room, io) {
  room.gameState = 'playing';
  room.drawerIndex = 0;
  room.round = 1;
  room.players.forEach(p => p.score = 0);
  room.guessedPlayers = new Set();
  io.to(room.id).emit('game_start', { round: room.round });
  beginTurn(room, io);
}

function beginTurn(room, io) {
  room.currentWord = getWord(room.category);
  room.guessedPlayers = new Set();
  const drawer = room.players[room.drawerIndex];

  io.to(room.id).emit('turn_start', {
    drawerId: drawer.id,
    drawerName: drawer.name,
    wordLength: room.currentWord.length,
    round: room.round,
    timeLimit: 60
  });
  io.to(drawer.id).emit('your_word', { word: room.currentWord });

  room.timer = setTimeout(() => nextTurn(room, io), 60000);
}

function nextTurn(room, io) {
  if (room.timer) { clearTimeout(room.timer); room.timer = null; }
  io.to(room.id).emit('turn_end', { word: room.currentWord });

  room.drawerIndex++;

  if (room.drawerIndex >= room.players.length) {
    room.round++;
    room.drawerIndex = 0;
    if (room.round > room.maxRounds) {
      return endGame(room, io);
    }
    io.to(room.id).emit('round_start', { round: room.round });
  }

  setTimeout(() => beginTurn(room, io), 3000);
}

function checkGuess(room, io, socket, guess) {
  if (room.gameState !== 'playing') return;
  const drawer = room.players[room.drawerIndex];
  if (socket.id === drawer.id) return;
  if (room.guessedPlayers.has(socket.id)) return;

  const isCorrect = guess.trim().toLowerCase() === room.currentWord.toLowerCase();

  io.to(room.id).emit('chat_message', {
    playerId: socket.id,
    playerName: room.players.find(p => p.id === socket.id)?.name,
    message: isCorrect ? '*** guessed the word! ***' : guess,
    isCorrect
  });

  if (isCorrect) {
    const points = 100;
    const player = room.players.find(p => p.id === socket.id);
    if (player) player.score += points;
    drawer.score += 20;
    room.guessedPlayers.add(socket.id);

    io.to(room.id).emit('scores_update',
      room.players.map(p => ({ id: p.id, name: p.name, score: p.score }))
    );

    const guessers = room.players.filter(p => p.id !== drawer.id);
    if (room.guessedPlayers.size >= guessers.length) nextTurn(room, io);
  }
}

function endGame(room, io) {
  room.gameState = 'lobby';
  const sorted = [...room.players].sort((a, b) => b.score - a.score);
  io.to(room.id).emit('game_over', { scores: sorted });
}

function handleDraw(socket, io, data) {
  socket.to(socket.roomId).emit('draw', data);
}

module.exports = { startGame, nextTurn, checkGuess, handleDraw };