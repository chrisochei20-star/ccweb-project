import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

describe("aiExecute mock mode", () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.CCWEB_OPENAI_API_KEY;
    delete process.env.CCWEB_REQUIRE_OPENAI;
    delete require.cache[require.resolve("../services/aiExecute.js")];
  });

  afterEach(() => {
    delete process.env.CCWEB_REQUIRE_OPENAI;
    delete require.cache[require.resolve("../services/aiExecute.js")];
  });

  it("returns mock when no API key", async () => {
    const ai = require("../services/aiExecute.js");
    const r = await ai.chatComplete("system prompt", { hello: "world" });
    expect(r.provider).toBe("mock");
    expect(r.mock).toBe(true);
    expect(r.text).toContain("mock AI");
  });

  it("throws AI_NOT_CONFIGURED when CCWEB_REQUIRE_OPENAI=1", async () => {
    process.env.CCWEB_REQUIRE_OPENAI = "1";
    delete require.cache[require.resolve("../services/aiExecute.js")];
    const ai = require("../services/aiExecute.js");
    await expect(ai.chatComplete("s", "u")).rejects.toMatchObject({ code: "AI_NOT_CONFIGURED" });
  });
});
