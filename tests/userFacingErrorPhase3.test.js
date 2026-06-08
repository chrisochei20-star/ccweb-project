import { describe, expect, it } from "vitest";
import { formatUserFacingError, sanitizeUserMessage } from "../src/lib/userFacingError.js";

describe("userFacingError phase3", () => {
  it("maps TDZ/minified init errors to fallback", () => {
    expect(
      formatUserFacingError(new Error("Cannot access 'o' before initialization"))
    ).toBe("Something went wrong. Please try again.");
  });

  it("strips PostgreSQL and Render wording", () => {
    expect(formatUserFacingError(new Error("PostgreSQL required for chat"))).toMatch(/temporarily unavailable/i);
    expect(sanitizeUserMessage("Syncs to Render API", "Unavailable")).toBe("Unavailable");
  });

  it("sanitizeUserMessage maps failed to fetch", () => {
    expect(sanitizeUserMessage("Failed to fetch", "Try again")).toBe("Try again");
  });
});
