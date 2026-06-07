import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("parseAllowedOrigins (CORS)", () => {
  let prev;

  beforeEach(() => {
    prev = { ...process.env };
    delete process.env.CCWEB_ALLOWED_ORIGINS;
    delete process.env.NODE_ENV;
    delete process.env.CCWEB_BOOT_WARN_ONLY;
    delete process.env.PUBLIC_APP_URL;
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
    const o = parseAllowedOrigins();
    expect(o.mode).toBe("list");
    expect(o.origins).toContain("https://a.com");
    expect(o.origins).toContain("https://b.com");
    expect(o.origins).toContain("https://localhost");
    expect(o.origins).toContain("capacitor://localhost");
  });

  it("merges PUBLIC_APP_URL origin into explicit allowlist for CORS", async () => {
    process.env.CCWEB_ALLOWED_ORIGINS = "https://a.com";
    process.env.PUBLIC_APP_URL = "https://b.com/";
    const { parseAllowedOrigins } = await import("../security/expressHardDefaults.js");
    const o = parseAllowedOrigins();
    expect(o.mode).toBe("list");
    expect(o.origins).toContain("https://a.com");
    expect(o.origins).toContain("https://b.com");
  });

  it("normalizes trailing paths in CCWEB_ALLOWED_ORIGINS to scheme-host only", async () => {
    process.env.CCWEB_ALLOWED_ORIGINS = "https://spa.vercel.app/foo, https://other.example/path";
    const { parseAllowedOrigins } = await import("../security/expressHardDefaults.js");
    const o = parseAllowedOrigins();
    expect(o.mode).toBe("list");
    expect(o.origins).toContain("https://spa.vercel.app");
    expect(o.origins).toContain("https://other.example");
  });

  it("allows all origins in production when CCWEB_BOOT_WARN_ONLY=1 and origins unset", async () => {
    process.env.NODE_ENV = "production";
    process.env.CCWEB_BOOT_WARN_ONLY = "1";
    const { parseAllowedOrigins } = await import("../security/expressHardDefaults.js");
    expect(parseAllowedOrigins()).toEqual({ mode: "all" });
  });

  it("always merges Capacitor native origins in list mode", async () => {
    process.env.CCWEB_ALLOWED_ORIGINS = "https://spa.example.com";
    const { parseAllowedOrigins, CAPACITOR_NATIVE_ORIGINS } = await import(
      "../security/expressHardDefaults.js"
    );
    const o = parseAllowedOrigins();
    expect(o.mode).toBe("list");
    for (const cap of CAPACITOR_NATIVE_ORIGINS) {
      expect(o.origins).toContain(cap);
    }
    expect(o.origins).toContain("https://spa.example.com");
  });

  it("merges Capacitor native origins when only PUBLIC_APP_URL is set in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.PUBLIC_APP_URL = "https://ccweb-project-b4jq.vercel.app";
    const { parseAllowedOrigins } = await import("../security/expressHardDefaults.js");
    const o = parseAllowedOrigins();
    expect(o.mode).toBe("list");
    expect(o.origins).toContain("https://ccweb-project-b4jq.vercel.app");
    expect(o.origins).toContain("https://localhost");
    expect(o.origins).toContain("capacitor://localhost");
  });

  it("does not add Capacitor origins when CCWEB_ALLOWED_ORIGINS is *", async () => {
    process.env.CCWEB_ALLOWED_ORIGINS = "*";
    const { parseAllowedOrigins } = await import("../security/expressHardDefaults.js");
    expect(parseAllowedOrigins()).toEqual({ mode: "all" });
  });
});
