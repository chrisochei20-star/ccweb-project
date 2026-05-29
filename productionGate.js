/**
 * Fail fast in production when critical secrets are missing.
 * Flutterwave is optional: beta/testing deployments can omit FLUTTERWAVE_SECRET_KEY ; card checkout returns 503 until configured.
 * OpenAI / Etherscan are optional: AI uses mock output; chain features degrade until keys are set.
 *
 * Optional: CCWEB_BOOT_WARN_ONLY=1 — warn instead of exit for PUBLIC_APP_URL / CCWEB_ALLOWED_ORIGINS
 * (first-time Render setup; set real values for strict production).
 * CCWEB_SKIP_PRODUCTION_GATE=1 — skip all env checks (emergency only).
 */

const { logger } = require("./logging/logger");
const { logFlutterwaveStartupWarningIfNeeded } = require("./payments/flutterwaveConfig");

function validateOrExit() {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.CCWEB_SKIP_PRODUCTION_GATE === "1") {
    logger.warn({
      msg: "production_gate_skipped",
      detail: "CCWEB_SKIP_PRODUCTION_GATE=1 — not recommended for public production.",
    });
    logFlutterwaveStartupWarningIfNeeded();
    return;
  }
  logFlutterwaveStartupWarningIfNeeded();
  const warnOnly = process.env.CCWEB_BOOT_WARN_ONLY === "1";
  const errs = [];
  const warns = [];

  if (!(process.env.DATABASE_URL || "").trim()) errs.push("DATABASE_URL");

  const pub = (process.env.PUBLIC_APP_URL || "").trim().replace(/\/$/, "");
  if (!pub) {
    if (warnOnly) warns.push("PUBLIC_APP_URL");
    else errs.push("PUBLIC_APP_URL (https SPA origin, no trailing slash)");
  } else if (!/^https:\/\//i.test(pub)) {
    errs.push("PUBLIC_APP_URL must use https:// in production");
  }

  if (!(process.env.CCWEB_ALLOWED_ORIGINS || "").trim()) {
    if (warnOnly) warns.push("CCWEB_ALLOWED_ORIGINS");
    else
      errs.push(
        "CCWEB_ALLOWED_ORIGINS (comma-separated https origins, or * for open-beta CORS). When set, PUBLIC_APP_URL is also merged into the allowlist automatically."
      );
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

  for (const w of warns) {
    logger.warn({
      msg: "startup_config_missing_warn_only",
      varName: w,
      detail: "Set this env var; CCWEB_BOOT_WARN_ONLY=1 allows boot without it.",
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
