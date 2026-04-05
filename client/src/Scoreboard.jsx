import { useState, useEffect } from 'react';
import socket from './socket';

const MEDALS = ['🥇', '🥈', '🥉'];

function getInitials(name = '') {
  return name.trim().slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  { bg: '#E1F5EE', text: '#085041' },
  { bg: '#EEEDFE', text: '#3C3489' },
  { bg: '#FAECE7', text: '#712B13' },
  { bg: '#FAEEDA', text: '#633806' },
  { bg: '#E6F1FB', text: '#0C447C' },
  { bg: '#FBEAF0', text: '#72243E' },
  { bg: '#EAF3DE', text: '#27500A' },
  { bg: '#FCEBEB', text: '#791F1F' },
];

function avatarColor(index) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export default function Scoreboard({ initialPlayers = [] }) {
  const [players, setPlayers] = useState(
    [...initialPlayers].sort((a, b) => b.score - a.score)
  );
  const [gameOver, setGameOver] = useState(false);
  const [prevScores, setPrevScores] = useState({});
  const [deltas, setDeltas] = useState({});

  useEffect(() => {
    socket.on('scores_update', (updated) => {
      setPrevScores(prev => {
        const newDeltas = {};
        updated.forEach(p => {
          const old = prev[p.id] ?? p.score;
          if (p.score > old) newDeltas[p.id] = p.score - old;
        });
        setDeltas(newDeltas);
        setTimeout(() => setDeltas({}), 1800);
        const next = {};
        updated.forEach(p => { next[p.id] = p.score; });
        return next;
      });
      setPlayers([...updated].sort((a, b) => b.score - a.score));
    });

    socket.on('game_over', ({ scores }) => {
      setPlayers([...scores].sort((a, b) => b.score - a.score));
      setGameOver(true);
    });

    socket.on('turn_start', () => {
      setGameOver(false);
    });

    socket.on('room_update', ({ players: roomPlayers }) => {
      if (!roomPlayers) return;
      setPlayers(prev => {
        const scoreMap = {};
        prev.forEach(p => { scoreMap[p.id] = p.score; });
        return [...roomPlayers]
          .map(p => ({ ...p, score: scoreMap[p.id] ?? 0 }))
          .sort((a, b) => b.score - a.score);
      });
    });

    return () => {
      socket.off('scores_update');
      socket.off('game_over');
      socket.off('turn_start');
      socket.off('room_update');
    };
  }, []);

  const topScore = players[0]?.score ?? 0;

  return (
    <div style={{
      fontFamily: 'var(--font-sans)',
      background: 'var(--color-background-primary)',
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: 'var(--border-radius-lg)',
      overflow: 'hidden',
      minWidth: 200,
    }}>

      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        background: 'var(--color-background-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
          {gameOver ? 'Final scores' : 'Scoreboard'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
          {players.length} player{players.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Game over winner banner */}
      {gameOver && players.length > 0 && (
        <div style={{
          padding: '14px',
          background: 'var(--color-background-warning)',
          borderBottom: '0.5px solid var(--color-border-warning)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-warning)', marginBottom: 4 }}>
            winner
          </div>
          <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {players[0].name}
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            {players[0].score} pts
          </div>
        </div>
      )}

      {/* Player list */}
      <div style={{ padding: '8px 0' }}>
        {players.length === 0 && (
          <div style={{
            padding: '20px 14px',
            textAlign: 'center',
            fontSize: 13,
            color: 'var(--color-text-tertiary)',
          }}>
            No players yet
          </div>
        )}

        {players.map((player, index) => {
          const color = avatarColor(index);
          const delta = deltas[player.id];
          const isFirst = index === 0;
          const barWidth = topScore > 0
            ? Math.max(4, Math.round((player.score / topScore) * 100))
            : 0;

          return (
            <div
              key={player.id}
              style={{
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                borderBottom: index < players.length - 1
                  ? '0.5px solid var(--color-border-tertiary)'
                  : 'none',
                background: isFirst && !gameOver
                  ? 'var(--color-background-secondary)'
                  : 'transparent',
                transition: 'background 0.3s',
                position: 'relative',
              }}
            >
              {/* Rank */}
              <div style={{
                width: 20,
                textAlign: 'center',
                fontSize: index < 3 ? 16 : 12,
                color: 'var(--color-text-tertiary)',
                flexShrink: 0,
              }}>
                {index < 3 ? MEDALS[index] : index + 1}
              </div>

              {/* Avatar */}
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: color.bg,
                color: color.text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 500,
                flexShrink: 0,
              }}>
                {getInitials(player.name)}
              </div>

              {/* Name + bar */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: isFirst ? 500 : 400,
                  color: 'var(--color-text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginBottom: 4,
                }}>
                  {player.name}
                  {player.id === socket.id && (
                    <span style={{
                      marginLeft: 6,
                      fontSize: 10,
                      color: 'var(--color-text-tertiary)',
                      fontWeight: 400,
                    }}>
                      you
                    </span>
                  )}
                </div>
                {/* Score bar */}
                <div style={{
                  height: 3,
                  background: 'var(--color-border-tertiary)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${barWidth}%`,
                    background: index === 0
                      ? '#1D9E75'
                      : index === 1
                      ? '#7F77DD'
                      : index === 2
                      ? '#D85A30'
                      : 'var(--color-border-secondary)',
                    borderRadius: 2,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>

              {/* Score + delta */}
              <div style={{
                textAlign: 'right',
                flexShrink: 0,
                minWidth: 40,
              }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                }}>
                  {player.score}
                </div>
                {delta && (
                  <div style={{
                    fontSize: 11,
                    color: 'var(--color-text-success)',
                    fontWeight: 500,
                    animation: 'fadeUp 1.8s ease forwards',
                  }}>
                    +{delta}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes fadeUp {
          0%   { opacity: 1; transform: translateY(0); }
          70%  { opacity: 1; transform: translateY(-4px); }
          100% { opacity: 0; transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}