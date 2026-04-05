import { useState, useEffect } from 'react';
import socket from './socket';
import Canvas from './Canvas';
import Chat from './Chat';
import Scoreboard from './Scoreboard';

export default function Room({ roomData, playerId }) {
  const [room, setRoom]           = useState(roomData?.room || {});
  const [inGame, setInGame]       = useState(false);
  const [drawerId, setDrawerId]   = useState(null);
  const [myWord, setMyWord]       = useState('');
  const [round, setRound]         = useState(1);
  const [maxRounds, setMaxRounds] = useState(3);
  const [gameOver, setGameOver]   = useState(false);
  const [winners, setWinners]     = useState([]);
  const [copied, setCopied]       = useState(false);

  const isHost   = room.host === playerId;
  const isDrawer = drawerId === playerId;

  useEffect(() => {
    socket.on('room_update', (updatedRoom) => {
      setRoom(updatedRoom);
    });

    socket.on('game_start', ({ round }) => {
      setInGame(true);
      setGameOver(false);
      setRound(round);
      setMyWord('');
    });

    socket.on('turn_start', ({ drawerId, round, timeLimit }) => {
      setDrawerId(drawerId);
      setRound(round);
      setMyWord('');
    });

    socket.on('your_word', ({ word }) => {
      setMyWord(word);
    });

    socket.on('round_start', ({ round }) => {
      setRound(round);
    });

    socket.on('game_over', ({ scores }) => {
      setGameOver(true);
      setInGame(false);
      setWinners(scores);
      setDrawerId(null);
      setMyWord('');
    });

    return () => {
      socket.off('room_update');
      socket.off('game_start');
      socket.off('turn_start');
      socket.off('your_word');
      socket.off('round_start');
      socket.off('game_over');
    };
  }, []);

  const startGame = () => {
    socket.emit('start_game');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomData?.roomId || room.id || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const players = room.players || [];

  // ── GAME OVER SCREEN ─────────────────────────────────────────────────────────
  if (gameOver) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginBottom: 6 }}>
            game over
          </div>
          <div style={{ fontSize: 28, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4 }}>
            {winners[0]?.name} wins!
          </div>
          <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 28 }}>
            {winners[0]?.score} points
          </div>

          <div style={{ textAlign: 'left', marginBottom: 24 }}>
            {winners.map((p, i) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0',
                borderBottom: i < winners.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none'
              }}>
                <div style={{ width: 28, textAlign: 'center', fontSize: i < 3 ? 18 : 13, color: 'var(--color-text-tertiary)' }}>
                  {['🥇','🥈','🥉'][i] || i + 1}
                </div>
                <div style={{ flex: 1, fontSize: 14, color: 'var(--color-text-primary)' }}>
                  {p.name}
                  {p.id === playerId && (
                    <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--color-text-tertiary)' }}>you</span>
                  )}
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                  {p.score} pts
                </div>
              </div>
            ))}
          </div>

          {isHost && (
            <button style={styles.primaryBtn} onClick={startGame}>
              Play again
            </button>
          )}
          {!isHost && (
            <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>
              Waiting for host to start again…
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── IN-GAME LAYOUT ───────────────────────────────────────────────────────────
  if (inGame) {
    return (
      <div style={styles.page}>
        {/* Top bar */}
        <div style={styles.topBar}>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Round <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{round}</span>
            <span style={{ color: 'var(--color-text-tertiary)' }}> / {room.maxRounds || maxRounds}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Category: <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>{room.category}</span>
          </div>
          <div style={{
            padding: '3px 10px', borderRadius: 20,
            background: isDrawer ? 'var(--color-background-warning)' : 'var(--color-background-info)',
            color: isDrawer ? 'var(--color-text-warning)' : 'var(--color-text-info)',
            fontSize: 12, fontWeight: 500
          }}>
            {isDrawer ? 'You are drawing' : 'You are guessing'}
          </div>
        </div>

        {/* Main game area */}
        <div style={styles.gameGrid}>
          {/* Scoreboard — left */}
          <div style={{ width: 200, flexShrink: 0 }}>
            <Scoreboard initialPlayers={players} />
          </div>

          {/* Canvas — center */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Canvas isDrawer={isDrawer} />
          </div>

          {/* Chat — right */}
          <div style={{ width: 260, flexShrink: 0 }}>
            <Chat isDrawer={isDrawer} currentWord={myWord} />
          </div>
        </div>
      </div>
    );
  }

  // ── LOBBY / WAITING ROOM ─────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <div style={{ maxWidth: 520, margin: '60px auto', width: '100%' }}>

        {/* Room code card */}
        <div style={{ ...styles.card, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>
              room code — share this
            </div>
            <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: 4, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
              {roomData?.roomId || room.id}
            </div>
          </div>
          <button style={styles.ghostBtn} onClick={copyCode}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Players card */}
        <div style={{ ...styles.card, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            Players ({players.length} / 10)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {players.map((p, i) => {
              const colors = [
                { bg: '#E1F5EE', text: '#085041' },
                { bg: '#EEEDFE', text: '#3C3489' },
                { bg: '#FAECE7', text: '#712B13' },
                { bg: '#FAEEDA', text: '#633806' },
                { bg: '#E6F1FB', text: '#0C447C' },
                { bg: '#FBEAF0', text: '#72243E' },
              ];
              const c = colors[i % colors.length];
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: c.bg, color: c.text,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 500, flexShrink: 0
                  }}>
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, fontSize: 14, color: 'var(--color-text-primary)' }}>
                    {p.name}
                    {p.id === playerId && (
                      <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--color-text-tertiary)' }}>you</span>
                    )}
                  </div>
                  {p.id === room.host && (
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 20,
                      background: 'var(--color-background-warning)',
                      color: 'var(--color-text-warning)'
                    }}>host</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Category + start */}
        <div style={styles.card}>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
            Category: <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>{room.category}</span>
          </div>

          {isHost ? (
            <>
              {players.length < 2 && (
                <div style={{
                  fontSize: 12, color: 'var(--color-text-warning)',
                  background: 'var(--color-background-warning)',
                  border: '0.5px solid var(--color-border-warning)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '6px 10px', marginBottom: 10
                }}>
                  Need at least 2 players to start
                </div>
              )}
              <button
                style={{ ...styles.primaryBtn, opacity: players.length < 2 ? 0.4 : 1 }}
                disabled={players.length < 2}
                onClick={startGame}
              >
                Start game
              </button>
            </>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', textAlign: 'center', padding: '8px 0' }}>
              Waiting for host to start the game…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    padding: '0 16px',
    fontFamily: 'var(--font-sans)',
    background: 'var(--color-background-tertiary)',
  },
  card: {
    background: 'var(--color-background-primary)',
    border: '0.5px solid var(--color-border-tertiary)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '1rem 1.25rem',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '0.5px solid var(--color-border-tertiary)',
    background: 'var(--color-background-primary)',
    flexWrap: 'wrap',
    gap: 8,
  },
  gameGrid: {
    display: 'flex',
    gap: 12,
    padding: '12px 16px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  primaryBtn: {
    width: '100%',
    padding: '10px 0',
    borderRadius: 'var(--border-radius-md)',
    border: '0.5px solid var(--color-border-secondary)',
    background: 'var(--color-background-primary)',
    color: 'var(--color-text-primary)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    transition: 'opacity 0.15s',
  },
  ghostBtn: {
    padding: '8px 16px',
    borderRadius: 'var(--border-radius-md)',
    border: '0.5px solid var(--color-border-secondary)',
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
};