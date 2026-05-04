import { describe, expect, it } from "vitest";
import { registerUser, loginPasswordStep, walletNonce, walletVerify } from "../auth/authEngine.js";

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

describe("authEngine", () => {
  const users = new Map();

  it("registers then bcrypt login works", async () => {
    const email = `bc${Date.now()}@b.com`;
    const reg = await registerUser(users, buildUserProfile, {
      email,
      password: "password1x",
      displayName: "Bob",
    });
    expect(reg.error).toBeUndefined();
    expect(reg.user).toBeTruthy();
    const login = await loginPasswordStep(users, { email, password: "password1x", ip: "127.0.0.1" });
    expect(login.accessToken).toBeTruthy();
  });

  it("login issues JWT access token", async () => {
    const email = `jwt${Date.now()}@b.com`;
    await registerUser(users, buildUserProfile, { email, password: "longpass12", displayName: "J" });
    const out = await loginPasswordStep(users, { email, password: "longpass12", ip: "127.0.0.1" });
    expect(out.needsTwoFactor).toBeFalsy();
    expect(out.accessToken).toBeTruthy();
    expect(out.refreshToken).toBeTruthy();
    expect(out.user.id).toBeTruthy();
  });

  it("wallet nonce and EVM verify roundtrip (memory store)", async () => {
    const { ethers } = await import("ethers");
    const wallet = ethers.Wallet.createRandom();
    const n = await walletNonce({ address: wallet.address, chainType: "evm" });
    expect(n.message).toBeTruthy();
    const sig = await wallet.signMessage(n.message);
    const users2 = new Map();
    const v = await walletVerify(users2, buildUserProfile, {
      address: wallet.address,
      message: n.message,
      signature: sig,
      chainType: "evm",
    });
    expect(v.accessToken).toBeTruthy();
    expect(v.user).toBeTruthy();
  });
});
