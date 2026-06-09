import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

describe("aiExecute OpenAI quota fallback", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "sk-test-key";
    delete process.env.CCWEB_REQUIRE_OPENAI;
    delete require.cache[require.resolve("../services/aiExecute.js")];
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    vi.unstubAllGlobals();
    delete require.cache[require.resolve("../services/aiExecute.js")];
  });

  it("falls back to mock when OpenAI returns quota exceeded", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        text: async () =>
          JSON.stringify({
            error: {
              message:
                "You exceeded your current quota, please check your plan and billing details.",
            },
          }),
      }))
    );

    const ai = require("../services/aiExecute.js");
    const r = await ai.chatCompleteMessages(
      [
        { role: "system", content: "You are a tutor." },
        { role: "user", content: "What is Web3?" },
      ],
      { maxRetries: 0 }
    );

    expect(r.mock).toBe(true);
    expect(r.provider).toBe("mock");
    expect(r.degradedReason).toBe("openai_quota");
    expect(r.text).toContain("billing or usage limit");
    expect(r.text).toContain("What is Web3?");
  });

  it("does not retry billing quota 429", () => {
    const ai = require("../services/aiExecute.js");
    expect(
      ai.shouldRetryOpenAIError(
        429,
        "You exceeded your current quota, please check your plan and billing details."
      )
    ).toBe(false);
    expect(ai.shouldRetryOpenAIError(429, "Rate limit reached for requests")).toBe(true);
  });

  it("still throws when CCWEB_REQUIRE_OPENAI=1", async () => {
    process.env.CCWEB_REQUIRE_OPENAI = "1";
    delete require.cache[require.resolve("../services/aiExecute.js")];

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 429,
        text: async () =>
          JSON.stringify({ error: { message: "You exceeded your current quota" } }),
      }))
    );

    const ai = require("../services/aiExecute.js");
    await expect(
      ai.chatCompleteMessages([{ role: "user", content: "hi" }], { maxRetries: 0 })
    ).rejects.toBeTruthy();
  });
});
