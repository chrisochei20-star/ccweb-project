import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
    getPlatform: vi.fn(() => "web"),
  },
}));

function mockStorage() {
  const map = new Map();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
}

describe("capacitorPlatform", () => {
  it("reports web when not native", async () => {
    const { isCapacitorNative, isCapacitorAndroid } = await import("../src/lib/capacitorPlatform.js");
    expect(isCapacitorNative()).toBe(false);
    expect(isCapacitorAndroid()).toBe(false);
  });
});

describe("authStorage", () => {
  beforeEach(() => {
    vi.stubGlobal("sessionStorage", mockStorage());
    vi.stubGlobal("localStorage", mockStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("uses sessionStorage on web", async () => {
    const { authStorageSetItem, authStorageGetItem } = await import("../src/lib/authStorage.js");
    authStorageSetItem("ccweb_session_token", "abc");
    expect(sessionStorage.getItem("ccweb_session_token")).toBe("abc");
    expect(authStorageGetItem("ccweb_session_token")).toBe("abc");
  });
});
