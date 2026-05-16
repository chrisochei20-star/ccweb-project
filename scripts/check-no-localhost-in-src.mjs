#!/usr/bin/env node
/**
 * Fails if src/ contains localhost / 127.0.0.1 literals (excluding this policy in env helper comments).
 */
import fs from "fs";
import path from "path";

const bad = /localhost|127\.0\.0\.1/i;
const root = path.join(process.cwd(), "src");
const skipFiles = new Set(); // e.g. allowlisted filenames

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walk(p, out);
    else if (/\.(jsx?|tsx?|mjs|cjs)$/i.test(name.name) && !skipFiles.has(p)) out.push(p);
  }
  return out;
}

let failed = false;
for (const file of walk(root)) {
  const text = fs.readFileSync(file, "utf8");
  if (!bad.test(text)) continue;
  const rel = path.relative(process.cwd(), file);
  console.error(`[check-no-localhost] ${rel} contains localhost or 127.0.0.1`);
  failed = true;
}

if (failed) process.exit(1);
console.log("[check-no-localhost] OK");
