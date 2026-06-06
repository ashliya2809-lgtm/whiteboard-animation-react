/**
 * Computes the total sequential duration of a scene —
 * graphics draw one-by-one so total = sum of all durations.
 */
export function getSceneDuration(scene) {
  if (!scene || scene.graphics.length === 0) return 1;
  return scene.graphics.reduce((sum, g) => sum + g.duration, 0);
}

/**
 * Returns a CSS animation style object for the "draw-in" effect.
 */
export function getDrawInStyle(graphic, playing) {
  if (!playing) return {};
  return {
    opacity: 0,
    animation: `drawReveal ${graphic.duration}s cubic-bezier(0.4,0,0.2,1) ${graphic.delay}s forwards`,
  };
}

/**
 * Returns board background + grid CSS for the three board types.
 */
export function getBoardStyle(boardType) {
  const boards = {
    whiteboard: {
      background: '#ffffff',
      backgroundImage:
        'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
      backgroundSize: '40px 40px',
    },
    blackboard: {
      background: '#1c2a1c',
      backgroundImage:
        'linear-gradient(#243024 1px, transparent 1px), linear-gradient(90deg, #243024 1px, transparent 1px)',
      backgroundSize: '40px 40px',
    },
    greenboard: {
      background: '#1a3a1a',
      backgroundImage:
        'linear-gradient(#1f4a1f 1px, transparent 1px), linear-gradient(90deg, #1f4a1f 1px, transparent 1px)',
      backgroundSize: '40px 40px',
    },
  };
  return boards[boardType] ?? boards.whiteboard;
}

/**
 * Scale factor for rendering scene thumbnails in the timeline.
 * Canvas is 800x450; thumbnail is 128x72.
 */
export const THUMBNAIL_SCALE = 128 / 800;