/**
 * Business Growth Hub API — PostgreSQL when DATABASE_URL is set; else in-memory hub.
 */

const express = require("express");
const { applyExpressSecurity } = require("./security/expressHardDefaults");
const hub = require("./businessGrowthHub");
const pg = require("./db/persistenceGrowth");

function usePg() {
  return pg.usePostgres();
}

function createGrowthApp() {
  const app = express();
  applyExpressSecurity(app);
  app.use(express.json({ limit: "512kb" }));

  app.get("/overview", async (req, res) => {
    try {
      const data = usePg() ? await pg.overview() : hub.overview();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  app.get("/listings", async (req, res) => {
    try {
      const industry = (req.query.industry || "").toString();
      const list = usePg() ? await pg.listListings(industry) : (hub.seedIfEmpty(), [...hub.listings.values()].filter((l) => !industry || l.industry === industry));
      res.json({ count: list.length, listings: list });
    } catch (e) {
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  app.post("/listings", async (req, res) => {
    try {
      const row = usePg() ? await pg.createListing(req.body || {}) : hub.createListing(req.body || {});
      res.status(201).json(row);
    } catch (e) {
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  app.get("/listings/:id", async (req, res) => {
    try {
      const row = usePg() ? await pg.getListing(req.params.id) : (hub.seedIfEmpty(), hub.listings.get(req.params.id));
      if (!row) return res.status(404).json({ error: "Not found" });
      res.json(row);
    } catch (e) {
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  app.post("/orders", async (req, res) => {
    try {
      const out = usePg() ? await pg.createOrder(req.body || {}) : hub.createOrder(req.body || {});
      if (out.error) return res.status(400).json(out);
      res.status(201).json(out);
    } catch (e) {
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  app.post("/orders/:id/deliver", async (req, res) => {
    try {
      const out = usePg() ? await pg.markDelivered(req.params.id) : hub.markDelivered(req.params.id);
      if (out.error) return res.status(400).json(out);
      res.json(out);
    } catch (e) {
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  app.post("/orders/:id/confirm", async (req, res) => {
    try {
      const out = usePg() ? await pg.confirmOrder(req.params.id) : hub.confirmOrder(req.params.id);
      if (out.error) return res.status(400).json(out);
      res.json(out);
    } catch (e) {
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  app.get("/orders", async (req, res) => {
    try {
      const seller = (req.query.sellerId || "").toString();
      const list = usePg() ? await pg.listOrders(seller) : (hub.seedIfEmpty(), [...hub.orders.values()].filter((o) => !seller || o.sellerId === seller));
      res.json({ count: list.length, orders: list });
    } catch (e) {
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  app.get("/leads", async (req, res) => {
    try {
      const businessId = (req.query.businessId || "").toString();
      const list = usePg() ? await pg.listLeads(businessId) : (hub.seedIfEmpty(), [...hub.leads.values()].filter((l) => !businessId || l.businessId === businessId));
      res.json({ count: list.length, leads: list });
    } catch (e) {
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  app.post("/leads", async (req, res) => {
    try {
      const row = usePg() ? await pg.createLead(req.body || {}) : hub.createLead(req.body || {});
      res.status(201).json({ ...row, leadFeeUsd: hub.LEAD_FEE_USD, note: "Pay-per-qualified lead: settle in production via payment provider." });
    } catch (e) {
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  app.post("/leads/:id/convert", async (req, res) => {
    try {
      const out = usePg() ? await pg.convertLead(req.params.id) : hub.convertLead(req.params.id);
      if (out.error) return res.status(404).json(out);
      res.json(out);
    } catch (e) {
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  app.get("/campaigns", async (req, res) => {
    try {
      if (usePg()) {
        const list = await pg.listCampaigns();
        res.json({ campaigns: list });
      } else {
        res.json({ campaigns: [...hub.campaigns.values()] });
      }
    } catch (e) {
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  app.post("/campaigns", async (req, res) => {
    try {
      const row = usePg() ? await pg.createCampaign(req.body || {}) : hub.createCampaign(req.body || {});
      res.status(201).json(row);
    } catch (e) {
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  app.get("/campaigns/:id/suggestions", async (req, res) => {
    try {
      let c = null;
      if (usePg()) c = await pg.getCampaign(req.params.id);
      else c = hub.campaigns.get(req.params.id);
      if (!c) return res.status(404).json({ error: "Campaign not found" });
      res.json({ campaignId: c.id, ...hub.suggestionsForCampaign(c) });
    } catch (e) {
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  app.use((req, res) => {
    res.status(404).json({ error: "Growth hub route not found", path: req.originalUrl || req.url });
  });

  return app;
}

module.exports = { createGrowthApp };
