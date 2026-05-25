/**
 * Shared Express security defaults: Helmet, CORS (allowlist), trust proxy.
 * Use on every Express sub-app that faces browsers or untrusted clients.
 */

const helmet = require("helmet");
const cors = require("cors");
const vary = require("vary");
const { logger } = require("../logging/logger");
const { trimOrigin } = require("../services/deploymentOrigins");

/** Normalize allowlist entries so `https://spa.vercel.app/` matches browser `Origin: https://spa.vercel.app`. */
function normalizeOriginEntry(entry) {
  const s = String(entry || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) {
    try {
      return new URL(s).origin;
    } catch {
      return trimOrigin(s);
    }
  }
  return trimOrigin(s);
}

function parseAllowedOrigins() {
  const raw = (process.env.CCWEB_ALLOWED_ORIGINS || "").trim();
  if (raw === "*" || /^\*(\s*,\s*\*)*$/.test(raw)) {
    return { mode: "all" };
  }
  if (raw) {
    const origins = raw.split(",").map((s) => normalizeOriginEntry(s)).filter(Boolean);
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
  const normalized = origins.map((o) => normalizeOriginEntry(o)).filter(Boolean);
  const pub = publicAppOriginOrNull();
  if (!pub) return normalized;
  if (normalized.includes(pub)) return normalized;
  return [...normalized, pub];
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
    "Content-Type, Authorization, Cookie, Accept, Origin, X-Requested-With, X-CCWEB-Admin, CCWEB-API-Key";
  const maxAge = opts.maxAgeSec ?? 7200;
  const origin = String(req.headers.origin || "").trim();
  const parsed = parseAllowedOrigins();
  const path = String(req.url || "").split("?")[0];
  const allowedList = parsed.mode === "list" ? parsed.origins : [];

  function logCorsSetRawTrace() {
    if (process.env.CCWEB_AUTH_TRACE !== "1") return;
    const onList = parsed.mode === "list" && Boolean(origin && allowedList.includes(origin));
    logger.info({
      msg: "cors_set_raw",
      path,
      method: req.method,
      requestOrigin: origin || null,
      corsMode: parsed.mode,
      originOnAllowlist: parsed.mode === "all" ? null : Boolean(onList),
      accessControlAllowOrigin: res.getHeader("Access-Control-Allow-Origin") || null,
      accessControlAllowCredentials: res.getHeader("Access-Control-Allow-Credentials") || null,
    });
  }

  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader("Access-Control-Allow-Headers", headers);
  res.setHeader("Access-Control-Max-Age", String(maxAge));

  if (parsed.mode === "all") {
    if (origin) {
      vary(res, "Origin");
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    logCorsSetRawTrace();
    return;
  }

  if (origin && allowedList.includes(origin)) {
    vary(res, "Origin");
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    logCorsSetRawTrace();
    return;
  }
  if (origin && !allowedList.includes(origin)) {
    logger.warn({
      msg: "cors_origin_rejected",
      origin,
      path,
      method: req.method,
      allowlistSize: allowedList.length,
    });
  }
  if (!origin) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  logCorsSetRawTrace();
}

/**
 * @param {import("http").IncomingMessage} req
 * @param {import("http").ServerResponse} res
 * @param {{ methods?: string; headers?: string }} [opts]
 */
function writeRawOptions(req, res, opts = {}) {
  const traceCors =
    process.env.CCWEB_AUTH_TRACE === "1" || process.env.CCWEB_DIAGNOSTIC_ROUTES === "1";
  const path = String(req.url || "").split("?")[0];
  if (traceCors) {
    logger.info({
      msg: "http_options",
      path,
      origin: req.headers.origin || null,
      acrh: req.headers["access-control-request-headers"] || null,
      acrm: req.headers["access-control-request-method"] || null,
    });
  }
  setRawCorsHeaders(req, res, opts);
  if (traceCors) {
    logger.info({
      msg: "cors_preflight_result",
      path,
      origin: req.headers.origin || null,
      accessControlAllowOrigin: res.getHeader("Access-Control-Allow-Origin") || null,
      accessControlAllowCredentials: res.getHeader("Access-Control-Allow-Credentials") || null,
      vary: res.getHeader("Vary") || null,
    });
  }
  res.writeHead(204);
  res.end();
}

/**
 * @param {import('express').Express} app
 */
function applyExpressSecurity(app) {
  const trustProxyExplicit = process.env.TRUST_PROXY === "1";
  const trustProxyRailway =
    process.env.TRUST_PROXY !== "0" && Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PUBLIC_DOMAIN);
  if (trustProxyExplicit || trustProxyRailway) {
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
            logger.warn({
              msg: "cors_origin_rejected",
              origin,
              layer: "express_cors_delegate",
              allowlistSize: allowed.length,
            });
            // `cors` treats `callback(null, false)` as "skip middleware" (no CORS headers) which breaks
            // OPTIONS preflight. Use an empty allowlist so the library ends the preflight without ACAO.
            return cb(null, []);
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
        "X-CCWEB-Admin",
      ],
      maxAge: 7200,
      optionsSuccessStatus: 204,
    })
  );
}

module.exports = {
  applyExpressSecurity,
  parseAllowedOrigins,
  normalizeOriginEntry,
  setRawCorsHeaders,
  writeRawOptions,
};
