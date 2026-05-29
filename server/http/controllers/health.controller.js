/**
 * Health payloads for load balancers (Render, Railway, K8s) — raw HTTP + optional Express use.
 */

const { setRawCorsHeaders } = require("../../../security/expressHardDefaults");
const { getPool } = require("../../../db/pool");

const PKG_VERSION = (() => {
  try {
    return require("../../../package.json").version || "0.0.0";
  } catch {
    return "0.0.0";
  }
})();

function getBuildId() {
  return (
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.CCWEB_BUILD_ID ||
    null
  );
}

function getHealthPayload() {
  const pool = getPool();
  return {
    status: "ok",
    message: "CCWEB API is running",
    service: "ccweb-api",
    version: PKG_VERSION,
    buildId: getBuildId(),
    uptimeSec: Math.floor(process.uptime()),
    postgres: pool ? "configured" : "none",
    timestamp: new Date().toISOString(),
  };
}

/**
 * For Node http.Server handlers (server.js) — no Express.
 * @param {import("http").IncomingMessage} [req] — when set, applies production CORS for browser probes from the SPA host.
 */
function sendRawHealth(res, req) {
  if (req) {
    setRawCorsHeaders(req, res, {
      methods: "GET, OPTIONS",
      headers: "Accept, Content-Type, Authorization, Cookie",
    });
  }
  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(getHealthPayload()));
}

module.exports = { getHealthPayload, sendRawHealth, getBuildId };
