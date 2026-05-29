import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyWebhookSignature } from "../payments/flutterwaveWebhook.js";

describe("flutterwaveWebhook", () => {
  it("validates verif-hash with FLUTTERWAVE_WEBHOOK_SECRET", () => {
    const secret = "test_webhook_secret_hash";
    const body = JSON.stringify({ event: "charge.completed", data: { tx_ref: "ccweb_test_1" } });
    const hash = crypto.createHmac("sha256", secret).update(body).digest("hex");
    const prev = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
    process.env.FLUTTERWAVE_WEBHOOK_SECRET = secret;
    try {
      const ok = verifyWebhookSignature(Buffer.from(body), hash);
      expect(ok.ok).toBe(true);
      const bad = verifyWebhookSignature(Buffer.from(body), "deadbeef");
      expect(bad.ok).toBe(false);
    } finally {
      if (prev === undefined) delete process.env.FLUTTERWAVE_WEBHOOK_SECRET;
      else process.env.FLUTTERWAVE_WEBHOOK_SECRET = prev;
    }
  });
});
