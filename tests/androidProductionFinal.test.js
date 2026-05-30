import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("Android production finalization", () => {
  it("documents final QA checklist", () => {
    expect(fs.existsSync(path.join(ROOT, "docs/ANDROID_PRODUCTION_FINAL_QA.md"))).toBe(true);
  });

  it("uses versionCode 4 for internal Play testing track", () => {
    const gradle = fs.readFileSync(path.join(ROOT, "android/app/build.gradle"), "utf8");
    expect(gradle).toMatch(/versionCode\s+4/);
    expect(gradle).toMatch(/versionName\s+"1\.2\.1"/);
  });

  it("installs Android 12+ splash screen in MainActivity", () => {
    const main = fs.readFileSync(
      path.join(ROOT, "android/app/src/main/java/io/chrisccweb/app/MainActivity.java"),
      "utf8"
    );
    expect(main).toContain("SplashScreen.installSplashScreen");
    expect(main).toContain("ccweb_messages");
  });

  it("exports native push permission helper", async () => {
    const mod = await import("../src/lib/nativePush.js");
    expect(typeof mod.ensureNotificationPermission).toBe("function");
    expect(typeof mod.refreshNativePushRegistration).toBe("function");
  });

  it("exports shell-ready signal for splash handoff", async () => {
    const mod = await import("../src/lib/capacitorPlatform.js");
    expect(typeof mod.signalNativeShellReady).toBe("function");
  });

  it("includes google-services.json.example template", () => {
    const example = path.join(ROOT, "android/app/google-services.json.example");
    expect(fs.existsSync(example)).toBe(true);
    const json = JSON.parse(fs.readFileSync(example, "utf8"));
    expect(json.client[0].client_info.android_client_info.package_name).toBe("io.chrisccweb.app");
  });
});
