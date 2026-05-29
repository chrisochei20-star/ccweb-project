#!/usr/bin/env node
/**
 * Fail CI/deploy prep if any external npm package is imported but not listed in package.json.
 * Skips Node builtins and paths under packages/* local workspaces (optional allowlist).
 */

const fs = require("fs");
const path = require("path");
const { builtinModules } = require("module");

const ROOT = path.resolve(__dirname, "..");
const builtins = new Set(
  builtinModules.flatMap((m) => [m, `node:${m}`])
);

function stripCommentsRough(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/[^\n]*/gm, "");
}

function rootPkg(spec) {
  if (!spec || spec.startsWith(".") || spec.startsWith("/")) return null;
  if (spec.startsWith("@")) {
    const p = spec.split("/");
    return p.length >= 2 ? `${p[0]}/${p[1]}` : spec;
  }
  return spec.split("/")[0];
}

function walk(dir, files = []) {
  const ents = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of ents) {
    if (e.name === "node_modules" || e.name === "dist" || e.name === ".git") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, files);
    else if (/\.(js|jsx|mjs|cjs)$/.test(e.name)) files.push(p);
  }
  return files;
}

function extractSpecs(content) {
  const specs = [];
  const res = [
    ...content.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g),
    ...content.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g),
    ...content.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g),
  ];
  for (const m of res) specs.push(m[1]);
  return specs;
}

const pkgPath = path.join(ROOT, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const declared = new Set([
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
  ...Object.keys(pkg.optionalDependencies || {}),
]);

/** Local workspace packages under packages/ — not required in root package.json */
const allowExtra = new Set([]);
try {
  const pkgsDir = path.join(ROOT, "packages");
  if (fs.existsSync(pkgsDir)) {
    for (const name of fs.readdirSync(pkgsDir)) {
      const pj = path.join(pkgsDir, name, "package.json");
      if (!fs.existsSync(pj)) continue;
      try {
        const meta = JSON.parse(fs.readFileSync(pj, "utf8"));
        if (meta.name && typeof meta.name === "string") allowExtra.add(meta.name);
      } catch {
        /* ignore */
      }
    }
  }
} catch {
  /* ignore */
}

const used = new Map();

for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  if (rel.startsWith(`packages${path.sep}`) && rel.endsWith("package.json")) continue;
  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const content = stripCommentsRough(raw);
  for (const spec of extractSpecs(content)) {
    const r = rootPkg(spec);
    if (!r || builtins.has(r)) continue;
    if (!used.has(r)) used.set(r, []);
    used.get(r).push(rel);
  }
}

const missing = [];
for (const name of used.keys()) {
  if (declared.has(name)) continue;
  if (allowExtra.has(name)) continue;
  missing.push({ name, files: used.get(name) });
}

missing.sort((a, b) => a.name.localeCompare(b.name));

if (missing.length) {
  console.error("[verify:imports] Missing from package.json (imported but not declared):\n");
  for (const m of missing) {
    console.error(`  • ${m.name}`);
    console.error("      imported from:");
    for (const f of [...new Set(m.files)].slice(0, 5)) console.error(`        ${f}`);
    if (m.files.length > 5) console.error(`      … +${m.files.length - 5} more`);
  }
  process.exit(1);
}

console.log(`[verify:imports] OK: all ${used.size} external package roots are declared in package.json.`);
