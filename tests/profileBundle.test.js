import { describe, expect, it } from "vitest";
import { parseSocialLinks, isVerifiedUser, creatorFromUser } from "../services/profileBundle.js";

describe("profileBundle", () => {
  it("parseSocialLinks normalizes array entries", () => {
    const links = parseSocialLinks([
      { label: "X", url: "https://x.com/u" },
      { platform: "GitHub", url: "https://github.com/u" },
      { url: "" },
    ]);
    expect(links).toHaveLength(2);
    expect(links[0].label).toBe("X");
    expect(links[1].label).toBe("GitHub");
  });

  it("isVerifiedUser respects roles and verifiedAt", () => {
    expect(isVerifiedUser({ roles: ["member"] })).toBe(false);
    expect(isVerifiedUser({ roles: ["verified"] })).toBe(true);
    expect(isVerifiedUser({ roles: ["member"], verifiedAt: "2026-01-01T00:00:00.000Z" })).toBe(true);
  });

  it("creatorFromUser returns null for plain members", () => {
    expect(creatorFromUser({ roles: ["member"] }, "free")).toBeNull();
    expect(creatorFromUser({ roles: ["creator"] }, "free")?.badge).toBe("creator");
    expect(creatorFromUser({ roles: ["member"] }, "pro")?.tier).toBe("pro");
  });
});
