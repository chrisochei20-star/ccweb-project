import { createRequire } from "module";
import { afterEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

function freshFlutterwaveConfig() {
  const p = require.resolve("../payments/flutterwaveConfig.js");
  delete require.cache[p];
  return require("../payments/flutterwaveConfig.js");
}

describe("flutterwaveConfig", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it("flutterwaveCheckoutOperational reflects FLUTTERWAVE_SECRET_KEY", () => {
    delete process.env.FLUTTERWAVE_SECRET_KEY;
    let cfg = freshFlutterwaveConfig();
    expect(cfg.flutterwaveCheckoutOperational()).toBe(false);
    process.env.FLUTTERWAVE_SECRET_KEY = "FLWSECK_TEST_1";
    cfg = freshFlutterwaveConfig();
    expect(cfg.flutterwaveCheckoutOperational()).toBe(true);
  });
});
