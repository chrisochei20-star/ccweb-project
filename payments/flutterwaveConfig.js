/**
 * Flutterwave server configuration — escrow + learning checkout verify via FLUTTERWAVE_SECRET_KEY.
 */

function trimEnv(name) {
  return String(process.env[name] || "").trim();
}

function flutterwaveSecretConfigured() {
  return Boolean(trimEnv("FLUTTERWAVE_SECRET_KEY"));
}

function flutterwaveCheckoutOperational() {
  return flutterwaveSecretConfigured();
}

const flutterwaveDisabledPayload = {
  error: "Flutterwave payments are disabled. Configure FLUTTERWAVE_SECRET_KEY on the API.",
  code: "flutterwave_disabled",
};

function logFlutterwaveStartupWarningIfNeeded() {
  if (process.env.NODE_ENV !== "production") return;
  if (flutterwaveSecretConfigured()) return;
  console.warn("[ccweb] Flutterwave disabled — escrow / learning card checkout returns 503 until FLUTTERWAVE_SECRET_KEY is set");
}

module.exports = {
  flutterwaveSecretConfigured,
  flutterwaveCheckoutOperational,
  flutterwaveDisabledPayload,
  logFlutterwaveStartupWarningIfNeeded,
};
