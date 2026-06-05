import { useState } from 'react';
import SvgRenderer from '../shared/SvgRenderer';
import { useStore } from '../../store';
import { THUMBNAIL_SCALE } from '../../utils/animation';

const TW = 128;
const TH = 72;

export default function SceneThumbnail({ scene, index, isSelected, totalScenes }) {
  const selectScene = useStore(s => s.selectScene);
  const deleteScene = useStore(s => s.deleteScene);
  const duplicateScene = useStore(s => s.duplicateScene);
  const moveScene = useStore(s => s.moveScene);
  const [ctxMenu, setCtxMenu] = useState(false);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setCtxMenu(true);
  };

  const close = () => setCtxMenu(false);

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div
        onClick={() => selectScene(scene.id)}
        onContextMenu={handleContextMenu}
        style={{
          width: TW, height: TH,
          border: `2px solid ${isSelected ? '#f59e0b' : '#374151'}`,
          borderRadius: 8,
          overflow: 'hidden',
          cursor: 'pointer',
          position: 'relative',
          background: '#fff',
          transition: 'border-color 0.15s',
          boxShadow: isSelected ? '0 0 0 3px rgba(245,158,11,0.25)' : 'none',
        }}
      >
        {/* Mini canvas */}
        {scene.graphics.slice(0, 8).map(g => (
          <div key={g.id} style={{
            position: 'absolute',
            left: g.x * THUMBNAIL_SCALE,
            top: g.y * THUMBNAIL_SCALE,
            width: Math.max(10, g.width * THUMBNAIL_SCALE),
            height: Math.max(10, g.height * THUMBNAIL_SCALE),
          }}>
            {g.type === 'drawing' ? (
              <SvgRenderer svg={g.svgText} style={{ width: '100%', height: '100%' }} />
            ) : (
              <div style={{
                fontFamily: g.fontFamily,
                fontSize: Math.max(4, g.fontSize * THUMBNAIL_SCALE),
                fontWeight: g.fontWeight,
                fontStyle: g.fontStyle,
                color: '#1a1a1a',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}>{g.rawText}</div>
            )}
          </div>
        ))}

        {/* Scene label overlay */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(0,0,0,0.45)',
          color: '#fff', fontSize: 10, textAlign: 'center',
          padding: '2px 0', fontWeight: 600,
        }}>
          Scene {scene.name}
        </div>

        {/* Item count badge */}
        {scene.graphics.length > 0 && (
          <div style={{
            position: 'absolute', top: 4, right: 4,
            background: '#3b82f6', color: '#fff',
            fontSize: 9, padding: '1px 5px', borderRadius: 10, fontWeight: 700,
          }}>
            {scene.graphics.length}
          </div>
        )}
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={close} />
          <div style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 200,
            background: '#1f2937', border: '1px solid #374151', borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)', minWidth: 160, overflow: 'hidden',
          }}>
            {[
              {
                label: '← Move Left', icon: '←',
                disabled: index === 0,
                action: () => { moveScene(index, index - 1); close(); }
              },
              {
                label: '→ Move Right', icon: '→',
                disabled: index === totalScenes - 1,
                action: () => { moveScene(index, index + 1); close(); }
              },
              { sep: true },
              {
                label: 'Duplicate', icon: '⧉',
                action: () => { duplicateScene(scene.id); close(); }
              },
              { sep: true },
              {
                label: 'Delete', icon: '🗑', danger: true,
                disabled: totalScenes <= 1,
                action: () => { deleteScene(scene.id); close(); }
              },
            ].map((item, i) =>
              item.sep ? (
                <div key={i} style={{ height: 1, background: '#374151', margin: '2px 0' }} />
              ) : (
                <button
                  key={i}
                  disabled={item.disabled}
                  onClick={item.action}
                  style={{
                    display: 'block', width: '100%',
                    padding: '8px 14px', textAlign: 'left',
                    background: 'none', border: 'none',
                    color: item.disabled ? '#4b5563' : item.danger ? '#ef4444' : '#e5e7eb',
                    fontSize: 13, cursor: item.disabled ? 'not-allowed' : 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => !item.disabled && (e.currentTarget.style.background = '#374151')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <span style={{ marginRight: 8 }}>{item.icon}</span>
                  {item.label}
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
