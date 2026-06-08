import { describe, expect, it, vi } from "vitest";

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
  },
}));

describe("releaseLog", () => {
  it("does not import capacitorPlatform (avoids init cycle)", async () => {
    const mod = await import("../src/lib/releaseLog.js");
    expect(typeof mod.releaseDiag).toBe("function");
    expect(() => mod.releaseDiag("test_cycle", { ok: true })).not.toThrow();
  });
});
