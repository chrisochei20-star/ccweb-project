import { describe, it, expect, vi, afterEach } from "vitest";
import {
  apiUrl,
  CCWEB_CANONICAL_PRODUCTION_API,
  getApiBaseUrl,
  isObsoleteCcwebApiOrigin,
  isUnsafeProductionApiBase,
} from "../src/config/env.js";

describe("isObsoleteCcwebApiOrigin", () => {
  it("flags retired Render-style API hosts", () => {
    expect(isObsoleteCcwebApiOrigin("https://ccweb-render-main.onrender.com")).toBe(true);
    expect(isObsoleteCcwebApiOrigin("https://ccweb-render-main.onrender.com/")).toBe(true);
    expect(isObsoleteCcwebApiOrigin("https://ccweb-render-staging.fly.dev")).toBe(false);
  });

  it("does not flag normal API hosts", () => {
    expect(isObsoleteCcwebApiOrigin("https://ccweb-api-production-a92c.up.railway.app")).toBe(false);
    expect(isObsoleteCcwebApiOrigin("https://api.example.com")).toBe(false);
  });
});

describe("isUnsafeProductionApiBase", () => {
  it("treats non-Railway https hosts as unsafe unless allowlisted escape hatch is enabled", () => {
    expect(isUnsafeProductionApiBase("https://api.example.com")).toBe(true);
    expect(isUnsafeProductionApiBase(CCWEB_CANONICAL_PRODUCTION_API)).toBe(false);
    expect(isUnsafeProductionApiBase("https://ccweb-api-production-xyz12.up.railway.app")).toBe(false);
  });
});

describe("apiUrl", () => {
  it("joins a configured base without double slash", () => {
    expect(apiUrl("/api/courses")).toMatch(/\/api\/courses$/);
  });
});

describe("getApiBaseUrl with stubbed VITE_API_BASE_URL", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("rewrites a stale onrender URL using VITE_CCWEB_LEGACY_API_REPLACE_TO when set (dev / test bundle)", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://ccweb-render-main.onrender.com");
    vi.stubEnv("VITE_CCWEB_LEGACY_API_REPLACE_TO", "https://live-api.example.com");
    vi.resetModules();
    const { getApiBaseUrl: fresh } = await import("../src/config/env.js");
    expect(fresh()).toBe("https://live-api.example.com");
  });

  it("preserves an allowed Railway production API URL", async () => {
    const explicit = "https://ccweb-api-production-a92c.up.railway.app";
    vi.stubEnv("VITE_API_BASE_URL", explicit);
    vi.resetModules();
    const { getApiBaseUrl: fresh } = await import("../src/config/env.js");
    expect(fresh()).toBe(explicit);
  });

  it("allows a sibling ccweb-api-production-* Railway host", async () => {
    const sibling = "https://ccweb-api-production-zz99.up.railway.app";
    vi.stubEnv("VITE_API_BASE_URL", sibling);
    vi.resetModules();
    const { getApiBaseUrl: fresh } = await import("../src/config/env.js");
    expect(fresh()).toBe(sibling);
  });
});
