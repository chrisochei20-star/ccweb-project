import { describe, expect, it } from "vitest";
import { isNativePublicPath } from "../src/lib/nativeAuthPaths.js";

describe("isNativePublicPath", () => {
  it("allows auth and legal routes", () => {
    expect(isNativePublicPath("/login")).toBe(true);
    expect(isNativePublicPath("/signup")).toBe(true);
    expect(isNativePublicPath("/privacy")).toBe(true);
    expect(isNativePublicPath("/terms")).toBe(true);
  });

  it("allows invite and public profile prefixes", () => {
    expect(isNativePublicPath("/invite/abc123")).toBe(true);
    expect(isNativePublicPath("/u/creator-slug")).toBe(true);
  });

  it("blocks main app routes until signed in", () => {
    expect(isNativePublicPath("/")).toBe(false);
    expect(isNativePublicPath("/find")).toBe(false);
    expect(isNativePublicPath("/messages")).toBe(false);
    expect(isNativePublicPath("/notifications")).toBe(false);
    expect(isNativePublicPath("/community")).toBe(false);
  });
});
