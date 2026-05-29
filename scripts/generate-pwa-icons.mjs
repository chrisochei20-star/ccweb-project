#!/usr/bin/env node
/**
 * Generate minimal branded PNG icons for PWA installability (192, 512, maskable).
 * Uses only Node built-ins — no image dependencies.
 */
import fs from "fs";
import path from "path";
import zlib from "zlib";

const OUT = path.resolve("public/icons");

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

function pngSolid(size, { r, g, b }, inset = 0) {
  const width = size;
  const height = size;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1) + 1;
    for (let x = 0; x < width; x += 1) {
      const i = row + x * 4;
      const edge = x < inset || y < inset || x >= width - inset || y >= height - inset;
      raw[i] = edge ? 3 : r;
      raw[i + 1] = edge ? 7 : g;
      raw[i + 2] = edge ? 18 : b;
      raw[i + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function writeIcon(name, size, inset = 0) {
  const buf = pngSolid(size, { r: 34, g: 211, b: 238 }, inset);
  fs.writeFileSync(path.join(OUT, name), buf);
}

fs.mkdirSync(OUT, { recursive: true });
writeIcon("icon-192.png", 192, 12);
writeIcon("icon-512.png", 512, 32);
writeIcon("icon-maskable-512.png", 512, 64);
console.log("[pwa-icons] wrote icon-192.png, icon-512.png, icon-maskable-512.png");
