/**
 * CCWEB Foundation logo rasterization — pure Node.js, no image deps.
 * Geometry matches assets/brand/ccweb-foundation-logo.svg
 */

import fs from "fs";
import path from "path";
import zlib from "zlib";

export const BRAND = {
  cyan: { r: 34, g: 211, b: 238 },
  cyanDark: { r: 8, g: 145, b: 178 },
  blue: { r: 37, g: 99, b: 235 },
  blueDeep: { r: 29, g: 78, b: 216 },
  violet: { r: 167, g: 139, b: 250 },
  white: { r: 255, g: 255, b: 255 },
  bgDark: { r: 3, g: 7, b: 18 },
  bgMid: { r: 10, g: 22, b: 42 },
  bgLight: { r: 15, g: 32, b: 58 },
};

/** Lightning bolt polygon in 108×108 viewBox coordinates */
export const BOLT_POLY_108 = [
  [58.5, 22],
  [38, 58],
  [52, 58],
  [49.5, 86],
  [70, 50],
  [56, 50],
];

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function lerpColor(c1, c2, t) {
  return {
    r: Math.round(lerp(c1.r, c2.r, t)),
    g: Math.round(lerp(c1.g, c2.g, t)),
    b: Math.round(lerp(c1.b, c2.b, t)),
  };
}

export function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const yi = poly[i][1];
    const xj = poly[j][0];
    const yj = poly[j][1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

export function scalePoly(poly, size, margin = 0.18) {
  const inner = size * (1 - margin * 2);
  const offset = size * margin;
  return poly.map(([x, y]) => [offset + (x / 108) * inner, offset + (y / 108) * inner]);
}

export function boltColorAt(nx, ny) {
  const t = Math.max(0, Math.min(1, (ny - 0.15) / 0.85));
  if (t < 0.35) return lerpColor(BRAND.white, BRAND.cyan, t / 0.35);
  if (t < 0.72) return lerpColor(BRAND.cyan, BRAND.blue, (t - 0.35) / 0.37);
  return lerpColor(BRAND.blue, BRAND.blueDeep, (t - 0.72) / 0.28);
}

export function glowAlpha(x, y, size) {
  const cx = size / 2;
  const cy = size / 2;
  const r = Math.hypot(x - cx, y - cy);
  const maxR = size * 0.38;
  if (r > maxR) return 0;
  return (1 - r / maxR) ** 1.6 * 0.32;
}

export function backgroundColorAt(x, y, size, variant = "dark") {
  const cx = size / 2;
  const cy = size / 2;
  const r = Math.hypot(x - cx, y - cy) / (size * 0.72);
  const t = Math.min(1, r);
  if (variant === "light") {
    return lerpColor({ r: 248, g: 250, b: 252 }, { r: 224, g: 242, b: 254 }, t);
  }
  const base = lerpColor(BRAND.bgDark, BRAND.bgMid, t * 0.65);
  const glow = glowAlpha(x, y, size);
  return {
    r: Math.min(255, Math.round(base.r + BRAND.cyan.r * glow)),
    g: Math.min(255, Math.round(base.g + BRAND.cyan.g * glow)),
    b: Math.min(255, Math.round(base.b + BRAND.cyan.b * glow)),
  };
}

export function renderForegroundPixel(x, y, size) {
  const poly = scalePoly(BOLT_POLY_108, size, 0.16);
  const nx = x / size;
  const ny = y / size;
  const glow = glowAlpha(x, y, size);
  if (pointInPoly(x, y, poly)) {
    const c = boltColorAt(nx, ny);
    return { r: c.r, g: c.g, b: c.b, a: 255 };
  }
  if (glow > 0.02) {
    return { r: BRAND.cyan.r, g: BRAND.cyan.g, b: BRAND.cyan.b, a: Math.round(glow * 255) };
  }
  return { r: 0, g: 0, b: 0, a: 0 };
}

export function renderMonochromePixel(x, y, size) {
  const poly = scalePoly(BOLT_POLY_108, size, 0.16);
  if (pointInPoly(x, y, poly)) return { r: 255, g: 255, b: 255, a: 255 };
  return { r: 0, g: 0, b: 0, a: 0 };
}

export function renderLegacyPixel(x, y, size) {
  const bg = backgroundColorAt(x, y, size, "dark");
  const fg = renderForegroundPixel(x, y, size);
  if (fg.a === 0) return { r: bg.r, g: bg.g, b: bg.b, a: 255 };
  const a = fg.a / 255;
  return {
    r: Math.round(bg.r * (1 - a) + fg.r * a),
    g: Math.round(bg.g * (1 - a) + fg.g * a),
    b: Math.round(bg.b * (1 - a) + fg.b * a),
    a: 255,
  };
}

export function renderRoundPixel(x, y, size) {
  const cx = size / 2;
  const cy = size / 2;
  const r = Math.hypot(x - cx, y - cy);
  if (r > size / 2 - 0.5) return { r: 0, g: 0, b: 0, a: 0 };
  return renderLegacyPixel(x, y, size);
}

export function renderSplashPixel(x, y, w, h) {
  const bg = backgroundColorAt(x, y, Math.min(w, h), "dark");
  const logoSize = Math.min(w, h) * 0.22;
  const ox = (w - logoSize) / 2;
  const oy = (h - logoSize) / 2 - h * 0.04;
  const lx = ((x - ox) / logoSize) * sizeForLocal(logoSize);
  const ly = ((y - oy) / logoSize) * sizeForLocal(logoSize);
  if (x >= ox && x < ox + logoSize && y >= oy && y < oy + logoSize) {
    const localSize = sizeForLocal(logoSize);
    const fg = renderForegroundPixel(lx, ly, localSize);
    if (fg.a > 0) {
      const a = fg.a / 255;
      return {
        r: Math.round(bg.r * (1 - a) + fg.r * a),
        g: Math.round(bg.g * (1 - a) + fg.g * a),
        b: Math.round(bg.b * (1 - a) + fg.b * a),
        a: 255,
      };
    }
  }
  return { r: bg.r, g: bg.g, b: bg.b, a: 255 };
}

function sizeForLocal(n) {
  return Math.max(64, Math.round(n));
}

/** PWA maskable icon — full background, bolt in 80% safe zone */
export function renderPwaMaskablePixel(x, y, size) {
  const bg = backgroundColorAt(x, y, size, "dark");
  const poly = scalePoly(BOLT_POLY_108, size, 0.24);
  const nx = x / size;
  const ny = y / size;
  if (pointInPoly(x, y, poly)) {
    const c = boltColorAt(nx, ny);
    return { r: c.r, g: c.g, b: c.b, a: 255 };
  }
  return { r: bg.r, g: bg.g, b: bg.b, a: 255 };
}

/** Standard PWA / favicon — matches Android legacy launcher composite */
export function renderPwaIconPixel(x, y, size) {
  return renderLegacyPixel(x, y, size);
}

/** Notification icon — white bolt silhouette, high contrast at 24dp */
export function renderNotificationPixel(x, y, size) {
  const poly = scalePoly(BOLT_POLY_108, size, 0.22);
  if (pointInPoly(x, y, poly)) return { r: 255, g: 255, b: 255, a: 255 };
  return { r: 0, g: 0, b: 0, a: 0 };
}

export function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return ~c >>> 0;
}

export function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

export function pngFromPixels(width, height, pixelFn) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1) + 1;
    for (let x = 0; x < width; x += 1) {
      const i = row + x * 4;
      const { r, g, b, a = 255 } = pixelFn(x, y, width, height);
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

export function writePng(filePath, buf) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buf);
}
