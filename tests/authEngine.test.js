import { describe, expect, it } from "vitest";
import {
  registerUser,
  loginPasswordStep,
  walletNonce,
  walletVerify,
  refreshTokens,
  logoutAccessToken,
  getUserIdFromAccess,
} from "../auth/authEngine.js";

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

  it("rejects duplicate email on register", async () => {
    const email = `dup${Date.now()}@b.com`;
    const r1 = await registerUser(users, buildUserProfile, { email, password: "password1x", displayName: "A" });
    expect(r1.error).toBeUndefined();
    const r2 = await registerUser(users, buildUserProfile, { email, password: "password1x", displayName: "B" });
    expect(r2.error).toMatch(/already exists/i);
  });

  it("rejects wrong password", async () => {
    const email = `badpw${Date.now()}@b.com`;
    await registerUser(users, buildUserProfile, { email, password: "correctpass1", displayName: "C" });
    const login = await loginPasswordStep(users, { email, password: "wrongpassword", ip: "10.0.0.1" });
    expect(login.error).toMatch(/Invalid email or password/i);
    expect(login.accessToken).toBeFalsy();
  });

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

  it("refresh token rotates access; logout revokes refresh", async () => {
    const users = new Map();
    const email = `sess${Date.now()}@b.com`;
    const reg = await registerUser(users, buildUserProfile, { email, password: "sessionpass1", displayName: "S" });
    expect(reg.user?.id).toBeTruthy();
    const uid = reg.user.id;

    const login = await loginPasswordStep(users, { email, password: "sessionpass1", ip: "192.168.1.5" });
    expect(login.refreshToken).toBeTruthy();
    expect(getUserIdFromAccess(login.accessToken)).toBe(uid);

    const ref1 = await refreshTokens(users, login.refreshToken);
    expect(ref1.error).toBeUndefined();
    expect(ref1.accessToken).toBeTruthy();
    expect(ref1.refreshToken).toBeTruthy();

    await logoutAccessToken(ref1.accessToken, ref1.refreshToken);
    const ref2 = await refreshTokens(users, ref1.refreshToken);
    expect(ref2.error).toMatch(/Invalid|revoked/i);
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
