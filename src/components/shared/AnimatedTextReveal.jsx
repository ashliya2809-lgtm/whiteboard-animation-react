import { useEffect, useRef, useState } from 'react';
import { textToSvgPaths, warmFont } from '../../services/fontService';

export default function AnimatedTextReveal({
  graphic, playing, duration, delay, onTipMove, playStartTime,
}) {
  const [svgData, setSvgData] = useState(null);

  const svgRef       = useRef(null);
  const rafRef       = useRef(null);
  const startRef     = useRef(null);
  // Live refs — tick always reads the latest speed without restarting
  const durationRef  = useRef(duration);
  const delayRef     = useRef(delay);

  // Keep live refs in sync with props every render
  durationRef.current = duration;
  delayRef.current    = delay;

  // ── Pre-load font ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    warmFont(graphic.fontFamily || 'Open Sans').then(() => {
      if (cancelled) return;
      return textToSvgPaths(
        graphic.rawText   || ' ',
        graphic.fontFamily || 'Open Sans',
        graphic.fontSize   || 72,
      );
    }).then(data => {
      if (!cancelled && data) setSvgData(data);
    }).catch(err => console.warn('Font load error:', err));
    return () => { cancelled = true; };
  }, [graphic.rawText, graphic.fontFamily, graphic.fontSize]);

  // ── Animation loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    const svgEl = svgRef.current;
    cancelAnimationFrame(rafRef.current);

    if (!svgEl || !svgData) return;

    const strokes = Array.from(svgEl.querySelectorAll('path'));

    // Static — show fully drawn
    if (!playing) {
      onTipMove?.({ active: false });
      strokes.forEach(p => {
        p.style.strokeDasharray  = '';
        p.style.strokeDashoffset = '';
        p.style.opacity = '1';
        if (p.dataset.origFill) {
          p.setAttribute('fill', p.dataset.origFill);
          delete p.dataset.origFill;
        }
      });
      return;
    }

    if (strokes.length === 0) { onTipMove?.({ active: false }); return; }

    const vb  = svgEl.viewBox.baseVal;
    const vbW = vb.width  || 100;
    const vbH = vb.height || 100;

    // Measure path lengths + store normalised progress position (0–1) per stroke
    // We store the FRACTION of total path each stroke occupies so we can
    // remap to any duration at runtime without rebuilding meta.
    const totalStrokes = strokes.length;
    const lengths = strokes.map(p => {
      let len = 0;
      try { len = p.getTotalLength(); } catch (_) { len = 200; }
      return len;
    });

    // Init all strokes hidden
    strokes.forEach((p, i) => {
      p.style.opacity          = '0';
      p.style.strokeDasharray  = `${lengths[i]}`;
      p.style.strokeDashoffset = `${lengths[i]}`;
      const origFill = p.getAttribute('fill');
      if (origFill && origFill !== 'none') {
        p.dataset.origFill = origFill;
        p.setAttribute('fill', 'none');
      }
    });

    startRef.current = null;

    const tick = (ts) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = (ts - startRef.current) / 1000;

      // Read live refs so speed changes take effect immediately
      const dur = durationRef.current;
      const dly = delayRef.current;
      const perStroke = dur / totalStrokes;

      // Snap finished strokes
      strokes.forEach((p, i) => {
        const endSec = dly + (i + 1) * perStroke;
        if (elapsed >= endSec) {
          p.style.opacity          = '1';
          p.style.strokeDashoffset = '0';
          if (p.dataset.origFill) {
            p.setAttribute('fill', p.dataset.origFill);
            delete p.dataset.origFill;
          }
        }
      });

      // Find active stroke
      const activeIdx = strokes.findIndex((_, i) => {
        const startSec = dly + i * perStroke;
        const endSec   = dly + (i + 1) * perStroke;
        return elapsed >= startSec && elapsed < endSec;
      });

      if (activeIdx === -1) {
        onTipMove?.({ active: false });
        if (elapsed < dly + dur) {
          rafRef.current = requestAnimationFrame(tick);
        }
        return;
      }

      const p        = strokes[activeIdx];
      const startSec = dly + activeIdx * perStroke;
      const endSec   = dly + (activeIdx + 1) * perStroke;
      const t        = Math.min(1, Math.max(0, (elapsed - startSec) / (endSec - startSec)));
      const len      = lengths[activeIdx];

      p.style.opacity          = '1';
      p.style.strokeDashoffset = `${len * (1 - t)}`;

      // Keep upcoming strokes hidden
      strokes.forEach((pp, i) => {
        if (i > activeIdx) {
          pp.style.opacity          = '0';
          pp.style.strokeDashoffset = `${lengths[i]}`;
        }
      });

      // Hand tip position
      if (onTipMove && len > 0) {
        try {
          const pt     = p.getPointAtLength(t * len);
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
      startRef.current = null;
      onTipMove?.({ active: false });
    };
    // duration/delay intentionally NOT in deps — live refs handle updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgData, playing]);

  const strokeColor =
    graphic.boardType === 'blackboard' || graphic.boardType === 'greenboard'
      ? '#f1f5f9' : '#1a1a1a';

  if (!svgData) {
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center',
        fontFamily: graphic.fontFamily,
        fontSize: graphic.fontSize,
        color: strokeColor,
        whiteSpace: 'nowrap',
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