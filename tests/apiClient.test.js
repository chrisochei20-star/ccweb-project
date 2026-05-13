import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { apiFetch } from "../src/lib/apiClient.js";

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
