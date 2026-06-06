// ─── ID helper ────────────────────────────────────────────────────────────────
const uid = () => crypto.randomUUID();

// ─── Project ──────────────────────────────────────────────────────────────────
export function createProject(title = 'Untitled Project', boardType = 'whiteboard') {
  const now = new Date().toISOString();
  const firstScene = createScene('1');
  return {
    id: uid(),
    title,
    boardType,
    createdOn: now,
    modifiedOn: now,
    scenes: [firstScene],
  };
}

// ─── Scene ────────────────────────────────────────────────────────────────────
export function createScene(name = '1') {
  return {
    id: uid(),
    name,
    graphics: [],
    transition: 'none', // 'none', 'fade', 'slideLeft', 'slideRight', 'slideUp', 'slideDown', 'zoomIn', 'zoomOut'
    transitionDuration: 0.5, // in seconds
  };
}

export function cloneScene(scene) {
  return {
    ...JSON.parse(JSON.stringify(scene)),
    id: uid(),
    graphics: scene.graphics.map(g => ({ ...g, id: uid() })),
  };
}

// ─── Graphics ─────────────────────────────────────────────────────────────────

/**
 * @param {string} svgText   – raw SVG markup
 * @param {string} name      – display name
 * @param {{ x, y, width, height }} pos
 */
export function createDrawingModel(svgText, name = 'Graphic', pos = {}) {
  return {
    id: uid(),
    type: 'drawing',
    name,
    svgText,
    x: pos.x ?? 60,
    y: pos.y ?? 60,
    width: pos.width ?? 120,
    height: pos.height ?? 120,
    delay: 0,
    duration: 1.5,
  };
}

/**
 * @param {{ rawText, fontFamily, fontStyle, fontWeight, fontSize }} textProps
 * @param {{ x, y }} pos
 */
export function createTextModel(
  { rawText = 'Text', fontFamily = 'Georgia', fontStyle = 'normal', fontWeight = 'normal', fontSize = 36 },
  pos = {}
) {
  return {
    id: uid(),
    type: 'text',
    name: rawText.slice(0, 20) || 'Text',
    rawText,
    fontFamily,
    fontStyle,
    fontWeight,
    fontSize,
    x: pos.x ?? 80,
    y: pos.y ?? 100,
    width: Math.max(120, fontSize * rawText.length * 0.65),
    height: fontSize * 1.6,
    delay: 0,
    duration: 1,
  };
}
