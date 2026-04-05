import { useRef, useEffect, useState } from 'react';
import socket from './socket';

export default function Canvas({ isDrawer }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(4);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const draw = ({ x, y, type, color, size }) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.lineCap = 'round';
      if (type === 'start') { ctx.beginPath(); ctx.moveTo(x, y); }
      else { ctx.lineTo(x, y); ctx.stroke(); }
    };

    socket.on('draw', draw);
    return () => socket.off('draw', draw);
  }, []);

  const emit = (e, type) => {
    if (!isDrawer) return;
    if (type === 'move' && !drawing.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const data = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      color, size, type
    };
    socket.emit('draw', data);
    // also draw locally
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = 'round';
    if (type === 'start') { ctx.beginPath(); ctx.moveTo(data.x, data.y); }
    else { ctx.lineTo(data.x, data.y); ctx.stroke(); }
  };

  return (
    <div>
      <canvas ref={canvasRef} width={600} height={450}
        style={{ border: '1px solid #ccc', cursor: isDrawer ? 'crosshair' : 'default' }}
        onMouseDown={e => { drawing.current = true; emit(e, 'start'); }}
        onMouseMove={e => emit(e, 'move')}
        onMouseUp={() => drawing.current = false}
        onMouseLeave={() => drawing.current = false} />
      {isDrawer && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input type="color" value={color} onChange={e => setColor(e.target.value)} />
          <input type="range" min="2" max="30" value={size}
            onChange={e => setSize(+e.target.value)} />
        </div>
      )}
    </div>
  );
}