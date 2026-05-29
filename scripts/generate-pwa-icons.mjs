#!/usr/bin/env node
/**
 * Generate CCWEB Foundation PWA / favicon PNGs from shared brand rasterizer.
 * Source: assets/brand/ccweb-foundation-logo.svg (via scripts/lib/brandIconRaster.mjs)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  pngFromPixels,
  writePng,
  renderPwaIconPixel,
  renderPwaMaskablePixel,
} from "./lib/brandIconRaster.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "icons");
const PREVIEW = path.join(ROOT, "docs", "assets", "pwa-icons");

function writeIcon(name, size, pixelFn) {
  const buf = pngFromPixels(size, size, (x, y) => pixelFn(x, y, size));
  writePng(path.join(OUT, name), buf);
  return buf;
}

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(PREVIEW, { recursive: true });

const standardSizes = [
  ["favicon-16.png", 16],
  ["favicon-32.png", 32],
  ["icon-72.png", 72],
  ["icon-96.png", 96],
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
];

const maskableSizes = [
  ["icon-maskable-192.png", 192],
  ["icon-maskable-512.png", 512],
];

for (const [name, size] of standardSizes) {
  writeIcon(name, size, renderPwaIconPixel);
}

for (const [name, size] of maskableSizes) {
  writeIcon(name, size, renderPwaMaskablePixel);
}

writePng(path.join(PREVIEW, "pwa-icon-512.png"), pngFromPixels(512, 512, (x, y) => renderPwaIconPixel(x, y, 512)));
writePng(
  path.join(PREVIEW, "pwa-maskable-512.png"),
  pngFromPixels(512, 512, (x, y) => renderPwaMaskablePixel(x, y, 512))
);

console.log("[pwa-icons] CCWEB Foundation PWA icons generated:");
for (const [name] of [...standardSizes, ...maskableSizes]) {
  console.log(`  • public/icons/${name}`);
}
console.log(`  • previews → docs/assets/pwa-icons/`);
