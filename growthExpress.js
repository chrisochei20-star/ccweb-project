/**
 * Business Growth Hub API — PostgreSQL when DATABASE_URL is set; else in-memory hub.
 */

const express = require("express");
const { applyExpressSecurity } = require("./security/expressHardDefaults");
const hub = require("./businessGrowthHub");
const pg = require("./db/persistenceGrowth");
const authEngine = require("./auth/authEngine");

function usePg() {
  return pg.usePostgres();
}

function getBearerUserId(req) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  return authEngine.getUserIdFromAccess(token);
}

function requireUser(req, res) {
  const uid = getBearerUserId(req);
  if (!uid) {
    res.status(401).json({ error: "Authentication required." });
    return null;
  }
  return uid;
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
      const uid = requireUser(req, res);
      if (!uid) return;
      const body = { ...(req.body || {}) };
      body.sellerId = uid;
      if (!body.sellerName || !String(body.sellerName).trim()) {
        body.sellerName = body.sellerDisplayName || "Seller";
      }
      const row = usePg() ? await pg.createListing(body) : hub.createListing(body);
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
      const uid = requireUser(req, res);
      if (!uid) return;
      const body = { ...(req.body || {}), buyerId: uid };
      if (!body.buyerName || !String(body.buyerName).trim()) {
        body.buyerName = body.buyerDisplayName || "Buyer";
      }
      const out = usePg() ? await pg.createOrder(body) : hub.createOrder(body);

   if (!out.error) {
   recordWalletTransaction(uid, {
    type: "purchase",
    amount: Number(body.amount || body.price || 0),
    method: "Marketplace",
    status: "completed",
  });
}  

    if (out.error) return res.status(400).json(out);
      res.status(201).json(out);
    } catch (e) {
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  app.post("/orders/:id/deliver", async (req, res) => {
    try {
      const uid = requireUser(req, res);
      if (!uid) return;
      let order = null;
      if (usePg()) order = await pg.getOrder(req.params.id);
      else order = hub.orders.get(req.params.id);
      if (!order) return res.status(404).json({ error: "Order not found." });
      if (order.sellerId !== uid) return res.status(403).json({ error: "Only the seller can mark delivered." });
      const out = usePg() ? await pg.markDelivered(req.params.id) : hub.markDelivered(req.params.id);
      if (out.error) return res.status(400).json(out);
      res.json(out);
    } catch (e) {
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  app.post("/orders/:id/confirm", async (req, res) => {
    try {
      const uid = requireUser(req, res);
      if (!uid) return;
      let order = null;
      if (usePg()) order = await pg.getOrder(req.params.id);
      else order = hub.orders.get(req.params.id);
      if (!order) return res.status(404).json({ error: "Order not found." });
      if (order.buyerId !== uid) return res.status(403).json({ error: "Only the buyer can confirm release." });
      const out = usePg() ? await pg.confirmOrder(req.params.id) : hub.confirmOrder(req.params.id);

     if (!out.error && order) {
     recordWalletTransaction(order.sellerId, {
     type: "sale",
     amount: Number(order.amount || order.price || 0),
     method: "Marketplace",
     status: "completed",
   });
 }

      if (out.error) return res.status(400).json(out);
      res.json(out);
    } catch (e) {
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  app.get("/orders", async (req, res) => {
    try {
      const uid = getBearerUserId(req);
      if (uid) {
        const list = usePg() ? await pg.listOrdersForParticipant(uid) : [...hub.orders.values()].filter((o) => o.sellerId === uid || o.buyerId === uid);
        return res.json({ count: list.length, orders: list });
      }
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
      const uid = requireUser(req, res);
      if (!uid) return;
      const body = { ...(req.body || {}), businessId: (req.body && req.body.businessId) || uid };
      const row = usePg() ? await pg.createLead(body) : hub.createLead(body);
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
      const uid = requireUser(req, res);
      if (!uid) return;
      const body = { ...(req.body || {}), businessId: (req.body && req.body.businessId) || uid };
      const row = usePg() ? await pg.createCampaign(body) : hub.createCampaign(body);
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
// Wallet API
const walletStore = new Map();

function recordWalletTransaction(uid, transaction) {
  const wallet = walletStore.get(uid) || {
    ngn: 13800,
    usdt: 12.4,
    transactions: [],
  };

  wallet.transactions.unshift({
    ...transaction,
    createdAt: new Date().toISOString(),
  });

  walletStore.set(uid, wallet);
}
app.get("/wallet/balance", (req, res) => {
  const uid = requireUser(req, res);
  if (!uid) return;

  const wallet = walletStore.get(uid) || {
    ngn: 13800,
    usdt: 12.4,
    transactions: [],
  };

  const NGN_PER_USDT = 1500;res.json({  ...wallet,  usdt: Number((wallet.ngn / NGN_PER_USDT).toFixed(2)),  rate: NGN_PER_USDT,});
});

app.get("/wallet/transactions", (req, res) => {
  const uid = requireUser(req, res);
  if (!uid) return;

  const wallet = walletStore.get(uid) || {
    ngn: 13800,
    usdt: 12.4,
    transactions: [],
  };

  res.json(wallet.transactions);
});

app.post("/wallet/deposit", (req, res) => {
  const uid = requireUser(req, res);
  if (!uid) return;

  const amount = Number(req.body.amount || 0);

  const wallet = walletStore.get(uid) || {
    ngn: 13800,
    usdt: 12.4,
    transactions: [],
  };

  wallet.ngn += amount;
  recordWalletTransaction(uid, {
  type: "deposit",
  amount,
  status: "completed",
});

  walletStore.set(uid, wallet);
  const NGN_PER_USDT = 1500;res.json({  ...wallet,  usdt: Number((wallet.ngn / NGN_PER_USDT).toFixed(2)),  rate: NGN_PER_USDT,});
});

app.post("/wallet/withdraw", (req, res) => {
  const uid = requireUser(req, res);
  if (!uid) return;

  const amount = Number(req.body.amount || 0);

  const wallet = walletStore.get(uid) || {
    ngn: 13800,
    usdt: 12.4,
    transactions: [],
  };

  if (wallet.ngn < amount) {
    return res.status(400).json({
      error: "Insufficient balance",
    });
  }

  wallet.ngn -= amount;

recordWalletTransaction(uid, {
  type: "withdraw",
  amount,
  status: "completed",
});

  walletStore.set(uid, wallet);
  const NGN_PER_USDT = 1500;res.json({  ...wallet,  usdt: Number((wallet.ngn / NGN_PER_USDT).toFixed(2)),  rate: NGN_PER_USDT,});
});
  app.use((req, res) => {
    res.status(404).json({ error: "Growth hub route not found", path: req.originalUrl || req.url });
  });

  return app;
}

module.exports = { createGrowthApp };
