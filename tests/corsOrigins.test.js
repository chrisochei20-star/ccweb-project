import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("parseAllowedOrigins (CORS)", async () => {
  let prev;

  beforeEach(() => {
    prev = { ...process.env };
    delete process.env.CCWEB_ALLOWED_ORIGINS;
    delete process.env.NODE_ENV;
    delete process.env.CCWEB_BOOT_WARN_ONLY;
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...prev };
  });

  it("treats * as allow-all mode", async () => {
    process.env.CCWEB_ALLOWED_ORIGINS = "*";
    const { parseAllowedOrigins } = await import("../security/expressHardDefaults.js");
    expect(parseAllowedOrigins()).toEqual({ mode: "all" });
  });

  it("parses comma-separated origins as list mode", async () => {
    process.env.CCWEB_ALLOWED_ORIGINS = "https://a.com, https://b.com";
    const { parseAllowedOrigins } = await import("../security/expressHardDefaults.js");
    expect(parseAllowedOrigins()).toEqual({
      mode: "list",
      origins: ["https://a.com", "https://b.com"],
    });
  });

  it("allows all origins in production when CCWEB_BOOT_WARN_ONLY=1 and origins unset", async () => {
    process.env.NODE_ENV = "production";
    process.env.CCWEB_BOOT_WARN_ONLY = "1";
    const { parseAllowedOrigins } = await import("../security/expressHardDefaults.js");
    expect(parseAllowedOrigins()).toEqual({ mode: "all" });
  });
});
