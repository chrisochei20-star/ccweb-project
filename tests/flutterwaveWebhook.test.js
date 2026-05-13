import { describe, it, expect, afterEach } from "vitest";
import { verifyWebhookSignature } from "../services/flutterwaveClient";

describe("flutterwaveClient", () => {
  const prev = process.env.FLUTTERWAVE_SECRET_HASH;

  afterEach(() => {
    process.env.FLUTTERWAVE_SECRET_HASH = prev;
  });

  it("accepts matching verif-hash", () => {
    process.env.FLUTTERWAVE_SECRET_HASH = "testhash";
    expect(verifyWebhookSignature({ "verif-hash": "testhash" }).ok).toBe(true);
  });

  it("rejects wrong verif-hash", () => {
    process.env.FLUTTERWAVE_SECRET_HASH = "testhash";
    expect(verifyWebhookSignature({ "verif-hash": "other" }).ok).toBe(false);
  });

  it("rejects when secret hash missing", () => {
    delete process.env.FLUTTERWAVE_SECRET_HASH;
    expect(verifyWebhookSignature({ "verif-hash": "x" }).ok).toBe(false);
  });
});
