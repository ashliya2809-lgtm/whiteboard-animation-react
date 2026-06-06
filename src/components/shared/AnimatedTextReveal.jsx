import { useEffect, useRef, useState } from 'react';
import { textToSvgPaths, warmFont } from '../../services/fontService';

/**
 * AnimatedTextReveal
 *
 * Pre-loads the font on mount so it's ready before play starts.
 * Uses `playStartTime` (performance.now() from parent) as the
 * shared clock — so even if font loading took a moment, timing
 * is always correct relative to when Play was pressed.
 */
export default function AnimatedTextReveal({
  graphic, playing, duration, delay, onTipMove, playStartTime,
}) {
  const [svgData, setSvgData] = useState(null);

  const svgRef   = useRef(null);
  const rafRef   = useRef(null);

  // ── Pre-load font immediately on mount (before play starts) ──────────────
  useEffect(() => {
    let cancelled = false;
    // Warm the cache first (no-op if already loaded)
    warmFont(graphic.fontFamily || 'Open Sans').then(() => {
      if (cancelled) return;
      return textToSvgPaths(
        graphic.rawText  || ' ',
        graphic.fontFamily || 'Open Sans',
        graphic.fontSize   || 72,
      );
    }).then(data => {
      if (!cancelled && data) setSvgData(data);
    }).catch(err => console.warn('Font load error:', err));

    return () => { cancelled = true; };
  }, [graphic.rawText, graphic.fontFamily, graphic.fontSize]);

  // ── Run animation when both svgData AND playing are ready ────────────────
  useEffect(() => {
    const svgEl = svgRef.current;
    cancelAnimationFrame(rafRef.current);

    if (!svgEl || !svgData) return;

    const strokes = Array.from(svgEl.querySelectorAll('path'));

    // Static mode — show fully drawn
    if (!playing) {
      onTipMove?.({ active: false });
      strokes.forEach(p => {
        p.style.strokeDasharray  = '';
        p.style.strokeDashoffset = '';
        p.style.opacity = '1';
        p.setAttribute('fill', p.dataset.origFill || 'none');
      });
      return;
    }

    if (strokes.length === 0) { onTipMove?.({ active: false }); return; }

    const perStroke = duration / Math.max(strokes.length, 1);

    const vb  = svgEl.viewBox.baseVal;
    const vbW = vb.width  || 100;
    const vbH = vb.height || 100;

    // Measure + init all strokes hidden
    const meta = strokes.map((p, i) => {
      let length = 0;
      try { length = p.getTotalLength(); } catch (_) { length = 200; }
      p.style.opacity          = '0';
      p.style.strokeDasharray  = `${length}`;
      p.style.strokeDashoffset = `${length}`;
      // Hide fill until fully drawn
      const origFill = p.getAttribute('fill');
      if (origFill && origFill !== 'none') {
        p.dataset.origFill = origFill;
        p.setAttribute('fill', 'none');
      }
      return {
        el: p, length,
        startSec: delay + i * perStroke,
        endSec:   delay + (i + 1) * perStroke,
      };
    });

    const tick = (ts) => {
      // Use playStartTime from parent so elapsed is correct even if font
      // loaded late. Fall back to first-frame if not provided.
      const origin  = playStartTime ?? ts;
      const elapsed = (ts - origin) / 1000;

      // Snap all finished strokes
      meta.forEach(m => {
        if (elapsed >= m.endSec) {
          m.el.style.opacity          = '1';
          m.el.style.strokeDashoffset = '0';
          if (m.el.dataset.origFill) {
            m.el.setAttribute('fill', m.el.dataset.origFill);
            delete m.el.dataset.origFill;
          }
        }
      });

      // Find the currently active stroke
      const activeIdx = meta.findIndex(
        m => elapsed >= m.startSec && elapsed < m.endSec
      );

      if (activeIdx === -1) {
        onTipMove?.({ active: false });
        // Keep looping only if we haven't started yet
        if (elapsed < delay) {
          rafRef.current = requestAnimationFrame(tick);
        }
        return;
      }

      const m = meta[activeIdx];
      const t = Math.min(1, Math.max(0,
        (elapsed - m.startSec) / (m.endSec - m.startSec)
      ));

      m.el.style.opacity          = '1';
      m.el.style.strokeDashoffset = `${m.length * (1 - t)}`;

      // Keep not-yet-started strokes hidden
      meta.forEach((mm, i) => {
        if (i > activeIdx) {
          mm.el.style.opacity          = '0';
          mm.el.style.strokeDashoffset = `${mm.length}`;
        }
      });

      // Report tip for hand positioning
      if (onTipMove && m.length > 0) {
        try {
          const pt     = m.el.getPointAtLength(t * m.length);
          const rect   = svgEl.getBoundingClientRect();
          const scaleX = rect.width  / vbW;
          const scaleY = rect.height / vbH;
          onTipMove({
            active:  true,
            screenX: rect.left + pt.x * scaleX,
            screenY: rect.top  + pt.y * scaleY,
          });
        } catch (_) { onTipMove?.({ active: false }); }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      onTipMove?.({ active: false });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgData, playing, duration, delay, playStartTime]);

  const strokeColor =
    graphic.boardType === 'blackboard' || graphic.boardType === 'greenboard'
      ? '#f1f5f9' : '#1a1a1a';

  // While font is loading, show invisible placeholder (same size, no flash)
  if (!svgData) {
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center',
        fontFamily: graphic.fontFamily,
        fontSize: graphic.fontSize,
        color: strokeColor,
        whiteSpace: 'nowrap',
        // Invisible but takes up space — no layout shift
        opacity: 0,
      }} />
    );
  }

  return (
    <svg
      ref={svgRef}
      viewBox={svgData.viewBox}
      style={{ width: '100%', height: '100%', overflow: 'visible', display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {svgData.paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill={playing ? 'none' : strokeColor}
          stroke={strokeColor}
          strokeWidth={Math.max(1, (graphic.fontSize || 72) * 0.035)}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: playing ? 0 : 1 }}
        />
      ))}
    </svg>
  );
}