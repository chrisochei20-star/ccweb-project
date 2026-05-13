/**
 * Shared Express security defaults: Helmet, CORS (allowlist), trust proxy.
 * Use on every Express sub-app that faces browsers or untrusted clients.
 */

const helmet = require("helmet");
const cors = require("cors");
const { trimOrigin } = require("../services/deploymentOrigins");

function parseAllowedOrigins() {
  const raw = (process.env.CCWEB_ALLOWED_ORIGINS || "").trim();
  if (raw === "*" || /^\*(\s*,\s*\*)*$/.test(raw)) {
    return { mode: "all" };
  }
  if (raw) {
    const origins = raw.split(",").map((s) => s.trim()).filter(Boolean);
    return { mode: "list", origins: mergePublicAppOrigin(origins) };
  }
  if (process.env.NODE_ENV === "production") {
    // Align with productionGate CCWEB_BOOT_WARN_ONLY=1 when origins unset (open dynamic CORS).
    if (process.env.CCWEB_BOOT_WARN_ONLY === "1") {
      return { mode: "all" };
    }
    const pub = publicAppOriginOrNull();
    return { mode: "list", origins: pub ? [pub] : [] };
  }
  return {
    mode: "list",
    origins: mergePublicAppOrigin([
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ]),
  };
}

/** @param {string[]} origins */
function mergePublicAppOrigin(origins) {
  const pub = publicAppOriginOrNull();
  if (!pub) return origins;
  if (origins.includes(pub)) return origins;
  return [...origins, pub];
}

function publicAppOriginOrNull() {
  const pub = trimOrigin(process.env.PUBLIC_APP_URL || "");
  if (!pub || !/^https:\/\//i.test(pub)) return null;
  try {
    return new URL(pub).origin;
  } catch {
    return null;
  }
}

/**
 * CORS headers for Node http.Server handlers (no Express cors middleware).
 * Mirrors Express `cors({ origin, credentials: true })` rules for preflight + simple responses.
 * @param {import("http").IncomingMessage} req
 * @param {import("http").ServerResponse} res
 * @param {{ methods?: string; headers?: string; maxAgeSec?: number }} [opts]
 */
function setRawCorsHeaders(req, res, opts = {}) {
  const methods = opts.methods || "GET, POST, PUT, PATCH, DELETE, OPTIONS";
  const headers =
    opts.headers ||
    "Content-Type, Authorization, Cookie, Accept, Origin, X-Requested-With, X-CCWEB-Admin, X-CCWEB-Admin-Label, CCWEB-API-Key";
  const maxAge = opts.maxAgeSec ?? 7200;
  const origin = String(req.headers.origin || "").trim();
  const parsed = parseAllowedOrigins();

  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader("Access-Control-Allow-Headers", headers);
  res.setHeader("Access-Control-Max-Age", String(maxAge));

  if (parsed.mode === "all") {
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    return;
  }

  const allowed = parsed.origins;
  if (origin && allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    return;
  }
  if (!origin) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
}

/**
 * @param {import("http").IncomingMessage} req
 * @param {import("http").ServerResponse} res
 * @param {{ methods?: string; headers?: string }} [opts]
 */
function writeRawOptions(req, res, opts = {}) {
  setRawCorsHeaders(req, res, opts);
  res.writeHead(204);
  res.end();
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

module.exports = {
  applyExpressSecurity,
  parseAllowedOrigins,
  setRawCorsHeaders,
  writeRawOptions,
};
