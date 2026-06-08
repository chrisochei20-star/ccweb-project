import { describe, expect, it } from "vitest";
import { formatUserFacingError } from "../src/lib/userFacingError.js";

describe("formatUserFacingError", () => {
  it("maps Failed to fetch to network message", () => {
    expect(formatUserFacingError(new Error("Failed to fetch"))).toMatch(/Network error/i);
  });

  it("strips env var names", () => {
    const msg = formatUserFacingError(new Error("Missing VITE_API_BASE_URL and DATABASE_URL"));
    expect(msg).not.toMatch(/VITE_/);
    expect(msg).not.toMatch(/DATABASE_URL/);
  });

  it("hides stack traces", () => {
    expect(formatUserFacingError(new Error("Error at foo (file.js:1:1)"))).toBe(
      "Something went wrong. Please try again."
    );
  });

  it("uses fallback for empty message", () => {
    expect(formatUserFacingError("", "Custom fallback")).toBe("Custom fallback");
  });
});
