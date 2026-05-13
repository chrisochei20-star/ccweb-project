import { describe, it, expect, beforeAll, afterAll } from "vitest";

describe("payoutFieldCrypto", () => {
  const key = "a".repeat(64);
  let mod;

  beforeAll(() => {
    process.env.CCWEB_PAYOUT_ENCRYPTION_KEY = key;
    mod = require("../services/payoutFieldCrypto");
  });

  afterAll(() => {
    delete process.env.CCWEB_PAYOUT_ENCRYPTION_KEY;
  });

  it("roundtrips JSON payloads", () => {
    const payload = { account_number: "0123456789", account_bank: "044", beneficiary_name: "Test User" };
    const enc = mod.encryptJson(payload);
    expect(enc).toBeTruthy();
    const dec = mod.decryptJson(enc);
    expect(dec).toEqual(payload);
  });

  it("derives bank hint", () => {
    expect(mod.bankHintFromPayload({ account_number: "0001234567890" })).toMatch(/7890$/);
  });
});
