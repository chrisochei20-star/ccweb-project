import { describe, it, expect } from "vitest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

describe("isRateLimitExemptPath", () => {
  it("exempts Flutterwave webhook", () => {
    const { isRateLimitExemptPath } = require("../security/apiRateLimit.js");
    expect(isRateLimitExemptPath("/api/v1/payments/flutterwave/webhook")).toBe(true);
    expect(isRateLimitExemptPath("/api/v1/notifications/summary")).toBe(false);
  });
});

describe("optimizeCloudinaryUrl", () => {
  it("adds f_auto and q_auto transforms", async () => {
    const { optimizeCloudinaryUrl } = await import("../src/lib/cloudinaryUrl.js");
    const url = "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg";
    const out = optimizeCloudinaryUrl(url, { width: 256 });
    expect(out).toContain("f_auto");
    expect(out).toContain("q_auto");
    expect(out).toContain("w_256");
  });

  it("returns non-cloudinary URLs unchanged", async () => {
    const { optimizeCloudinaryUrl } = await import("../src/lib/cloudinaryUrl.js");
    expect(optimizeCloudinaryUrl("/uploads/x.png")).toBe("/uploads/x.png");
  });
});

describe("parseApiResponse", () => {
  it("throws structured error on non-ok response", async () => {
    const { parseApiResponse } = await import("../src/lib/parseApiResponse.js");
    const res = new Response(JSON.stringify({ error: "Nope", code: "X" }), { status: 503 });
    await expect(parseApiResponse(res)).rejects.toMatchObject({ message: "Nope", status: 503, code: "X" });
  });
});

describe("developerApiKeyHeaders", () => {
  it("uses CCWEB-API-Key header name", async () => {
    const { developerApiKeyHeaders } = await import("../src/lib/developerApiHeaders.js");
    expect(developerApiKeyHeaders("abc")).toEqual({ "CCWEB-API-Key": "abc" });
    expect(developerApiKeyHeaders("")).toEqual({});
  });
});
