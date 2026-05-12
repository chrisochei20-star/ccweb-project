/**
 * Health payloads for load balancers (Render, K8s) — raw HTTP + optional Express use.
 */

const { setRawCorsHeaders } = require("../../../security/expressHardDefaults");

function getHealthPayload() {
  return {
    status: "ok",
    message: "CCWEB API is running",
    service: "ccweb-api",
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

module.exports = { getHealthPayload, sendRawHealth };
