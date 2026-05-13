/**
 * Central Stripe configuration checks — payments can be disabled for beta/testing
 * without blocking server startup (see productionGate.js).
 */

function trimEnv(name) {
  return (process.env[name] || "").trim();
}

function stripeSecretKeyConfigured() {
  return Boolean(trimEnv("STRIPE_SECRET_KEY"));
}

function stripeWebhookSecretConfigured() {
  return Boolean(trimEnv("STRIPE_WEBHOOK_SECRET"));
}

/** Secret key + webhook signing secret — required for verified webhook processing. */
function stripeWebhookOperational() {
  return stripeSecretKeyConfigured() && stripeWebhookSecretConfigured();
}

/** Creating Checkout Sessions requires the Stripe secret key only. */
function stripeCheckoutOperational() {
  return stripeSecretKeyConfigured();
}

/**
 * Log once in production when Stripe is not fully configured (beta/testing).
 */
function logStripeStartupWarningIfNeeded() {
  if (process.env.NODE_ENV !== "production") return;
  if (stripeSecretKeyConfigured() && stripeWebhookSecretConfigured()) return;
  console.warn("[ccweb] Stripe disabled — running in beta/testing mode");
}

const stripeDisabledPayload = {
  error: "Stripe payments are disabled. Configure STRIPE_SECRET_KEY (and STRIPE_WEBHOOK_SECRET for webhooks).",
  code: "stripe_disabled",
  paymentsEnabled: false,
};

module.exports = {
  stripeSecretKeyConfigured,
  stripeWebhookSecretConfigured,
  stripeWebhookOperational,
  stripeCheckoutOperational,
  logStripeStartupWarningIfNeeded,
  stripeDisabledPayload,
};
