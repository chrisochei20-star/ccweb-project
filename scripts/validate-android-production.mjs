#!/usr/bin/env node
/**
 * Pre-release checks for CCWEB Capacitor Android production readiness.
 * Does not require a connected device or Firebase credentials.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs, "utf8");
}

function mustExist(rel, label = rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    return { ok: false, message: `Missing ${label}` };
  }
  return { ok: true };
}

function mustInclude(rel, needle, label) {
  const src = read(rel);
  if (src == null) return { ok: false, message: `Missing file ${rel}` };
  if (!src.includes(needle)) return { ok: false, message: label || `${rel} must include ${needle}` };
  return { ok: true };
}

const checks = [
  mustExist("android/app/build.gradle"),
  () => {
    const g = read("android/app/build.gradle");
    if (!g) return { ok: false, message: "android/app/build.gradle unreadable" };
    if (!/versionCode\s+\d+/.test(g)) return { ok: false, message: "versionCode not set in build.gradle" };
    if (!/versionName\s+"[^"]+"/.test(g)) return { ok: false, message: "versionName not set in build.gradle" };
    const buildTypes = g.match(/buildTypes\s*\{/g) || [];
    if (buildTypes.length > 1) return { ok: false, message: "Duplicate buildTypes block in build.gradle" };
    return { ok: true };
  },
  mustExist("android/app/src/main/AndroidManifest.xml"),
  () => mustInclude("android/app/src/main/AndroidManifest.xml", "ic_stat_ccweb", "FCM default notification icon meta-data"),
  () => mustInclude("android/app/src/main/AndroidManifest.xml", "ccweb_notification", "FCM default notification color meta-data"),
  mustExist("android/app/src/main/res/drawable/ic_stat_ccweb.xml"),
  mustExist("android/app/src/main/res/values/colors.xml"),
  () => mustInclude("android/app/src/main/java/io/chrisccweb/app/MainActivity.java", "ccweb_messages", "MainActivity notification channels"),
  mustExist("capacitor.config.json"),
  () => mustInclude("capacitor.config.json", "io.chrisccweb.app", "Capacitor appId"),
  mustExist("src/ccweb-native.css"),
  () => mustInclude("src/main.jsx", "ccweb-native.css", "Native CSS imported in main.jsx"),
  mustExist("src/lib/nativeBackStack.js"),
  mustExist("src/hooks/useAppResume.js"),
  mustExist("src/pages/SettingsPage.jsx"),
  () => mustInclude("src/App.jsx", 'path="settings"', "Settings route registered"),
  mustExist("src/components/media/ImageViewerModal.jsx"),
  mustExist("src/components/media/NativeMediaPicker.jsx"),
  () => mustInclude("services/fcmPush.js", "resolveAndroidChannel", "FCM Android channel resolver"),
];

const warnings = [
  () => {
    if (fs.existsSync(path.join(ROOT, "android/app/google-services.json"))) return { ok: true };
    return { ok: false, warn: true, message: "google-services.json not present (FCM disabled until Firebase is configured)" };
  },
  () => {
    if (fs.existsSync(path.join(ROOT, "android/keystore.properties"))) return { ok: true };
    return { ok: false, warn: true, message: "keystore.properties not present (release signing not configured locally)" };
  },
];

const failures = [];
const warns = [];

for (const check of checks) {
  const result = typeof check === "function" ? check() : check;
  if (!result.ok) failures.push(result.message);
}

for (const check of warnings) {
  const result = check();
  if (!result.ok && result.warn) warns.push(result.message);
}

if (warns.length) {
  console.warn("Android production warnings:");
  for (const w of warns) console.warn(`  ⚠ ${w}`);
}

if (failures.length) {
  console.error("Android production validation failed:");
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}

console.log(`Android production validation passed (${checks.length} checks, ${warns.length} warnings).`);
