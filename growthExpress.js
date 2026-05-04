/**
 * Business Growth Hub API — marketing agent workspace, marketplace, escrow (simulated).
 */

const express = require("express");
const { applyExpressSecurity } = require("./security/expressHardDefaults");
const hub = require("./businessGrowthHub");

function createGrowthApp() {
  const app = express();
  applyExpressSecurity(app);
  app.use(express.json({ limit: "512kb" }));

  app.get("/overview", (req, res) => {
    res.json(hub.overview());
  });

  app.get("/listings", (req, res) => {
    hub.seedIfEmpty();
    const industry = (req.query.industry || "").toString();
    let list = [...hub.listings.values()];
    if (industry) list = list.filter((l) => l.industry === industry);
    res.json({ count: list.length, listings: list });
  });

  app.post("/listings", (req, res) => {
    const row = hub.createListing(req.body || {});
    res.status(201).json(row);
  });

  app.get("/listings/:id", (req, res) => {
    hub.seedIfEmpty();
    const row = hub.listings.get(req.params.id);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  });

  app.post("/orders", (req, res) => {
    const out = hub.createOrder(req.body || {});
    if (out.error) return res.status(400).json(out);
    res.status(201).json(out);
  });

  app.post("/orders/:id/deliver", (req, res) => {
    const out = hub.markDelivered(req.params.id);
    if (out.error) return res.status(400).json(out);
    res.json(out);
  });

  app.post("/orders/:id/confirm", (req, res) => {
    const out = hub.confirmOrder(req.params.id);
    if (out.error) return res.status(400).json(out);
    res.json(out);
  });

  app.get("/orders", (req, res) => {
    hub.seedIfEmpty();
    const seller = (req.query.sellerId || "").toString();
    let list = [...hub.orders.values()];
    if (seller) list = list.filter((o) => o.sellerId === seller);
    res.json({ count: list.length, orders: list });
  });

  app.get("/leads", (req, res) => {
    hub.seedIfEmpty();
    const businessId = (req.query.businessId || "").toString();
    let list = [...hub.leads.values()];
    if (businessId) list = list.filter((l) => l.businessId === businessId);
    res.json({ count: list.length, leads: list });
  });

  app.post("/leads", (req, res) => {
    const row = hub.createLead(req.body || {});
    res.status(201).json({ ...row, leadFeeUsd: hub.LEAD_FEE_USD, note: "Pay-per-qualified lead: settle in production via payment provider." });
  });

  app.post("/leads/:id/convert", (req, res) => {
    const out = hub.convertLead(req.params.id);
    if (out.error) return res.status(404).json(out);
    res.json(out);
  });

  app.get("/campaigns", (req, res) => {
    res.json({ campaigns: [...hub.campaigns.values()] });
  });

  app.post("/campaigns", (req, res) => {
    const row = hub.createCampaign(req.body || {});
    res.status(201).json(row);
  });

  app.get("/campaigns/:id/suggestions", (req, res) => {
    const c = hub.campaigns.get(req.params.id);
    if (!c) return res.status(404).json({ error: "Campaign not found" });
    res.json({ campaignId: c.id, ...hub.suggestionsForCampaign(c) });
  });

  app.use((req, res) => {
    res.status(404).json({ error: "Growth hub route not found", path: req.originalUrl || req.url });
  });

  return app;
}

module.exports = { createGrowthApp };
