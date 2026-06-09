import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

describe("tutor stream degraded fallback", () => {
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

  it("isStreamDegradableError includes AI_ABORTED and quota", () => {
    const ai = require("../services/aiExecute.js");
    expect(ai.isStreamDegradableError({ code: "AI_ABORTED" })).toBe(true);
    expect(ai.isStreamDegradableError({ code: "AI_TIMEOUT" })).toBe(true);
    expect(
      ai.isStreamDegradableError({
        status: 429,
        message: "You exceeded your current quota",
      })
    ).toBe(true);
    expect(ai.isStreamDegradableError({ code: "AI_NOT_CONFIGURED" })).toBe(false);
  });

  it("streamChatCompleteMessages yields mock text on AI_ABORTED instead of throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw Object.assign(new Error("OpenAI request cancelled."), {
          code: "AI_ABORTED",
          status: 504,
        });
      })
    );

    const ai = require("../services/aiExecute.js");
    const ctrl = new AbortController();
    ctrl.abort();

    const chunks = [];
    for await (const c of ai.streamChatCompleteMessages(
      [
        { role: "system", content: "tutor" },
        { role: "user", content: "What is Web3?" },
      ],
      { signal: ctrl.signal, maxRetries: 0 }
    )) {
      chunks.push(c);
    }

    const full = chunks.join("");
    expect(full).toContain("billing or usage limit");
    expect(full).toContain("What is Web3?");
    expect(/exceeded your current quota/i.test(full)).toBe(false);
  });
});
