/**
 * Fail fast in production when critical secrets are missing.
 * Stripe is optional: beta/testing deployments can omit STRIPE_* ; payment routes return 503 until configured.
 * OpenAI / Etherscan are optional: AI uses mock output; chain features degrade until keys are set.
 */

const { logger } = require("./logging/logger");
const { logStripeStartupWarningIfNeeded } = require("./payments/stripeConfig");

function validateOrExit() {
  if (process.env.NODE_ENV !== "production") return;
  logStripeStartupWarningIfNeeded();
  const errs = [];
  if (!(process.env.DATABASE_URL || "").trim()) errs.push("DATABASE_URL");
  const pub = (process.env.PUBLIC_APP_URL || "").trim().replace(/\/$/, "");
  if (!pub) errs.push("PUBLIC_APP_URL (https SPA origin, no trailing slash)");
  else if (!/^https:\/\//i.test(pub)) errs.push("PUBLIC_APP_URL must use https:// in production");
  if (!(process.env.CCWEB_ALLOWED_ORIGINS || "").trim()) {
    errs.push("CCWEB_ALLOWED_ORIGINS (comma-separated https origins, or * for open-beta CORS)");
  }
  if (!(process.env.AUTH_JWT_SECRET || "").trim() || process.env.AUTH_JWT_SECRET.length < 32) {
    errs.push("AUTH_JWT_SECRET (min 32 characters)");
  }

  const ai = (process.env.OPENAI_API_KEY || process.env.CCWEB_OPENAI_API_KEY || "").trim();
  if (!ai) {
    logger.warn({
      msg: "openai_key_missing",
      detail: "AI agents/workflows use mock completions until OPENAI_API_KEY is set (or CCWEB_REQUIRE_OPENAI=1 to hard-fail).",
    });
  }
  if (!(process.env.ETHERSCAN_API_KEY || "").trim()) {
    logger.warn({
      msg: "etherscan_key_missing",
      detail: "EVM wallet scans use DexScreener-only degradation until ETHERSCAN_API_KEY is set.",
    });
  }

  if (errs.length) {
    console.error(
      `[ccweb] Production startup blocked — set environment variables: ${errs.join(", ")}`
    );
    process.exit(1);
  }
}

module.exports = { validateOrExit };
