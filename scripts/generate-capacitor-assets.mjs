#!/usr/bin/env node
/**
 * Generate CCWEB Android launcher icons + splash PNGs (no image deps).
 * Run after `npx cap add android` or before first sync.
 */
import fs from "fs";
import path from "path";
import zlib from "zlib";

const ROOT = process.cwd();
const RES = path.join(ROOT, "android", "app", "src", "main", "res");
const BRAND = { r: 34, g: 211, b: 238 };
const BG = { r: 3, g: 7, b: 18 };

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function pngFromPixels(width, height, pixelFn) {
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
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function iconPixel(x, y, size) {
  const inset = Math.round(size * 0.12);
  const edge = x < inset || y < inset || x >= size - inset || y >= size - inset;
  if (edge) return { r: 3, g: 7, b: 18 };
  const cx = size / 2;
  const cy = size / 2;
  const r = Math.hypot(x - cx, y - cy);
  if (r < size * 0.22) return BRAND;
  return BG;
}

function splashPixel(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.hypot(x - cx, y - cy);
  if (r < Math.min(w, h) * 0.08) return BRAND;
  return BG;
}

function writePng(filePath, buf) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buf);
}

const MIPMAP = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

if (!fs.existsSync(path.join(ROOT, "android"))) {
  console.warn("[capacitor-assets] android/ not found — run `npx cap add android` first; skipping Android res writes.");
  process.exit(0);
}

for (const [folder, size] of Object.entries(MIPMAP)) {
  const buf = pngFromPixels(size, size, (x, y) => iconPixel(x, y, size));
  writePng(path.join(RES, folder, "ic_launcher.png"), buf);
  writePng(path.join(RES, folder, "ic_launcher_round.png"), buf);
  writePng(path.join(RES, folder, "ic_launcher_foreground.png"), buf);
}

const splashW = 1280;
const splashH = 1920;
const splashBuf = pngFromPixels(splashW, splashH, splashPixel);
writePng(path.join(RES, "drawable", "splash.png"), splashBuf);
writePng(path.join(RES, "drawable-port-mdpi", "splash.png"), splashBuf);
writePng(path.join(RES, "drawable-port-hdpi", "splash.png"), splashBuf);
writePng(path.join(RES, "drawable-port-xhdpi", "splash.png"), splashBuf);
writePng(path.join(RES, "drawable-port-xxhdpi", "splash.png"), splashBuf);
writePng(path.join(RES, "drawable-port-xxxhdpi", "splash.png"), splashBuf);

console.log("[capacitor-assets] wrote Android launcher icons + splash PNGs");
