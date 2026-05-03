/**
 * Express sub-app for Early Signals & intelligence APIs (mounted at /api/intelligence).
 */

const express = require("express");
const earlySignalsEngine = require("./earlySignalsEngine");
const intelligenceDb = require("./intelligenceDb");

function normalizeAddress(addr) {
  const a = String(addr || "").trim().toLowerCase();
  if (!a.startsWith("0x") || a.length !== 42) return null;
  return a;
}

function createIntelligenceRouter() {
  const router = express.Router();

  router.get("/dashboard", async (req, res) => {
    try {
      const tracked = await intelligenceDb.listTrackedWallets();
      const data = await earlySignalsEngine.buildDashboardPayload(tracked);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message || "Dashboard build failed" });
    }
  });

  router.get("/feed", async (req, res) => {
    try {
      const items = await earlySignalsEngine.buildFeedItems();
      res.json({
        items,
        updatedAt: new Date().toISOString(),
        disclaimer: earlySignalsEngine.DISCLAIMER,
      });
    } catch (err) {
      res.status(500).json({ error: err.message || "Feed failed" });
    }
  });

  router.get("/narratives", (req, res) => {
    res.json(earlySignalsEngine.buildNarrativeTrends());
  });

  router.get("/smart-money", async (req, res) => {
    try {
      const tracked = await intelligenceDb.listTrackedWallets();
      const data = await earlySignalsEngine.buildDashboardPayload(tracked);
      res.json(data.smartMoney);
    } catch (err) {
      res.status(500).json({ error: err.message || "Smart money failed" });
    }
  });

  router.get("/risk-alerts", async (req, res) => {
    try {
      const items = await earlySignalsEngine.buildFeedItems();
      const alerts = earlySignalsEngine.buildRiskAlerts(items);
      res.json({
        alerts,
        updatedAt: new Date().toISOString(),
        disclaimer: earlySignalsEngine.DISCLAIMER,
      });
    } catch (err) {
      res.status(500).json({ error: err.message || "Risk alerts failed" });
    }
  });

  router.get("/tracked-wallets", async (req, res) => {
    try {
      const list = await intelligenceDb.listTrackedWallets();
      res.json({
        wallets: list,
        mongoEnabled: !!process.env.MONGODB_URI,
        disclaimer: earlySignalsEngine.DISCLAIMER,
      });
    } catch (err) {
      res.status(500).json({ error: err.message || "List failed" });
    }
  });

  router.post("/tracked-wallets", express.json(), async (req, res) => {
    const address = normalizeAddress(req.body.address || req.body.wallet);
    if (!address) {
      res.status(400).json({ error: "Valid 0x-prefixed EVM address required." });
      return;
    }
    const label = (req.body.label || "").trim() || "Tracked wallet";
    const alertsEnabled = !!req.body.alertsEnabled;
    const result = await intelligenceDb.addTrackedWallet(address, label, alertsEnabled);
    res.json({
      ok: true,
      address,
      label,
      alertsEnabled,
      persistence: result,
      disclaimer: earlySignalsEngine.DISCLAIMER,
    });
  });

  router.delete("/tracked-wallets/:address", async (req, res) => {
    const address = normalizeAddress(req.params.address);
    if (!address) {
      res.status(400).json({ error: "Invalid address." });
      return;
    }
    await intelligenceDb.removeTrackedWallet(address);
    res.json({ ok: true, address });
  });

  return router;
}

function attachSse(router) {
  router.get("/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    if (res.flushHeaders) res.flushHeaders();

    let n = 0;
    const tick = async () => {
      try {
        const tracked = await intelligenceDb.listTrackedWallets();
        const payload = await earlySignalsEngine.buildDashboardPayload(tracked);
        n += 1;
        res.write(`event: snapshot\n`);
        res.write(`id: ${n}\n`);
        res.write(`data: ${JSON.stringify({ seq: n, updatedAt: payload.updatedAt, feedCount: payload.feed.items.length })}\n\n`);
      } catch (e) {
        res.write(`event: error\n`);
        res.write(`data: ${JSON.stringify({ message: e.message })}\n\n`);
      }
    };

    tick();
    const interval = setInterval(tick, 12000);
    req.on("close", () => {
      clearInterval(interval);
      try {
        res.end();
      } catch {
        /* ignore */
      }
    });
  });
}

function createIntelligenceApp() {
  const app = express();
  const router = createIntelligenceRouter();
  attachSse(router);
  app.use(router);
  app.use((req, res) => {
    res.status(404).json({ error: "Intelligence route not found.", path: req.url });
  });
  return app;
}

module.exports = { createIntelligenceApp, createIntelligenceRouter };
