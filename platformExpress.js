/**
 * Unified REST API under /api/v1 — Express Router composition with JWT middleware.
 */

const express = require("express");
const crypto = require("crypto");
const { applyExpressSecurity } = require("./security/expressHardDefaults");
const authEngine = require("./auth/authEngine");
const authStore = require("./auth/authStore");
const rateLimitAuth = require("./auth/rateLimit");
const { mountAt, mountWalletFlat } = require("./auth/authExpress");
const learningPg = require("./db/persistenceLearning");
const pgGrowth = require("./db/persistenceGrowth");
const { expressStripeEscrowCheckout } = require("./payments/stripeCheckout");
const aiExecute = require("./services/aiExecute");

function getClientIp(req) {
  return (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "";
}

function apiRateShort(req, res, next) {
  const ip = getClientIp(req);
  const rl = rateLimitAuth.check("api_v1", ip, 120, 60 * 1000);
  if (!rl.ok) {
    res.setHeader("Retry-After", String(rl.retryAfterSec || 60));
    return res.status(429).json({ error: "Too many requests." });
  }
  next();
}

function authJwtMiddleware(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  const userId = authEngine.getUserIdFromAccess(token);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized.", code: "INVALID_TOKEN" });
  }
  req.ccwebUserId = userId;
  next();
}

function optionalJwt(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  req.ccwebUserId = authEngine.getUserIdFromAccess(token) || null;
  next();
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || "Internal server error",
    code: err.code || "SERVER_ERROR",
  });
}

