import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("PWA brand assets", () => {
  it("generates CCWEB Foundation icon files", async () => {
    const { execSync } = await import("node:child_process");
    execSync("node scripts/generate-pwa-icons.mjs", { cwd: ROOT, stdio: "pipe" });
    const icons = [
      "public/icons/icon-192.png",
      "public/icons/icon-512.png",
      "public/icons/icon-maskable-512.png",
      "public/icons/icon-maskable-192.png",
      "public/icons/apple-touch-icon.png",
      "public/icons/favicon-32.png",
    ];
    for (const rel of icons) {
      const stat = fs.statSync(path.join(ROOT, rel));
      expect(stat.size).toBeGreaterThan(200);
    }
  });
});

describe("CcwebBrandMark", () => {
  it("exports brand components", async () => {
    const mod = await import("../src/components/brand/CcwebBrandMark.jsx");
    expect(typeof mod.CcwebBrandMark).toBe("function");
    expect(typeof mod.CcwebBrandBolt).toBe("function");
    expect(typeof mod.CcwebBrandAvatarFallback).toBe("function");
  });
});
