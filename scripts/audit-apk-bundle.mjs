#!/usr/bin/env node
/**
 * Compare a built Android APK web bundle against dist/ on main branch.
 * Usage: node scripts/audit-apk-bundle.mjs [path/to/app-debug.apk]
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const apkPath = process.argv[2] || path.join(ROOT, "android/app/build/outputs/apk/debug/app-debug.apk");
const distDir = path.join(ROOT, "dist/assets");
const markers = [
  "ccweb-native-splash",
  "Restoring your session",
  "For you",
  "Voice message",
  "Network error",
  "ccweb-page-enter",
  "Build your Following feed",
];

function listDistJs() {
  if (!fs.existsSync(distDir)) return [];
  return fs.readdirSync(distDir).filter((f) => f.endsWith(".js"));
}

function extractApkJsNames() {
  if (!fs.existsSync(apkPath)) return null;
  const out = execSync(`unzip -Z1 "${apkPath}" 'assets/public/assets/*.js' 2>/dev/null || true`, {
    encoding: "utf8",
  });
  return out
    .split("\n")
    .filter(Boolean)
    .map((p) => path.basename(p));
}

function grepApkMarkers() {
  if (!fs.existsSync(apkPath)) return {};
  const found = {};
  for (const m of markers) {
    try {
      const hit = execSync(`unzip -p "${apkPath}" 'assets/public/assets/*.js' 2>/dev/null | rg -F "${m}" -m 1`, {
        encoding: "utf8",
      });
      found[m] = Boolean(hit.trim());
    } catch {
      found[m] = false;
    }
  }
  return found;
}

function gitHead() {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

const distJs = listDistJs();
const apkJs = extractApkJsNames();
const markerHits = grepApkMarkers();

const report = {
  gitHead: gitHead(),
  apkPath,
  apkExists: fs.existsSync(apkPath),
  apkSizeBytes: fs.existsSync(apkPath) ? fs.statSync(apkPath).size : 0,
  distJsCount: distJs.length,
  apkJsCount: apkJs?.length ?? 0,
  distSample: distJs.slice(0, 5),
  apkSample: apkJs?.slice(0, 5) ?? [],
  markers: markerHits,
  staleAssetHint:
    distJs.length > 0 && apkJs && !distJs.some((f) => apkJs.includes(f))
      ? "APK JS filenames differ from current dist/ — rebuild required"
      : null,
};

console.log(JSON.stringify(report, null, 2));
if (!report.apkExists) process.exit(2);
if (Object.values(markerHits).filter(Boolean).length < 3) process.exit(3);