function createPlatformApp(deps) {
  const app = express();
  applyExpressSecurity(app);
  app.locals.ccwebAuth = deps;

  app.use(express.json({ limit: "512kb" }));
  const cookieParser = require("cookie-parser");
  app.use(cookieParser());

  const v1 = express.Router();

  const authRouter = express.Router();
  mountAt(authRouter, "");
  mountWalletFlat(authRouter);

  v1.use("/auth", apiRateShort, authRouter);

  const walletRouter = express.Router();
  mountWalletFlat(walletRouter, { verifyPath: "/verify" });

  v1.use("/wallet", apiRateShort, walletRouter);

  const usersRouter = express.Router();

  usersRouter.get("/me", authJwtMiddleware, async (req, res, next) => {
    try {
      const { ccwebUsers, sanitizeUser } = deps;
      const user = ccwebUsers.get(req.ccwebUserId);
      if (!user) return res.status(401).json({ error: "Session invalid." });
      res.json({ user: sanitizeUser(user) });
    } catch (e) {
      next(e);
    }
  });

  usersRouter.put("/update", authJwtMiddleware, async (req, res, next) => {
    try {
      const { ccwebUsers, sanitizeUser, buildUserProfile } = deps;
      const row = await authStore.findById(req.ccwebUserId);
      if (!row) return res.status(404).json({ error: "User not found." });
      const displayName = (req.body?.displayName || "").toString().trim();
      if (!displayName || displayName.length > 120) {
        return res.status(400).json({ error: "displayName required (max 120 chars)." });
      }
      const existingInMem = ccwebUsers.get(req.ccwebUserId);
      const merged = buildUserProfile(
        {
          userId: req.ccwebUserId,
          displayName,
          email: row.email || existingInMem?.email,
          roles: existingInMem?.roles || ["member"],
          pushEnabled: existingInMem?.pushEnabled ?? true,
          isOrganic: existingInMem?.isOrganic ?? true,
        },
        existingInMem || null
      );
      ccwebUsers.set(req.ccwebUserId, merged);
      await authStore.saveUser({
        ...row,
        email: row.email || merged.email || null,
      });
      res.json({ user: sanitizeUser(merged) });
    } catch (e) {
      next(e);
    }
  });

  usersRouter.get("/:id", optionalJwt, async (req, res, next) => {
    try {
      const { sanitizeUser } = deps;
      const id = req.params.id;
      const row = await authStore.findById(id);
      if (!row) return res.status(404).json({ error: "Not found." });
      const u = deps.ccwebUsers.get(id) || {
        id: row.id,
        email: row.email,
        displayName: id.slice(0, 8),
        roles: ["member"],
        isOrganic: true,
        pushEnabled: true,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
      const publicUser = sanitizeUser(u);
      if (req.ccwebUserId !== id) {
        delete publicUser.email;
      }
      res.json({ user: publicUser });
    } catch (e) {
      next(e);
    }
  });

  v1.use("/users", usersRouter);

  const agentRuns = [];
  const catalogAgents = [
    {
      id: "agent-001",
      name: "Research Loop Agent",
      description: "Monitors narratives and on-chain signals.",
      category: "research",
      capabilities: ["On-chain analysis", "Reports"],
    },
    {
      id: "agent-002",
      name: "Workflow Operator",
      description: "Runs multi-step automation workflows.",
      category: "operations",
      capabilities: ["Workflow design", "Integrations"],
    },
  ];

  const agentsRouter = express.Router();

  agentsRouter.post("/create", authJwtMiddleware, async (req, res, next) => {
    try {
      const name = (req.body?.name || "Custom Agent").toString().slice(0, 120);
      const category = (req.body?.category || "general").toString().slice(0, 64);
      const agent = {
        id: `agent-custom-${crypto.randomBytes(6).toString("hex")}`,
        name,
        category,
        ownerUserId: req.ccwebUserId,
        description: (req.body?.description || "").toString().slice(0, 500),
        capabilities: Array.isArray(req.body?.capabilities) ? req.body.capabilities.map(String).slice(0, 12) : [],
        createdAt: new Date().toISOString(),
      };
      catalogAgents.push(agent);
      res.status(201).json({ agent });
    } catch (e) {
      next(e);
    }
  });

  agentsRouter.get("/", authJwtMiddleware, async (req, res) => {
    res.json({ count: catalogAgents.length, agents: catalogAgents });
  });

  agentsRouter.get("/:id", authJwtMiddleware, async (req, res) => {
    const a = catalogAgents.find((x) => x.id === req.params.id);
    if (!a) return res.status(404).json({ error: "Agent not found." });
    res.json({ agent: a });
  });

  agentsRouter.post("/run", authJwtMiddleware, async (req, res, next) => {
    try {
      const agentId = (req.body?.agentId || "").toString().trim();
      const input = req.body?.input || {};
      const agent = catalogAgents.find((x) => x.id === agentId);
      if (!agent) return res.status(404).json({ error: "Agent not found." });
      const runId = `run_${crypto.randomBytes(8).toString("hex")}`;
      const ai = await aiExecute.runAgent(agent, input);
      const result = {
        runId,
        agentId,
        status: "completed",
        summary: ai.text.slice(0, 400),
        outputPreview: ai.text.slice(0, 800),
        provider: ai.provider,
        model: ai.model,
        usage: ai.usage,
        finishedAt: new Date().toISOString(),
      };
      agentRuns.unshift({ ...result, userId: req.ccwebUserId });
      if (agentRuns.length > 500) agentRuns.pop();
      res.status(200).json(result);
    } catch (e) {
      if (e.code === "AI_NOT_CONFIGURED") return res.status(503).json({ error: e.message, code: e.code });
      next(e);
    }
  });

  v1.use("/agents", agentsRouter);

  const marketplaceRouter = express.Router();

  marketplaceRouter.post("/create", authJwtMiddleware, async (req, res, next) => {
    try {
      if (!pgGrowth.usePostgres()) {
        return res.status(503).json({ error: "PostgreSQL required for marketplace listings." });
      }
      const row = await pgGrowth.createListing({
        ...req.body,
        sellerId: req.body?.sellerId || req.ccwebUserId,
      });
      res.status(201).json(row);
    } catch (e) {
      next(e);
    }
  });

  marketplaceRouter.get("/", async (req, res, next) => {
    try {
      const industry = (req.query.industry || "").toString();
      const hub = require("./businessGrowthHub");
      const list = pgGrowth.usePostgres()
        ? await pgGrowth.listListings(industry)
        : (hub.seedIfEmpty(), [...hub.listings.values()].filter((l) => !industry || l.industry === industry));
      res.json({ count: list.length, listings: list });
    } catch (e) {
      next(e);
    }
  });

  marketplaceRouter.get("/:id", async (req, res, next) => {
    try {
      const hub = require("./businessGrowthHub");
      const row = pgGrowth.usePostgres()
        ? await pgGrowth.getListing(req.params.id)
        : (hub.seedIfEmpty(), hub.listings.get(req.params.id));
      if (!row) return res.status(404).json({ error: "Not found." });
      res.json(row);
    } catch (e) {
      next(e);
    }
  });

  v1.use("/marketplace", marketplaceRouter);

  const paymentsRouter = express.Router();

  paymentsRouter.post("/create", authJwtMiddleware, async (req, res, next) => {
    try {
      req.body = {
        ...req.body,
        buyerId: req.body?.buyerId || req.ccwebUserId,
      };
      await expressStripeEscrowCheckout(req, res);
      if (!res.headersSent) next();
    } catch (e) {
      next(e);
    }
  });

  paymentsRouter.post("/release", authJwtMiddleware, async (req, res, next) => {
    try {
      if (!pgGrowth.usePostgres()) {
        return res.status(503).json({ error: "PostgreSQL required." });
      }
      const orderId = (req.body?.orderId || "").toString().trim();
      const action = (req.body?.action || "confirm").toString().toLowerCase();
      if (!orderId) return res.status(400).json({ error: "orderId required." });
      let out;
      if (action === "deliver" || action === "mark_delivered") {
        out = await pgGrowth.markDelivered(orderId);
      } else {
        out = await pgGrowth.confirmOrder(orderId);
      }
      if (out.error) return res.status(400).json(out);
      res.json(out);
    } catch (e) {
      next(e);
    }
  });

  paymentsRouter.get("/history", authJwtMiddleware, async (req, res, next) => {
    try {
      if (!pgGrowth.usePostgres()) {
        const hub = require("./businessGrowthHub");
        hub.seedIfEmpty();
        const mine = [...hub.orders.values()].filter((o) => o.buyerId === req.ccwebUserId || o.sellerId === req.ccwebUserId);
        return res.json({ count: mine.length, orders: mine });
      }
      const asSeller = await pgGrowth.listOrders(req.ccwebUserId);
      const asBuyer = await pgGrowth.listOrders(null);
      const buyerFiltered = asBuyer.filter((o) => o.buyerId === req.ccwebUserId);
      const map = new Map();
      [...asSeller, ...buyerFiltered].forEach((o) => map.set(o.id, o));
      const merged = Array.from(map.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      res.json({ count: merged.length, orders: merged });
    } catch (e) {
      next(e);
    }
  });

  v1.use("/payments", paymentsRouter);

  const analyticsRouter = express.Router();

  analyticsRouter.get("/user", authJwtMiddleware, async (req, res, next) => {
    try {
      if (!learningPg.usePostgres()) {
        return res.json({
          postgres: false,
          profile: null,
          ordersSample: [],
          note: "Enable DATABASE_URL for full analytics.",
        });
      }
      const profile = await learningPg.userLearningProfile(req.ccwebUserId);
      let orders = [];
      if (pgGrowth.usePostgres()) {
        const seller = await pgGrowth.listOrders(req.ccwebUserId);
        const all = await pgGrowth.listOrders(null);
        orders = [...seller, ...all.filter((o) => o.buyerId === req.ccwebUserId)];
      }
      res.json({ postgres: true, profile, orders: orders.slice(0, 25) });
    } catch (e) {
      next(e);
    }
  });

  analyticsRouter.get("/platform", authJwtMiddleware, async (req, res, next) => {
    try {
      const key = (req.headers["x-ccweb-admin"] || "").toString().trim();
      const adminKey = (process.env.CCWEB_ADMIN_KEY || "").trim();
      if (!adminKey || key !== adminKey) {
        return res.status(403).json({ error: "Admin key required (X-CCWEB-Admin)." });
      }
      if (!learningPg.usePostgres()) {
        return res.status(503).json({ error: "PostgreSQL required for platform analytics." });
      }
      const summary = await learningPg.analyticsSummary();
      const growthOverview = pgGrowth.usePostgres() ? await pgGrowth.overview() : null;
      res.json({ learning: summary, growthHub: growthOverview });
    } catch (e) {
      next(e);
    }
  });

  v1.use("/analytics", analyticsRouter);

  app.use(v1);

  app.use(errorHandler);

  return app;
}

module.exports = { createPlatformApp, authJwtMiddleware, apiRateShort, errorHandler };
