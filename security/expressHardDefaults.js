/**
 * Shared Express security defaults: Helmet, CORS (allowlist), trust proxy.
 * Use on every Express sub-app that faces browsers or untrusted clients.
 */

const helmet = require("helmet");
const cors = require("cors");

function parseAllowedOrigins() {
  const raw = (process.env.CCWEB_ALLOWED_ORIGINS || "").trim();
  if (raw === "*" || /^\*(\s*,\s*\*)*$/.test(raw)) {
    return { mode: "all" };
  }
  if (raw) {
    return { mode: "list", origins: raw.split(",").map((s) => s.trim()).filter(Boolean) };
  }
  if (process.env.NODE_ENV === "production") {
    return { mode: "list", origins: [] };
  }
  return {
    mode: "list",
    origins: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
  };
}

/**
 * @param {import('express').Express} app
 */
function applyExpressSecurity(app) {
  if (process.env.TRUST_PROXY === "1") {
    app.set("trust proxy", 1);
  }

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  const parsed = parseAllowedOrigins();
  const allowAll = parsed.mode === "all";
  const allowed = parsed.mode === "list" ? parsed.origins : [];

  app.use(
    cors({
      origin: allowAll
        ? true
        : (origin, cb) => {
            if (!origin) return cb(null, true);
            if (allowed.includes(origin)) return cb(null, true);
            return cb(null, false);
          },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "CCWEB-API-Key",
        "Cookie",
        "Accept",
        "Origin",
        "X-Requested-With",
      ],
    })
  );
}

module.exports = { applyExpressSecurity, parseAllowedOrigins };
