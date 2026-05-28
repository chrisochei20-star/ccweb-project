import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { apiFetch, getApiBearerToken } from "../src/lib/apiClient.js";
import { SESSION_TOKEN_KEY } from "../src/authStorageKeys.js";

vi.mock("../src/lib/supabaseClient.js", () => ({
  getSupabaseAccessToken: vi.fn().mockResolvedValue("supabase-jwt"),
}));

describe("getApiBearerToken", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "sessionStorage",
      (() => {
        const map = new Map();
        return {
          getItem: (k) => map.get(k) ?? null,
          setItem: (k, v) => map.set(k, String(v)),
          removeItem: (k) => map.delete(k),
          clear: () => map.clear(),
        };
      })()
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prefers CCWEB session token over Supabase when both exist", async () => {
    sessionStorage.setItem(SESSION_TOKEN_KEY, "ccweb-access-jwt");
    await expect(getApiBearerToken()).resolves.toBe("ccweb-access-jwt");
  });

  it("falls back to Supabase when no CCWEB token", async () => {
    await expect(getApiBearerToken()).resolves.toBe("supabase-jwt");
  });
});

describe("apiFetch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns response on first success", async () => {
    const ok = new Response(null, { status: 200 });
    globalThis.fetch.mockResolvedValueOnce(ok);
    const r = await apiFetch("https://api.example.com/health", {}, { networkRetries: 1 });
    expect(r.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("retries once on TypeError then succeeds", async () => {
    const ok = new Response(null, { status: 200 });
    globalThis.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch")).mockResolvedValueOnce(ok);
    const r = await apiFetch("https://api.example.com/x", {}, { networkRetries: 1 });
    expect(r.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-network errors", async () => {
    globalThis.fetch.mockRejectedValueOnce(new Error("boom"));
    await expect(apiFetch("https://api.example.com/x", {}, { networkRetries: 2 })).rejects.toThrow("boom");
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});
