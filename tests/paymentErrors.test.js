import { describe, expect, it } from "vitest";
import { formatPaymentError, isFlutterwavePaymentSuccessful } from "../src/lib/paymentErrors.js";

describe("paymentErrors", () => {
  it("maps flutterwave_disabled to user-safe copy", () => {
    const msg = formatPaymentError({ response: { data: { code: "flutterwave_disabled", error: "x" } } });
    expect(msg).toMatch(/not enabled/i);
  });

  it("detects successful Flutterwave callback status", () => {
    expect(isFlutterwavePaymentSuccessful({ status: "successful" })).toBe(true);
    expect(isFlutterwavePaymentSuccessful({ status: "cancelled" })).toBe(false);
  });
});
