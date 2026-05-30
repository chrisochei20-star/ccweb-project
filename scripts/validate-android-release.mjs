#!/usr/bin/env node
/**
 * Android release / Play Store distribution preflight.
 * Run after validate:android and before bundleRelease upload.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
}

const checks = [
  () => {
    const g = read("android/app/build.gradle");
    if (!g) return { ok: false, message: "build.gradle missing" };
    if (!/versionCode\s+4/.test(g)) return { ok: false, message: "Expected versionCode 4 for internal Play testing track" };
    if (!/versionName\s+"1\.2\.1"/.test(g)) return { ok: false, message: "Expected versionName 1.2.1" };
    if (/minifyEnabled\s+true/.test(g)) return { ok: false, message: "minifyEnabled true without release QA sign-off" };
    return { ok: true };
  },
  () => {
    const m = read("android/app/src/main/AndroidManifest.xml");
    if (!m?.includes("android.intent.action.VIEW")) return { ok: false, message: "Deep link intent-filter missing" };
    if (!m?.includes("io.chrisccweb.app")) return { ok: false, message: "Custom scheme intent-filter missing" };
    if (!m?.includes('android:autoVerify="true"')) return { ok: false, message: "App Links autoVerify missing" };
    return { ok: true };
  },
  () => {
    if (!read("src/lib/deepLinkRouter.js")) return { ok: false, message: "deepLinkRouter.js missing" };
    if (!read("src/hooks/useDeepLinkRouting.js")) return { ok: false, message: "useDeepLinkRouting hook missing" };
    if (!read("src/lib/nativeCrashReporting.js")) return { ok: false, message: "nativeCrashReporting.js missing" };
    return { ok: true };
  },
  () => {
    if (!read("public/.well-known/assetlinks.json")) return { ok: false, message: "assetlinks.json template missing" };
    if (!read("android/keystore.properties.example")) return { ok: false, message: "keystore.properties.example missing" };
    return { ok: true };
  },
  () => {
    const m = read("android/app/src/main/AndroidManifest.xml");
    if (m?.includes('android:exported="true"') && !m.includes("MainActivity")) {
      return { ok: false, message: "Unexpected exported components" };
    }
    return { ok: true };
  },
  () => {
    if (!read("docs/ANDROID_RELEASE_QA.md")) return { ok: false, message: "ANDROID_RELEASE_QA.md missing" };
    return { ok: true };
  },
  () => {
    if (!read("docs/ANDROID_PRODUCTION_FINAL_QA.md")) return { ok: false, message: "ANDROID_PRODUCTION_FINAL_QA.md missing" };
    return { ok: true };
  },
  () => {
    if (!read("src/components/settings/NativePermissionsRationale.jsx")) {
      return { ok: false, message: "NativePermissionsRationale.jsx missing" };
    }
    return { ok: true };
  },
  () => {
    const main = read("android/app/src/main/java/io/chrisccweb/app/MainActivity.java");
    if (!main?.includes("SplashScreen.installSplashScreen")) {
      return { ok: false, message: "MainActivity must install SplashScreen API" };
    }
    return { ok: true };
  },
  () => {
    const router = read("src/lib/deepLinkRouter.js");
    if (!router?.includes("invalidAppUrlReason")) {
      return { ok: false, message: "deepLinkRouter invalidAppUrlReason missing" };
    }
    return { ok: true };
  },
  () => {
    if (!read("android/app/google-services.json.example")) {
      return { ok: false, message: "google-services.json.example missing" };
    }
    return { ok: true };
  },
];

const warnings = [
  () => {
    if (fs.existsSync(path.join(ROOT, "android/keystore.properties"))) return { ok: true };
    return { ok: false, warn: true, message: "keystore.properties not configured — release AAB will be unsigned" };
  },
  () => {
    const al = read("public/.well-known/assetlinks.json");
    if (al?.includes("REPLACE_WITH_RELEASE_KEY")) {
      return { ok: false, warn: true, message: "assetlinks.json still has placeholder SHA256 — App Links won't verify" };
    }
    return { ok: true };
  },
  () => {
    if (fs.existsSync(path.join(ROOT, "android/app/google-services.json"))) return { ok: true };
    return { ok: false, warn: true, message: "google-services.json missing — FCM disabled on device" };
  },
];

const failures = [];
const warns = [];

for (const c of checks) {
  const r = c();
  if (!r.ok) failures.push(r.message);
}
for (const w of warnings) {
  const r = w();
  if (!r.ok && r.warn) warns.push(r.message);
}

if (warns.length) {
  console.warn("Android release warnings:");
  for (const w of warns) console.warn(`  ⚠ ${w}`);
}
if (failures.length) {
  console.error("Android release validation failed:");
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}

console.log(`Android release validation passed (${checks.length} checks, ${warns.length} warnings).`);
