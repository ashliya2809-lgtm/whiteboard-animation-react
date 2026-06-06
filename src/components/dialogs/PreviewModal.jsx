import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../store';
import SvgRenderer from '../shared/SvgRenderer';
import AnimatedSvgRenderer from '../shared/AnimatedSvgRenderer';
import AnimatedTextReveal from '../shared/AnimatedTextReveal';
import WhiteboardHand from '../shared/WhiteboardHand';
import { getBoardStyle } from '../../utils/animation';

/**
 * Sequential timeline: graphic N starts exactly when graphic N-1 finishes.
 * Total duration = sum of all g.duration values.
 */
function buildSequentialTimeline(graphics) {
  let cursor = 0;
  return graphics.map(g => {
    const seqDelay = cursor;
    cursor += g.duration;
    return { ...g, seqDelay };
  });
}

function getSequentialDuration(graphics) {
  return graphics.reduce((sum, g) => sum + g.duration, 0);
}

export default function PreviewModal() {
  const project           = useStore(s => s.project);
  const closePreviewModal = useStore(s => s.closePreviewModal);

  const [playing,  setPlaying]  = useState(false);
  const [sceneIdx, setSceneIdx] = useState(0);
  // canvasKey only changes when we switch scenes or hard-reset, NOT mid-play
  const [canvasKey, setCanvasKey] = useState(0);

  const tipRef        = useRef({ active: false });
  const canvasRef     = useRef(null);
  const activeIdRef   = useRef(null);
  const timerRef      = useRef(null);
  const playStartRef  = useRef(null);  // performance.now() when play started

  const scenes     = project?.scenes ?? [];
  const scene      = scenes[sceneIdx];
  const boardStyle = getBoardStyle(project?.boardType ?? 'whiteboard');
  const timeline   = scene ? buildSequentialTimeline(scene.graphics) : [];

  const reset = () => {
    clearTimeout(timerRef.current);
    setPlaying(false);
    setSceneIdx(0);
    setCanvasKey(k => k + 1);   // remount canvas to clear all animations
    tipRef.current       = { active: false };
    activeIdRef.current  = null;
    playStartRef.current = null;
  };

  const play = () => {
    clearTimeout(timerRef.current);
    tipRef.current      = { active: false };
    activeIdRef.current = null;
    // Remount canvas fresh, then start playing
    setSceneIdx(0);
    setCanvasKey(k => k + 1);
    setPlaying(false);
    setTimeout(() => {
      playStartRef.current = performance.now();
      setPlaying(true);
      scheduleNextScene(0);
    }, 50);
  };

  const scheduleNextScene = (idx) => {
    if (idx >= scenes.length) {
      setPlaying(false);
      return;
    }
    const dur = getSequentialDuration(scenes[idx].graphics);
    timerRef.current = setTimeout(() => {
      if (idx + 1 < scenes.length) {
        // Switch to next scene — remount canvas for new scene
        setSceneIdx(idx + 1);
        setCanvasKey(k => k + 1);
        scheduleNextScene(idx + 1);
      } else {
        setPlaying(false);
      }
    }, (dur + 0.5) * 1000);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    if (!playing) {
      tipRef.current      = { active: false };
      activeIdRef.current = null;
    }
  }, [playing]);

  const makeTipHandler = useCallback((graphicId) => (info) => {
    if (info.active) {
      activeIdRef.current = graphicId;
      tipRef.current = info;
    } else if (activeIdRef.current === graphicId) {
      activeIdRef.current = null;
      tipRef.current = { active: false };
    }
  }, []);

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

        {/* Canvas — key only changes on scene switch or reset, never mid-animation */}
        <div
          key={canvasKey}
          ref={canvasRef}
          style={{
            position: 'relative', width: 800, height: 450,
            ...boardStyle,
            borderRadius: 8, overflow: 'hidden',
            maxWidth: '100%',
          }}
        >
          {timeline.map(g => (
            <div
              key={g.id}
              style={{ position: 'absolute', left: g.x, top: g.y, width: g.width, height: g.height }}
            >
              {g.type === 'drawing' ? (
                playing ? (
                  <AnimatedSvgRenderer
                    key={`${g.id}-play`}
                    svg={g.svgText}
                    style={{ width: '100%', height: '100%' }}
                    playing={playing}
                    duration={g.duration}
                    delay={g.seqDelay}
                    onTipMove={makeTipHandler(g.id)}
                  />
                ) : (
                  <SvgRenderer svg={g.svgText} style={{ width: '100%', height: '100%' }} />
                )
              ) : playing ? (
                <AnimatedTextReveal
                  key={`${g.id}-play`}
                  graphic={{ ...g, boardType: project?.boardType }}
                  playing={playing}
                  duration={g.duration}
                  delay={g.seqDelay}
                  onTipMove={makeTipHandler(g.id)}
                  playStartTime={playStartRef.current}
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                  overflow: 'hidden', whiteSpace: 'nowrap',
                  fontFamily: g.fontFamily, fontWeight: g.fontWeight,
                  fontStyle: g.fontStyle, fontSize: g.fontSize,
                  color: project?.boardType === 'whiteboard' ? '#1a1a1a' : '#f1f5f9',
                }}>
                  {g.rawText}
                </div>
              )}
            </div>
          ))}

          {playing && <WhiteboardHand tipRef={tipRef} canvasRef={canvasRef} />}
        </div>

        {/* Controls */}
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center' }}>
          <button
            onClick={play}
            disabled={playing}
            style={{
              padding: '9px 28px', fontWeight: 700, fontSize: 14,
              background: playing ? '#1e293b' : '#10b981',
              border: 'none', borderRadius: 8,
              color: playing ? '#64748b' : '#fff',
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
          >↺ Reset</button>

          <span style={{ color: '#64748b', fontSize: 12 }}>
            Scene {sceneIdx + 1} / {scenes.length}
          </span>
        </div>
      </div>
    </div>
  );
}