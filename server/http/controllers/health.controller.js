/**
 * Health payloads for load balancers (Render, K8s) — raw HTTP + optional Express use.
 */

function getHealthPayload() {
  return {
    status: "ok",
    message: "CCWEB API is running",
    service: "ccweb-api",
    timestamp: new Date().toISOString(),
  };
}

/** For Node http.Server handlers (server.js) — no Express. */
function sendRawHealth(res) {
  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(getHealthPayload()));
}

module.exports = { getHealthPayload, sendRawHealth };
