import { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import SvgRenderer from '../shared/SvgRenderer';
import { getBoardStyle, getSceneDuration } from '../../utils/animation';

export default function PreviewModal() {
  const project = useStore(s => s.project);
  const closePreviewModal = useStore(s => s.closePreviewModal);

  const [playing, setPlaying] = useState(false);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [key, setKey] = useState(0); // force re-mount to re-trigger CSS animations
  const timerRef = useRef(null);

  const scenes = project?.scenes ?? [];
  const scene = scenes[sceneIdx];
  const boardStyle = getBoardStyle(project?.boardType ?? 'whiteboard');

  const reset = () => {
    clearTimeout(timerRef.current);
    setPlaying(false);
    setSceneIdx(0);
    setKey(k => k + 1);
  };

  const play = () => {
    reset();
    setTimeout(() => {
      setPlaying(true);
      setKey(k => k + 1);
      runScene(0);
    }, 50);
  };

  const runScene = (idx) => {
    if (idx >= scenes.length) {
      setPlaying(false);
      return;
    }
    setSceneIdx(idx);
    setKey(k => k + 1);
    const dur = getSceneDuration(scenes[idx]);
    timerRef.current = setTimeout(() => runScene(idx + 1), (dur + 0.6) * 1000);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={e => e.target === e.currentTarget && closePreviewModal()}
    >
      <div style={{
        background: '#0f172a', border: '1px solid #1e293b',
        borderRadius: 12, padding: 24,
        boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        animation: 'modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        maxWidth: '95vw',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#f1f5f9', margin: 0 }}>
            Preview — {project?.title}
          </h2>
          <button
            onClick={closePreviewModal}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}
          >✕</button>
        </div>

        {/* Canvas */}
        <div
          key={key}
          style={{
            position: 'relative', width: 800, height: 450,
            ...boardStyle,
            borderRadius: 8, overflow: 'hidden',
            maxWidth: '100%',
          }}
        >
          {scene?.graphics.map(g => (
            <div
              key={g.id}
              style={{
                position: 'absolute',
                left: g.x, top: g.y,
                width: g.width, height: g.height,
                ...(playing ? {
                  opacity: 0,
                  animation: `drawReveal ${g.duration}s cubic-bezier(0.4,0,0.2,1) ${g.delay}s forwards`,
                } : { opacity: 1 }),
              }}
            >
              {g.type === 'drawing' ? (
                <SvgRenderer svg={g.svgText} style={{ width: '100%', height: '100%' }} />
              ) : (
                <div style={{
                  fontFamily: g.fontFamily, fontWeight: g.fontWeight,
                  fontStyle: g.fontStyle, fontSize: g.fontSize,
                  color: project?.boardType === 'whiteboard' ? '#1a1a1a' : '#f1f5f9',
                  whiteSpace: 'nowrap', overflow: 'hidden',
                }}>
                  {g.rawText}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center' }}>
          <button
            onClick={play}
            disabled={playing}
            style={{
              padding: '9px 28px', fontWeight: 700, fontSize: 14,
              background: playing ? '#1e293b' : '#10b981',
              border: 'none', borderRadius: 8, color: playing ? '#64748b' : '#fff',
              cursor: playing ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
            }}
          >
            {playing ? '⏳ Playing…' : '▶ Play Animation'}
          </button>

          <button
            onClick={reset}
            style={{
              padding: '9px 20px', fontWeight: 600, fontSize: 13,
              background: '#1e293b', border: '1px solid #334155',
              borderRadius: 8, color: '#94a3b8', cursor: 'pointer',
            }}
          >
            ↺ Reset
          </button>

          <span style={{ color: '#64748b', fontSize: 12 }}>
            Scene {sceneIdx + 1} / {scenes.length}
          </span>
        </div>
      </div>
    </div>
  );
}
