import { describe, expect, it } from "vitest";
import { CCWEB_AUTH_HYDRATION_TIMEOUT_MS, CCWEB_UI_LOAD_TIMEOUT_MS } from "../src/constants/loadTimeout.js";

describe("auth hydration timeouts", () => {
  it("UI gate timeout matches network hydration bound", () => {
    expect(CCWEB_UI_LOAD_TIMEOUT_MS).toBe(CCWEB_AUTH_HYDRATION_TIMEOUT_MS);
  });

  it("allows enough time for split-deploy /me on mobile", () => {
    expect(CCWEB_AUTH_HYDRATION_TIMEOUT_MS).toBeGreaterThanOrEqual(12000);
  });
});
