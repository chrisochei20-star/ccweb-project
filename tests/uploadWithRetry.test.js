import { describe, it, expect, vi } from "vitest";
import { fetchWithRetry } from "../src/lib/uploadWithRetry";

describe("fetchWithRetry", () => {
  it("retries transient 503 then returns success", async () => {
    const fn = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    const res = await fetchWithRetry(fn, { retries: 3, baseDelayMs: 1 });
    expect(res.ok).toBe(true);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws after exhausted retries on network error", async () => {
    const fn = vi.fn().mockRejectedValue(new TypeError("failed to fetch"));
    await expect(fetchWithRetry(fn, { retries: 2, baseDelayMs: 1 })).rejects.toThrow(/fetch/i);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
