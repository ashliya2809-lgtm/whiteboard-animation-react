import opentype from 'opentype.js';

const FONT_MAP = {
  'Pacifico':       '/Pacifico-Regular.ttf',
  'Caveat':         '/Caveat-Regular.ttf',
  'Dancing Script': '/DancingScript-Regular.ttf',
  'Open Sans':      '/OpenSans-Regular.ttf',
  // Legacy / system fonts — fall back to Open Sans
  'Georgia':        '/OpenSans-Regular.ttf',
  'Arial':          '/OpenSans-Regular.ttf',
  'sans-serif':     '/OpenSans-Regular.ttf',
  default:          '/OpenSans-Regular.ttf',
};

const fontCache   = {};
const loadPromises = {};

/** Load a font using fetch + opentype.parse (modern API, works in Codespaces/proxied environments) */
async function loadFont(family) {
  const path = FONT_MAP[family] || FONT_MAP.default;
  const url  = (process.env.PUBLIC_URL || '') + path;

  if (fontCache[url]) return fontCache[url];
  if (loadPromises[url]) return loadPromises[url];

  loadPromises[url] = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch font: ${url} (${res.status})`);
      const buffer = await res.arrayBuffer();
      const font   = opentype.parse(buffer);
      fontCache[url] = font;
      return font;
    } catch (err) {
      delete loadPromises[url];   // allow retry
      throw err;
    }
  })();

  return loadPromises[url];
}

/** Pre-warm the font cache on component mount so it's ready before play. */
export async function warmFont(family) {
  try { await loadFont(family); } catch (e) { console.warn('warmFont failed:', e); }
}

/**
 * Convert text → SVG path data for stroke animation.
 * Returns { paths: string[], viewBox: string, width: number, height: number }
 */
export async function textToSvgPaths(text, fontFamily, fontSize = 72) {
  const font = await loadFont(fontFamily);

  const RENDER_SIZE = 120;
  const baseline    = RENDER_SIZE * 0.78;
  const glyphs      = font.stringToGlyphs(text || ' ');

  const paths = [];
  let cursorX = 0;
  const scale = RENDER_SIZE / font.unitsPerEm;

  glyphs.forEach((glyph, i) => {
    const glyphPath = glyph.getPath(cursorX, baseline, RENDER_SIZE);
    const d         = glyphPath.toPathData(2);

    splitContours(d).forEach(seg => {
      if (seg && seg.trim().length > 2) paths.push(seg);
    });

    cursorX += (glyph.advanceWidth || 0) * scale;

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

/** Split a compound SVG path on each M (moveto) command into individual contours */
function splitContours(d) {
  if (!d) return [];
  return d.split(/(?=M)/).map(s => s.trim()).filter(s => s.length > 2);
}