import { describe, expect, it } from "vitest";
import { getHealthPayload, getBuildId } from "../server/http/controllers/health.controller.js";

describe("health.controller", () => {
  it("getHealthPayload includes production audit fields", () => {
    const payload = getHealthPayload();
    expect(payload.status).toBe("ok");
    expect(payload.service).toBe("ccweb-api");
    expect(typeof payload.version).toBe("string");
    expect(typeof payload.uptimeSec).toBe("number");
    expect(["configured", "none"]).toContain(payload.postgres);
    expect(payload.timestamp).toMatch(/^\d{4}-/);
  });

  it("getBuildId returns null or string", () => {
    const id = getBuildId();
    expect(id === null || typeof id === "string").toBe(true);
  });
});
