import { useEffect, useRef } from 'react';

const HAND_SVG = process.env.PUBLIC_URL + '/hand-pencil.svg';

// Pencil nib in the 300×300 hand-pencil.svg viewBox
const HAND_VIEWBOX = 300;
const TIP_X = 12;
const TIP_Y = 58;
const HAND_PX = 80;

const TIP_FRAC_X = TIP_X / HAND_VIEWBOX;
const TIP_FRAC_Y = TIP_Y / HAND_VIEWBOX;

/**
 * WhiteboardHand
 *
 * A single hand+pencil overlay that lives at the canvas/preview level.
 * Receives tip position via the `tipRef` ref object which is written to
 * by whichever AnimatedSvgRenderer is currently active.
 *
 * tipRef.current shape:
 *   { active: true,  screenX: number, screenY: number }
 *   { active: false }
 *
 * canvasRef — ref to the positioned canvas div, used to compute
 *             canvas-relative left/top for the hand.
 */
export default function WhiteboardHand({ tipRef, canvasRef }) {
  const handRef = useRef(null);
  const rafRef  = useRef(null);

  useEffect(() => {
    const hand = handRef.current;
    if (!hand) return;

    const loop = () => {
      const tip    = tipRef.current;
      const canvas = canvasRef.current;

      if (!tip?.active || !canvas) {
        hand.style.opacity = '0';
      } else {
        const cr = canvas.getBoundingClientRect();
        const cx = tip.screenX - cr.left;
        const cy = tip.screenY - cr.top;

        hand.style.opacity = '1';
        hand.style.left    = `${cx - TIP_FRAC_X * HAND_PX}px`;
        hand.style.top     = `${cy - TIP_FRAC_Y * HAND_PX}px`;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tipRef, canvasRef]);

  return (
    <img
      ref={handRef}
      src={HAND_SVG}
      alt=""
      style={{
        position:      'absolute',
        width:         HAND_PX,
        height:        HAND_PX,
        pointerEvents: 'none',
        zIndex:        20,
        opacity:       0,
        transition:    'opacity 0.08s',
        // start offscreen
        left: -HAND_PX,
        top:  -HAND_PX,
      }}
    />
  );
}
