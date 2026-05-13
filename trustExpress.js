/**
 * Trust & safety public API (authenticated reports).
 */

const express = require("express");
const trustPg = require("./db/persistenceTrust");
const flwPg = require("./db/persistenceFlutterwave");

function createTrustRouter({ authJwtMiddleware }) {
  const router = express.Router();

  router.use((req, res, next) => {
    if (!flwPg.usePostgres()) {
      return res.status(503).json({ error: "Trust reporting requires PostgreSQL.", code: "NO_DATABASE" });
    }
    next();
  });

  router.post("/report", authJwtMiddleware, async (req, res, next) => {
    try {
      const targetType = String(req.body?.targetType || "").toLowerCase();
      const targetId = String(req.body?.targetId || "").trim();
      const reasonCode = String(req.body?.reasonCode || "other").toLowerCase();
      const body = String(req.body?.details || req.body?.body || "").trim();
      const out = await trustPg.createReport({
        reporterUserId: req.ccwebUserId,
        targetType,
        targetId,
        reasonCode,
        body: body || "(no details)",
      });
      if (!out.ok) {
        const status = out.error === "target_not_found" ? 404 : 400;
        return res.status(status).json({ error: out.error || "Could not create report." });
      }
      res.status(201).json({ ok: true, reportId: out.id });
    } catch (e) {
      next(e);
    }
  });

  return router;
}

module.exports = { createTrustRouter };
