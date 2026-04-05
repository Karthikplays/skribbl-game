import { useState, useEffect } from 'react'
import socket from './socket'
import Lobby from './Lobby'
import Room from './Room'

export default function App() {
  const [view, setView]         = useState('lobby')   // 'lobby' | 'room'
  const [roomData, setRoomData] = useState(null)
  const [playerId, setPlayerId] = useState('')

  useEffect(() => {
    // Capture socket id once connected
    if (socket.connected) {
      setPlayerId(socket.id)
    } else {
      socket.on('connect', () => setPlayerId(socket.id))
    }

    return () => {
      socket.off('connect')
    }
  }, [])

  const handleJoined = (data) => {
    setRoomData(data)
    setView('room')
  }

  if (view === 'lobby') {
    return <Lobby onJoined={handleJoined} />
  }

  if (view === 'room' && roomData) {
    return (
      <Room
        roomData={roomData}
        playerId={playerId || socket.id}
      />
    )
  }

  // Fallback — should not normally appear
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'system-ui',
      color: '#888',
      fontSize: 14
    }}>
      Connecting…
    </div>
  )
}