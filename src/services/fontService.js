import opentype from 'opentype.js';

const FONT_MAP = {
  'Pacifico':        '/Pacifico-Regular.ttf',
  'Caveat':          '/Caveat-Regular.ttf',
  'Dancing Script':  '/DancingScript-Regular.ttf',
  'Open Sans':       '/OpenSans-Regular.ttf',
  default:           '/OpenSans-Regular.ttf',
};

const fontCache = {};
const loadPromises = {};

/** Load a font (cached). Returns the opentype.Font object. */
async function loadFont(family) {
  const path = (FONT_MAP[family] || FONT_MAP.default);
  const url  = process.env.PUBLIC_URL + path;
  if (fontCache[url]) return fontCache[url];
  // Deduplicate concurrent requests for the same font
  if (!loadPromises[url]) {
    loadPromises[url] = new Promise((resolve, reject) => {
      opentype.load(url, (err, font) => {
        if (err) { delete loadPromises[url]; reject(err); }
        else     { fontCache[url] = font; resolve(font); }
      });
    });
  }
  return loadPromises[url];
}

/**
 * Pre-warm the font cache. Call this on component mount so the font
 * is ready before the animation starts.
 */
export async function warmFont(family) {
  try { await loadFont(family); } catch (_) {}
}

/**
 * Convert text → array of SVG path `d` strings (one per glyph contour).
 * Returns { paths: string[], viewBox: string, width: number, height: number }
 */
export async function textToSvgPaths(text, fontFamily, fontSize = 72) {
  const font = await loadFont(fontFamily);

  const RENDER_SIZE = 120;
  const baseline    = RENDER_SIZE * 0.78;
  const glyphs      = font.stringToGlyphs(text || ' ');

  const paths   = [];
  let cursorX   = 0;
  const scale   = RENDER_SIZE / font.unitsPerEm;

  glyphs.forEach((glyph, i) => {
    const glyphPath = glyph.getPath(cursorX, baseline, RENDER_SIZE);
    const d         = glyphPath.toPathData(2);

    // Split compound path into individual contours (M...Z segments)
    splitContours(d).forEach(seg => {
      if (seg && seg.trim().length > 2) paths.push(seg);
    });

    cursorX += (glyph.advanceWidth || 0) * scale;

    // Kerning
    if (i < glyphs.length - 1) {
      const kern = font.getKerningValue(glyph, glyphs[i + 1]);
      cursorX += (kern || 0) * scale;
    }
  });

  const totalWidth  = Math.max(cursorX, 10);
  const totalHeight = RENDER_SIZE * 1.15;

  return {
    paths,
    viewBox: `0 0 ${totalWidth.toFixed(1)} ${totalHeight.toFixed(1)}`,
    width:   totalWidth,
    height:  totalHeight,
  };
}

/** Split a compound SVG path string on each M (moveto) command */
function splitContours(d) {
  if (!d) return [];
  return d.split(/(?=M)/).map(s => s.trim()).filter(s => s.length > 2);
}