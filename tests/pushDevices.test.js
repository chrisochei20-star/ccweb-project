import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("persistencePushDevices", () => {
  it("ensures ccweb_users exists before push device upsert (FK regression)", () => {
    const src = fs.readFileSync(path.join(ROOT, "db/persistencePushDevices.js"), "utf8");
    expect(src).toContain(
      "INSERT INTO ccweb_users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING"
    );
    expect(src).toContain("async function ensureCcwebUser(userId)");
    const upsertIdx = src.indexOf("async function upsertDeviceToken");
    const ensureCallIdx = src.indexOf("await ensureCcwebUser(userId)");
    expect(upsertIdx).toBeGreaterThan(-1);
    expect(ensureCallIdx).toBeGreaterThan(upsertIdx);
    const insertPushIdx = src.indexOf("INSERT INTO ccweb_push_devices");
    expect(ensureCallIdx).toBeLessThan(insertPushIdx);
  });

  it("exports ensureCcwebUser for parity with chat/notifications persistence", async () => {
    const mod = await import("../db/persistencePushDevices.js");
    expect(typeof mod.ensureCcwebUser).toBe("function");
    expect(typeof mod.upsertDeviceToken).toBe("function");
  });
});
