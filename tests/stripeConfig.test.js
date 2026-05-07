import { describe, it, expect, beforeEach } from "vitest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

function freshStripeConfig() {
  const p = require.resolve("../payments/stripeConfig.js");
  delete require.cache[p];
  return require("../payments/stripeConfig.js");
}

describe("stripeConfig", () => {
  beforeEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const p = require.resolve("../payments/stripeConfig.js");
    delete require.cache[p];
  });

  it("stripeCheckoutOperational reflects STRIPE_SECRET_KEY", () => {
    let cfg = freshStripeConfig();
    expect(cfg.stripeCheckoutOperational()).toBe(false);
    process.env.STRIPE_SECRET_KEY = "sk_test_1";
    cfg = freshStripeConfig();
    expect(cfg.stripeCheckoutOperational()).toBe(true);
  });

  it("stripeWebhookOperational requires both secrets", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_1";
    let cfg = freshStripeConfig();
    expect(cfg.stripeWebhookOperational()).toBe(false);
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_x";
    cfg = freshStripeConfig();
    expect(cfg.stripeWebhookOperational()).toBe(true);
  });
});
