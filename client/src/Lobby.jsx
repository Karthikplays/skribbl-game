import { useState } from 'react'
import socket from './socket'

const CATEGORIES = ['sports', 'movies', 'games', 'animals', 'food']

export default function Lobby({ onJoined }) {
  const [tab, setTab]           = useState('create')  // 'create' | 'join'
  const [name, setName]         = useState('')
  const [roomId, setRoomId]     = useState('')
  const [category, setCategory] = useState('sports')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleCreate = () => {
    if (!name.trim()) return setError('Enter your name')
    setError('')
    setLoading(true)
    socket.emit('create_room', { playerName: name.trim(), category }, (res) => {
      setLoading(false)
      if (res.error) return setError(res.error)
      onJoined(res)
    })
  }

  const handleJoin = () => {
    if (!name.trim())   return setError('Enter your name')
    if (!roomId.trim()) return setError('Enter a room code')
    setError('')
    setLoading(true)
    socket.emit('join_room', { playerName: name.trim(), roomId: roomId.trim().toUpperCase() }, (res) => {
      setLoading(false)
      if (res.error) return setError(res.error)
      onJoined(res)
    })
  }

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, color: '#1a1a1a', marginBottom: 4 }}>
            Skribbl
          </div>
          <div style={{ fontSize: 14, color: '#888' }}>
            Draw. Guess. Win.
          </div>
        </div>

        {/* Tab switcher */}
        <div style={s.tabs}>
          <button
            style={{ ...s.tabBtn, ...(tab === 'create' ? s.tabActive : {}) }}
            onClick={() => { setTab('create'); setError('') }}
          >
            Create room
          </button>
          <button
            style={{ ...s.tabBtn, ...(tab === 'join' ? s.tabActive : {}) }}
            onClick={() => { setTab('join'); setError('') }}
          >
            Join room
          </button>
        </div>

        {/* Name input — shared */}
        <div style={s.field}>
          <label style={s.label}>Your name</label>
          <input
            style={s.input}
            type="text"
            placeholder="e.g. Rahul"
            maxLength={20}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (tab === 'create' ? handleCreate() : handleJoin())}
          />
        </div>

        {/* Create-only: category picker */}
        {tab === 'create' && (
          <div style={s.field}>
            <label style={s.label}>Category</label>
            <select
              style={s.input}
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Join-only: room code */}
        {tab === 'join' && (
          <div style={s.field}>
            <label style={s.label}>Room code</label>
            <input
              style={{ ...s.input, textTransform: 'uppercase', letterSpacing: 3, fontWeight: 600 }}
              type="text"
              placeholder="AB12CD"
              maxLength={6}
              value={roomId}
              onChange={e => setRoomId(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={s.error}>{error}</div>
        )}

        {/* Action button */}
        <button
          style={{ ...s.btn, opacity: loading ? 0.6 : 1 }}
          disabled={loading}
          onClick={tab === 'create' ? handleCreate : handleJoin}
        >
          {loading ? 'Connecting…' : tab === 'create' ? 'Create room' : 'Join room'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 12, color: '#aaa', marginTop: 16 }}>
          2 – 10 players · Real-time drawing
        </div>
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f5f3',
    padding: 16,
  },
  card: {
    background: '#fff',
    border: '0.5px solid #e0e0da',
    borderRadius: 16,
    padding: '32px 28px',
    width: '100%',
    maxWidth: 380,
  },
  tabs: {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
    background: '#f5f5f3',
    borderRadius: 10,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    padding: '8px 0',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
    background: 'transparent',
    color: '#888',
    transition: 'all .15s',
    fontWeight: 400,
  },
  tabActive: {
    background: '#fff',
    color: '#1a1a1a',
    fontWeight: 500,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  field: {
    marginBottom: 14,
  },
  label: {
    display: 'block',
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '0.5px solid #ddd',
    borderRadius: 8,
    fontSize: 14,
    color: '#1a1a1a',
    background: '#fff',
    outline: 'none',
  },
  error: {
    fontSize: 12,
    color: '#c0392b',
    background: '#fdf0ef',
    border: '0.5px solid #f5c6c2',
    borderRadius: 8,
    padding: '7px 10px',
    marginBottom: 12,
  },
  btn: {
    width: '100%',
    padding: '11px 0',
    border: '0.5px solid #ccc',
    borderRadius: 8,
    background: '#1a1a1a',
    color: '#fff',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'opacity .15s',
    marginTop: 4,
  },
}