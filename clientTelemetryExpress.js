/**
 * Client-reported errors and lightweight operational signals (rate-limited).
 */

const express = require("express");
const { logger } = require("./logging/logger");

function createClientTelemetryRouter() {
  const router = express.Router();
  router.use(express.json({ limit: "24kb" }));

  router.post("/client-error", (req, res) => {
    const message = String(req.body?.message || "").trim().slice(0, 2000);
    const stack = String(req.body?.stack || "").trim().slice(0, 12000);
    const route = String(req.body?.route || "").trim().slice(0, 400);
    const digest = String(req.body?.digest || "").trim().slice(0, 128);
    const userAgent = String(req.headers["user-agent"] || "").slice(0, 400);
    const build = String(req.body?.build || "").trim().slice(0, 80);
    if (!message && !stack) {
      return res.status(400).json({ error: "message or stack required." });
    }
    logger.warn({
      msg: "client_error",
      message: message || "(no message)",
      stackPreview: stack.slice(0, 800),
      route,
      digest,
      userAgent,
      build,
    });
    res.json({ ok: true });
  });

  return router;
}

module.exports = { createClientTelemetryRouter };
