import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../store';
import SvgRenderer from '../shared/SvgRenderer';
import AnimatedSvgRenderer from '../shared/AnimatedSvgRenderer';
import AnimatedTextReveal from '../shared/AnimatedTextReveal';
import WhiteboardHand from '../shared/WhiteboardHand';
import { getBoardStyle, getTransitionStyle } from '../../utils/animation';

// Speed multiplier → duration divisor
// e.g. speed=2 means durations are halved (twice as fast)
const SPEED_STEPS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3];
const SPEED_LABELS = ['0.25×', '0.5×', '0.75×', '1×', '1.5×', '2×', '3×'];
const DEFAULT_SPEED_IDX = 3; // 1×

function buildSequentialTimeline(graphics, speed = 1) {
  let cursor = 0;
  return graphics.map(g => {
    const seqDelay    = cursor / speed;
    const scaledDur   = g.duration / speed;
    cursor += g.duration;
    return { ...g, seqDelay, scaledDur };
  });
}

function getSequentialDuration(graphics, speed = 1) {
  return graphics.reduce((sum, g) => sum + g.duration, 0) / speed;
}

export default function PreviewModal() {
  const project           = useStore(s => s.project);
  const closePreviewModal = useStore(s => s.closePreviewModal);

  const [playing,   setPlaying]   = useState(false);
  const [sceneIdx,  setSceneIdx]  = useState(0);
  const [canvasKey, setCanvasKey] = useState(0);
  const [speedIdx,  setSpeedIdx]  = useState(DEFAULT_SPEED_IDX);

  const speed = SPEED_STEPS[speedIdx];

  const tipRef       = useRef({ active: false });
  const canvasRef    = useRef(null);
  const activeIdRef  = useRef(null);
  const timerRef     = useRef(null);
  const playStartRef = useRef(null);

  const scenes     = project?.scenes ?? [];
  const scene      = scenes[sceneIdx];
  const boardStyle = getBoardStyle(project?.boardType ?? 'whiteboard');
  const timeline   = scene ? buildSequentialTimeline(scene.graphics, speed) : [];
  const transitionStyle = playing && scene ? getTransitionStyle(scene.transition, scene.transitionDuration || 0.5) : {};

  const reset = () => {
    clearTimeout(timerRef.current);
    setPlaying(false);
    setSceneIdx(0);
    setCanvasKey(k => k + 1);
    tipRef.current      = { active: false };
    activeIdRef.current = null;
    playStartRef.current = null;
  };

  const play = () => {
    clearTimeout(timerRef.current);
    tipRef.current      = { active: false };
    activeIdRef.current = null;
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
    if (idx >= scenes.length) { setPlaying(false); return; }
    const currentScene = scenes[idx];
    const dur = getSequentialDuration(currentScene.graphics, speed);
    const transitionDur = (currentScene.transition && currentScene.transition !== 'none') 
      ? (currentScene.transitionDuration || 0.5) 
      : 0;
    const totalDur = dur + transitionDur;
    
    timerRef.current = setTimeout(() => {
      if (idx + 1 < scenes.length) {
        setSceneIdx(idx + 1);
        setCanvasKey(k => k + 1);
        scheduleNextScene(idx + 1);
      } else {
        setPlaying(false);
      }
    }, (totalDur + 0.5) * 1000);
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

  const handleSpeedChange = (e) => {
    setSpeedIdx(Number(e.target.value));
    // No restart needed — AnimatedTextReveal reads duration/delay via live
    // refs, so the running rAF loop picks up the new speed on the next frame.
  };

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
          key={canvasKey}
          ref={canvasRef}
          style={{
            position: 'relative', width: 800, height: 450,
            ...boardStyle,
            borderRadius: 8, overflow: 'hidden',
            maxWidth: '100%',
            ...transitionStyle,
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
                    duration={g.scaledDur}
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
                  duration={g.scaledDur}
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
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>

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

          {/* Speed slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>🐢</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <input
                type="range"
                min={0}
                max={SPEED_STEPS.length - 1}
                step={1}
                value={speedIdx}
                onChange={handleSpeedChange}
                style={{
                  width: 120,
                  accentColor: '#10b981',
                  cursor: 'pointer',
                }}
              />
              <span style={{
                color: '#10b981', fontSize: 11, fontWeight: 700,
                fontFamily: 'monospace', letterSpacing: '0.05em',
              }}>
                {SPEED_LABELS[speedIdx]}
              </span>
            </div>
            <span style={{ color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>🐇</span>
          </div>

          <span style={{ color: '#64748b', fontSize: 12 }}>
            Scene {sceneIdx + 1} / {scenes.length}
          </span>
        </div>
      </div>
    </div>
  );
}