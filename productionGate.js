/**
 * Fail fast in production when critical secrets are missing.
 */

function validateOrExit() {
  if (process.env.NODE_ENV !== "production") return;
  const errs = [];
  if (!(process.env.DATABASE_URL || "").trim()) errs.push("DATABASE_URL");
  const pub = (process.env.PUBLIC_APP_URL || "").trim().replace(/\/$/, "");
  if (!pub) errs.push("PUBLIC_APP_URL (https SPA origin, no trailing slash)");
  else if (!/^https:\/\//i.test(pub)) errs.push("PUBLIC_APP_URL must use https:// in production");
  if (!(process.env.CCWEB_ALLOWED_ORIGINS || "").trim()) {
    errs.push("CCWEB_ALLOWED_ORIGINS (comma-separated https origins for browser CORS)");
  }
  if (!(process.env.AUTH_JWT_SECRET || "").trim() || process.env.AUTH_JWT_SECRET.length < 32) {
    errs.push("AUTH_JWT_SECRET (min 32 characters)");
  }
  if (!(process.env.STRIPE_SECRET_KEY || "").trim()) errs.push("STRIPE_SECRET_KEY");
  if (!(process.env.STRIPE_WEBHOOK_SECRET || "").trim()) errs.push("STRIPE_WEBHOOK_SECRET");
  const ai = (process.env.OPENAI_API_KEY || process.env.CCWEB_OPENAI_API_KEY || "").trim();
  if (!ai) errs.push("OPENAI_API_KEY (or CCWEB_OPENAI_API_KEY)");
  if (!(process.env.ETHERSCAN_API_KEY || "").trim()) errs.push("ETHERSCAN_API_KEY");

  if (errs.length) {
    console.error(
      `[ccweb] Production startup blocked — set environment variables: ${errs.join(", ")}`
    );
    process.exit(1);
  }
}

module.exports = { validateOrExit };
