import { useState, useEffect, useRef } from 'react';
import socket from './socket';

export default function Chat({ isDrawer, currentWord }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [hint, setHint] = useState('');
  const [drawerName, setDrawerName] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const bottomRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    socket.on('turn_start', ({ drawerId, drawerName, wordLength, timeLimit }) => {
      setHint('_ '.repeat(wordLength).trim());
      setDrawerName(drawerName);
      setTimeLeft(timeLimit);
      setMessages([]);

      if (timerRef.current) clearInterval(timerRef.current);
      let remaining = timeLimit;
      timerRef.current = setInterval(() => {
        remaining -= 1;
        setTimeLeft(remaining);
        if (remaining <= 0) clearInterval(timerRef.current);
      }, 1000);
    });

    socket.on('hint_update', ({ hint: newHint }) => {
      setHint(newHint);
    });

    socket.on('turn_end', ({ word }) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeLeft(0);
      setMessages(prev => [
        ...prev,
        { id: Date.now(), type: 'system', text: `The word was: ${word}` }
      ]);
      setHint('');
    });

    socket.on('chat_message', ({ playerId, playerName, message, isCorrect }) => {
      setMessages(prev => [
        ...prev,
        { id: Date.now() + Math.random(), playerId, playerName, message, isCorrect, type: 'chat' }
      ]);
    });

    socket.on('game_over', () => {
      if (timerRef.current) clearInterval(timerRef.current);
      setHint('');
      setTimeLeft(0);
    });

    return () => {
      socket.off('turn_start');
      socket.off('hint_update');
      socket.off('turn_end');
      socket.off('chat_message');
      socket.off('game_over');
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed || isDrawer) return;
    socket.emit('guess', { message: trimmed });
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  const timerColor = timeLeft > 20
    ? 'var(--color-text-success)'
    : timeLeft > 10
    ? 'var(--color-text-warning)'
    : 'var(--color-text-danger)';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 420,
      background: 'var(--color-background-primary)',
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: 'var(--border-radius-lg)',
      overflow: 'hidden',
      fontFamily: 'var(--font-sans)'
    }}>

      {/* Header — word hint + timer */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        background: 'var(--color-background-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1 }}>
          {isDrawer && currentWord ? (
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>
                your word to draw
              </div>
              <div style={{
                fontSize: 18,
                fontWeight: 500,
                letterSpacing: 2,
                color: 'var(--color-text-primary)'
              }}>
                {currentWord}
              </div>
            </div>
          ) : hint ? (
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>
                {drawerName ? `${drawerName} is drawing` : 'guess the word'}
              </div>
              <div style={{
                fontSize: 18,
                fontWeight: 500,
                letterSpacing: 4,
                color: 'var(--color-text-primary)'
              }}>
                {hint}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>
              waiting for next turn…
            </div>
          )}
        </div>

        {timeLeft > 0 && (
          <div style={{
            fontSize: 22,
            fontWeight: 500,
            color: timerColor,
            minWidth: 36,
            textAlign: 'right',
            transition: 'color 0.3s'
          }}>
            {timeLeft}
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: 'var(--color-text-tertiary)',
            fontSize: 13,
            marginTop: 24
          }}>
            {isDrawer ? 'Others will guess here' : 'Type your guess below'}
          </div>
        )}

        {messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id} style={{
                textAlign: 'center',
                fontSize: 12,
                color: 'var(--color-text-secondary)',
                padding: '4px 10px',
                background: 'var(--color-background-secondary)',
                borderRadius: 20,
                alignSelf: 'center'
              }}>
                {msg.text}
              </div>
            );
          }

          const isSelf = msg.playerId === socket.id;

          return (
            <div key={msg.id} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isSelf ? 'flex-end' : 'flex-start'
            }}>
              {!isSelf && (
                <div style={{
                  fontSize: 11,
                  color: 'var(--color-text-tertiary)',
                  marginBottom: 2,
                  paddingLeft: 4
                }}>
                  {msg.playerName}
                </div>
              )}
              <div style={{
                maxWidth: '82%',
                padding: '6px 12px',
                borderRadius: isSelf ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                fontSize: 13,
                lineHeight: 1.5,
                background: msg.isCorrect
                  ? 'var(--color-background-success)'
                  : isSelf
                  ? 'var(--color-background-info)'
                  : 'var(--color-background-secondary)',
                color: msg.isCorrect
                  ? 'var(--color-text-success)'
                  : isSelf
                  ? 'var(--color-text-info)'
                  : 'var(--color-text-primary)',
                border: msg.isCorrect
                  ? '0.5px solid var(--color-border-success)'
                  : '0.5px solid var(--color-border-tertiary)',
                fontWeight: msg.isCorrect ? 500 : 400
              }}>
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 12px',
        borderTop: '0.5px solid var(--color-border-tertiary)',
        display: 'flex',
        gap: 8
      }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={isDrawer}
          placeholder={isDrawer ? 'You are drawing — no guessing!' : 'Type your guess…'}
          maxLength={60}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 'var(--border-radius-md)',
            border: '0.5px solid var(--color-border-secondary)',
            background: isDrawer
              ? 'var(--color-background-secondary)'
              : 'var(--color-background-primary)',
            color: 'var(--color-text-primary)',
            fontSize: 13,
            outline: 'none',
            cursor: isDrawer ? 'not-allowed' : 'text',
            opacity: isDrawer ? 0.6 : 1
          }}
        />
        <button
          onClick={sendMessage}
          disabled={isDrawer || !input.trim()}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--border-radius-md)',
            border: '0.5px solid var(--color-border-secondary)',
            background: 'transparent',
            color: 'var(--color-text-primary)',
            fontSize: 13,
            cursor: isDrawer || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: isDrawer || !input.trim() ? 0.4 : 1,
            transition: 'opacity 0.15s'
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}