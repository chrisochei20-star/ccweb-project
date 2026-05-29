import { describe, expect, it, vi } from "vitest";

describe("releaseLog", () => {
  it("suppresses releaseLog in production without debug flag", async () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_CCWEB_DEBUG", "");
    vi.spyOn(console, "log").mockImplementation(() => {});
    const { releaseLog } = await import("../src/lib/releaseLog.js");
    releaseLog("hidden");
    expect(console.log).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("allows releaseLog when debug flag set", async () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_CCWEB_DEBUG", "1");
    vi.spyOn(console, "log").mockImplementation(() => {});
    const { releaseLog } = await import("../src/lib/releaseLog.js");
    releaseLog("visible");
    expect(console.log).toHaveBeenCalled();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });
});
