import { describe, it, expect } from "vitest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const ai = require("../services/aiExecute.js");

describe("aiExecute helpers", () => {
  it("clampMaxTokens respects cap", () => {
    expect(ai.clampMaxTokens(9000, 1200)).toBeLessThanOrEqual(4096);
    expect(ai.clampMaxTokens(100, 1200)).toBe(100);
    expect(ai.clampMaxTokens(undefined, 800)).toBe(800);
  });

  it("isRetryableOpenAIStatus identifies transient codes", () => {
    expect(ai.isRetryableOpenAIStatus(429)).toBe(true);
    expect(ai.isRetryableOpenAIStatus(502)).toBe(true);
    expect(ai.isRetryableOpenAIStatus(503)).toBe(true);
    expect(ai.isRetryableOpenAIStatus(400)).toBe(false);
  });
});

describe("formatAiError", () => {
  it("maps AI_NOT_CONFIGURED to unavailable", async () => {
    const { formatAiError } = await import("../src/lib/aiDiagnostics.js");
    const out = formatAiError(Object.assign(new Error("x"), { code: "AI_NOT_CONFIGURED" }));
    expect(out.unavailable).toBe(true);
    expect(out.retryable).toBe(false);
  });

  it("maps AbortError to retryable cancel", async () => {
    const { formatAiError } = await import("../src/lib/aiDiagnostics.js");
    const out = formatAiError(Object.assign(new Error("aborted"), { name: "AbortError" }));
    expect(out.retryable).toBe(true);
  });
});
