/**
 * User-facing payment error messages (production-safe).
 * @param {Error & { response?: { data?: { error?: string; code?: string } } }} err
 */
export function formatPaymentError(err) {
  const code = err?.response?.data?.code || err?.code;
  const apiMsg = err?.response?.data?.error;
  const msg = String(apiMsg || err?.message || err || "");

  if (code === "flutterwave_disabled" || /flutterwave.*disabled|FLUTTERWAVE_SECRET_KEY/i.test(msg)) {
    return "Card checkout is not enabled on the server yet. Try again later or contact support.";
  }
  if (/NO_DATABASE|PostgreSQL required/i.test(msg)) {
    return "Payments are temporarily unavailable. Please try again later.";
  }
  if (err?.response?.status === 401 || /sign in required/i.test(msg)) {
    return "Sign in again, then retry checkout.";
  }
  if (err?.response?.status === 503) {
    return apiMsg || "Payments are temporarily unavailable. Try again shortly.";
  }
  if (/does not match|amount/i.test(msg)) {
    return "Payment amount mismatch — contact support with your receipt reference.";
  }
  if (/not successful|cancelled|canceled|closed/i.test(msg)) {
    return "Payment was not completed. You can try again.";
  }
  if (/verification failed|verify failed/i.test(msg)) {
    return "We could not confirm your payment yet. Tap retry or wait a minute and refresh.";
  }
  return msg.length < 220 ? msg : "Payment failed. Please try again.";
}

/** @param {unknown} response Flutterwave modal callback payload */
export function isFlutterwavePaymentSuccessful(response) {
  const status = String(response?.status || "").toLowerCase();
  return status === "successful" || status === "completed";
}
