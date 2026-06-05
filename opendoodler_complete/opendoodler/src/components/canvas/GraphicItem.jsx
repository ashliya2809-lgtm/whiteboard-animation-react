import { useRef } from 'react';
import SvgRenderer from '../shared/SvgRenderer';
import { useStore } from '../../store';

export default function GraphicItem({ graphic, isSelected, playing }) {
  const moveGraphic = useStore(s => s.moveGraphic);
  const resizeGraphic = useStore(s => s.resizeGraphic);
  const selectGraphic = useStore(s => s.selectGraphic);

  const dragState = useRef(null);
  const resizeState = useRef(null);

  // ── Drag to move ─────────────────────────────────────────────────────────────
  const handleMouseDown = (e) => {
    if (playing) return;
    e.stopPropagation();
    selectGraphic(graphic.id);
    dragState.current = { startX: e.clientX - graphic.x, startY: e.clientY - graphic.y };

    const onMove = (ev) => {
      if (!dragState.current) return;
      moveGraphic(graphic.id, ev.clientX - dragState.current.startX, ev.clientY - dragState.current.startY);
    };
    const onUp = () => {
      dragState.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ── Resize handle (bottom-right corner) ───────────────────────────────────────
  const handleResizeDown = (e) => {
    if (playing) return;
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = graphic.width;
    const startH = graphic.height;
    const aspect = startH / startW;

    const onMove = (ev) => {
      const dw = ev.clientX - startX;
      const newW = Math.max(30, startW + dw);
      resizeGraphic(graphic.id, newW, newW * aspect);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const animStyle = playing ? {
    opacity: 0,
    animation: `drawReveal ${graphic.duration}s cubic-bezier(0.4,0,0.2,1) ${graphic.delay}s forwards`,
  } : {};

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: graphic.x,
        top: graphic.y,
        width: graphic.width,
        height: graphic.height,
        cursor: playing ? 'default' : 'move',
        outline: !playing && isSelected ? '2px solid #3b82f6' : 'none',
        outlineOffset: 1,
        boxSizing: 'border-box',
        userSelect: 'none',
        ...animStyle,
      }}
    >
      {/* Content */}
      {graphic.type === 'drawing' ? (
        <SvgRenderer
          svg={graphic.svgText}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          fontFamily: graphic.fontFamily,
          fontWeight: graphic.fontWeight,
          fontStyle: graphic.fontStyle,
          fontSize: graphic.fontSize,
          color: '#1a1a1a',
        }}>
          {graphic.rawText}
        </div>
      )}

      {/* Resize handle */}
      {isSelected && !playing && (
        <div
          onMouseDown={handleResizeDown}
          style={{
            position: 'absolute', right: -5, bottom: -5,
            width: 12, height: 12,
            background: '#3b82f6', border: '2px solid #fff',
            borderRadius: 2, cursor: 'se-resize', zIndex: 5,
          }}
        />
      )}

      {/* Selection border label */}
      {isSelected && !playing && (
        <div style={{
          position: 'absolute', top: -22, left: 0,
          background: '#3b82f6', color: '#fff',
          fontSize: 10, padding: '2px 6px', borderRadius: 4,
          whiteSpace: 'nowrap', pointerEvents: 'none',
          fontFamily: 'system-ui', fontWeight: 600,
        }}>
          {graphic.name}
        </div>
      )}
    </div>
  );
}
