import { describe, expect, it } from "vitest";
import { registerUser, loginUser } from "../authService.js";

function buildUserProfile(input, existing = null) {
  const now = new Date().toISOString();
  const id = (input.userId || "u1").toString();
  return {
    id,
    email: input.email || null,
    displayName: input.displayName || "Test",
    roles: ["member"],
    pushEnabled: true,
    isOrganic: true,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
}

describe("authService", () => {
  const users = new Map();

  it("registers and logs in", () => {
    const reg = registerUser(users, buildUserProfile, {
      email: "a@b.com",
      password: "password1",
      displayName: "Alice",
    });
    expect(reg.error).toBeUndefined();
    expect(users.get(reg.user.id)).toBeTruthy();

    const bad = loginUser(users, { email: "a@b.com", password: "wrong" });
    expect(bad.error).toBeTruthy();

    const ok = loginUser(users, { email: "a@b.com", password: "password1" });
    expect(ok.token).toBeTruthy();
    expect(ok.userId).toBe(reg.user.id);
  });
});
