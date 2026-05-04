/**
 * CCWEB Developer Ecosystem — Express sub-app
 * Mounts: /v1 (Public API + API key), /api/developer (console, open in prototype)
 */

const express = require("express");
const crypto = require("crypto");
const dp = require("./developerPlatform");
const cryptoSafety = require("./cryptoSafety");

function getClientIp(req) {
  return (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "";
}

function apiKeyMiddleware(req, res, next) {
  const header =
    req.headers["ccweb-api-key"] ||
    (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null);
  if (!header) {
    res.status(401).json({ error: "Missing API key. Use CCWEB-API-Key or Authorization: Bearer <key>." });
    return;
  }
  const row = dp.validateApiKey(header);
  if (!row) {
    res.status(401).json({ error: "Invalid API key." });
    return;
  }
  const project = dp.projects.get(row.projectId);
  const tier = project?.tier || "free";
  const limits = dp.tierLimits(tier);
  if ((row.callsThisMonth || 0) >= limits.monthlyCalls) {
    res.status(402).json({ error: "Monthly API call quota exceeded for project tier.", tier });
    return;
  }
  const ip = getClientIp(req);
  const lim = dp.checkRateLimit(row.id, ip, row.rateLimitPerMin);
  if (!lim.ok) {
    res.setHeader("Retry-After", String(lim.retryAfterSec));
    res.status(429).json({ error: "Rate limit exceeded.", retryAfterSec: lim.retryAfterSec });
    return;
  }
  row.lastUsedAt = new Date().toISOString();
  row.callsThisMonth = (row.callsThisMonth || 0) + 1;
  req.ccwebApiKey = row;
  req.ccwebProjectId = row.projectId;
  next();
}

let nextLogId = 1;

function logMw(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    dp.logRequest({
      id: `log_${nextLogId++}`,
      ts: new Date().toISOString(),
      keyId: req.ccwebApiKey?.id,
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      ms: Date.now() - start,
      error: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : undefined,
    });
  });
  next();
}

function dappSafetyCheck(templateId, network) {
  const warnings = [];
  if (!templateId || typeof templateId !== "string") warnings.push("Missing templateId.");
  if (!network || typeof network !== "string") warnings.push("Missing network.");
  if (network === "ethereum" && templateId === "spl-token") warnings.push("SPL token template is not for EVM mainnet.");
  return { passed: warnings.length === 0, warnings, checkedAt: new Date().toISOString() };
}

/**
 * @param {object} opts
 * @param {() => any[]} opts.streamRoomsGetter
 * @param {(body: object) => Promise<{ error?: string, status?: number, room?: object }>} opts.createStreamingSession
 * @param {(roomId: string, body: object) => Promise<{ error?: string, status?: number, room?: object }>} opts.finishStreamingSession
 * @param {() => { count: number, templates: object[] }} opts.dappTemplatesGetter
 * @param {(body: object, projectId: string) => Promise<object>} opts.dappDeployHandler
 */
function createDeveloperApp(opts) {
  const {
    streamRoomsGetter,
    createStreamingSession,
    finishStreamingSession,
    dappTemplatesGetter,
    dappDeployHandler,
  } = opts;

  const app = express();
  app.use(express.json({ limit: "512kb" }));

  const sandbox = express.Router();
  sandbox.post("/echo", (req, res) => {
    res.json({ ok: true, receivedAt: new Date().toISOString(), body: req.body || {} });
  });
  sandbox.post("/workflow", (req, res) => {
    const steps = Array.isArray(req.body?.steps) ? req.body.steps : [];
    res.json({
      simulated: true,
      runId: `run_${crypto.randomBytes(6).toString("hex")}`,
      stepsExecuted: steps.length,
      output: { message: "Sandbox workflow completed (no side effects)." },
    });
  });

  const v1 = express.Router();
  v1.use(logMw);
  v1.use(apiKeyMiddleware);

  v1.get("/sessions", (req, res) => {
    if (!dp.requireRole(req.ccwebApiKey, ["developer", "admin", "viewer"])) {
      res.status(403).json({ error: "Insufficient role." });
      return;
    }
    const rooms = streamRoomsGetter();
    res.json({ count: rooms.length, sessions: rooms });
  });

  v1.post("/sessions", async (req, res) => {
    if (!dp.requireRole(req.ccwebApiKey, ["developer", "admin"])) {
      res.status(403).json({ error: "Insufficient role." });
      return;
    }
    const out = await createStreamingSession(req.body || {});
    if (out.error) {
      res.status(out.status || 400).json({ error: out.error });
      return;
    }
    dp.emitWebhook(req.ccwebProjectId, "session.started", { roomId: out.room?.id, topic: out.room?.topic });
    res.status(201).json(out.room);
  });

  v1.get("/sessions/:id", (req, res) => {
    if (!dp.requireRole(req.ccwebApiKey, ["developer", "admin", "viewer"])) {
      res.status(403).json({ error: "Insufficient role." });
      return;
    }
    const rooms = streamRoomsGetter();
    const room = rooms.find((r) => r.id === req.params.id);
    if (!room) {
      res.status(404).json({ error: "Session not found." });
      return;
    }
    res.json(room);
  });

  v1.post("/sessions/:id/join", (req, res) => {
    if (!dp.requireRole(req.ccwebApiKey, ["developer", "admin", "viewer"])) {
      res.status(403).json({ error: "Insufficient role." });
      return;
    }
    res.json({
      joined: true,
      sessionId: req.params.id,
      hint: "Use GET /v1/sessions/:id for LiveKit-style stream payload (prototype).",
    });
  });

  v1.post("/sessions/:id/stream", (req, res) => {
    if (!dp.requireRole(req.ccwebApiKey, ["developer", "admin", "viewer"])) {
      res.status(403).json({ error: "Insufficient role." });
      return;
    }
    const rooms = streamRoomsGetter();
    const room = rooms.find((r) => r.id === req.params.id);
    if (!room) {
      res.status(404).json({ error: "Session not found." });
      return;
    }
    res.json({
      sessionId: room.id,
      stream: room.livekit || {},
      status: room.status,
      note: "WalletConnect / MetaMask not required for stream token in this prototype.",
    });
  });

  v1.post("/sessions/:id/finish", async (req, res) => {
    if (!dp.requireRole(req.ccwebApiKey, ["developer", "admin"])) {
      res.status(403).json({ error: "Insufficient role." });
      return;
    }
    const out = await finishStreamingSession(req.params.id, req.body || {});
    if (out.error) {
      res.status(out.status || 400).json({ error: out.error });
      return;
    }
    dp.emitWebhook(req.ccwebProjectId, "session.ended", { roomId: req.params.id });
    res.json(out.room || out);
  });

  v1.get("/users", (req, res) => {
    if (!dp.requireRole(req.ccwebApiKey, ["admin"])) {
      res.status(403).json({ error: "Admin role on API key required." });
      return;
    }
    const users = typeof opts.listUsersForAdmin === "function" ? opts.listUsersForAdmin() : [];
    res.json({ count: users.length, users });
  });

  v1.get("/revenue", (req, res) => {
    const bump = Math.round((req.ccwebApiKey.callsThisMonth || 0) * 0.02);
    const grossUsd = 120 + bump;
    const feePct = dp.PLATFORM_FEE_PCT;
    const platformUsd = +((grossUsd * feePct) / 100).toFixed(2);
    const netUsd = +(grossUsd - platformUsd).toFixed(2);
    dp.emitWebhook(req.ccwebProjectId, "revenue.updated", { grossUsd, netUsd, period: "current_month" });
    res.json({
      projectId: req.ccwebProjectId,
      platformFeePercent: feePct,
      grossUsd,
      netUsd,
      period: "current_month",
      note: "Synthetic ledger for prototype; connect Stripe or on-chain settlement for production.",
    });
  });

  v1.get("/analytics", (req, res) => {
    const recent = dp.requestLogs.filter((l) => l.keyId === req.ccwebApiKey.id).slice(0, 50);
    res.json({
      projectId: req.ccwebProjectId,
      callsThisMonth: req.ccwebApiKey.callsThisMonth || 0,
      rateLimitPerMin: req.ccwebApiKey.rateLimitPerMin,
      recentRequests: recent,
    });
  });

  v1.get("/agents", (req, res) => {
    const feed = cryptoSafety.getIntelligenceFeed();
    res.json({ count: feed.smartMoney.wallets.length, agents: feed.smartMoney.wallets });
  });

  v1.post("/agents", (req, res) => {
    const id = `agent_ext_${crypto.randomBytes(6).toString("hex")}`;
    dp.emitWebhook(req.ccwebProjectId, "agent.registered", { agentId: id, body: req.body });
    res.status(201).json({ id, status: "registered", note: "In-memory prototype; persist to DB in production." });
  });

  v1.post("/agents/:id/execute", (req, res) => {
    const runId = `run_${crypto.randomBytes(6).toString("hex")}`;
    dp.emitWebhook(req.ccwebProjectId, "agent.execution.completed", {
      agentId: req.params.id,
      runId,
      input: req.body || {},
      result: { ok: true, simulated: true },
    });
    res.json({ runId, agentId: req.params.id, status: "completed", simulated: true });
  });

  v1.get("/workflows", (req, res) => {
    const list = dp.listWorkflows(req.ccwebProjectId);
    res.json({ count: list.length, workflows: list });
  });

  v1.post("/workflows", (req, res) => {
    const row = dp.createWorkflow(req.ccwebProjectId, req.body || {});
    dp.emitWebhook(req.ccwebProjectId, "workflow.created", { workflowId: row.id, name: row.name });
    res.status(201).json(row);
  });

  v1.post("/workflows/:id/run", (req, res) => {
    const out = dp.runWorkflow(req.ccwebProjectId, req.params.id, req.body || {});
    if (out.error) {
      res.status(404).json(out);
      return;
    }
    dp.emitWebhook(req.ccwebProjectId, "workflow.run.completed", { workflowId: req.params.id, runId: out.runId });
    res.json(out);
  });

  v1.get("/dapp/templates", (req, res) => {
    res.json(dappTemplatesGetter());
  });

  v1.post("/dapp/deploy", async (req, res) => {
    try {
      const safety = dappSafetyCheck(req.body?.templateId, req.body?.network);
      const result = await dappDeployHandler(req.body || {}, req.ccwebProjectId);
      dp.emitWebhook(req.ccwebProjectId, "dapp.deploy.completed", { deployment: result, safety });
      const code = result._idempotent ? 200 : 201;
      res.status(code).json({ ...result, safety });
    } catch (e) {
      res.status(e.status || 400).json({ error: e.message || "Deploy failed" });
    }
  });

  v1.post("/graphql", (req, res) => {
    const q = (req.body && req.body.query) || "";
    if (/sessions/i.test(q)) {
      const rooms = streamRoomsGetter();
      return res.json({ data: { sessions: { count: rooms.length, nodes: rooms.slice(0, 20) } } });
    }
    if (/revenue/i.test(q)) {
      return res.json({ data: { revenue: { grossUsd: 120, platformFeePercent: dp.PLATFORM_FEE_PCT } } });
    }
    if (/agents/i.test(q)) {
      const feed = cryptoSafety.getIntelligenceFeed();
      return res.json({ data: { agents: { count: feed.smartMoney.wallets.length } } });
    }
    res.json({
      data: {},
      extensions: { note: "Subset GraphQL-style gateway; expand with graphql-js in production." },
    });
  });

  const dev = express.Router();
  dev.use("/sandbox", sandbox);

  dev.get("/openapi.json", (req, res) => {
    const proto = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers.host || `localhost:${process.env.PORT || 3000}`;
    res.json(dp.buildOpenApiSpec(`${proto}://${host}`));
  });

  dev.get("/docs", (req, res) => {
    res.type("html").send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>CCWEB API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"/>
    </head><body><div id="swagger"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>SwaggerUIBundle({url:'/api/developer/openapi.json',dom_id:'#swagger'});</script>
    </body></html>`);
  });

  dev.post("/keys", (req, res) => {
    const { name, projectId, roles } = req.body || {};
    const out = dp.createApiKey({ name, projectId, roles });
    if (out.error) return res.status(400).json(out);
    res.status(201).json({
      id: out.id,
      secret: out.secret,
      keyPrefix: out.keyPrefix,
      warning: "Store this secret once; it cannot be retrieved again.",
    });
  });

  dev.get("/keys", (req, res) => {
    const list = [...dp.apiKeys.values()].map((k) => ({
      id: k.id,
      keyPrefix: k.keyPrefix,
      name: k.name,
      projectId: k.projectId,
      roles: k.roles,
      rateLimitPerMin: k.rateLimitPerMin,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
      callsThisMonth: k.callsThisMonth,
    }));
    res.json({ keys: list });
  });

  dev.delete("/keys/:id", (req, res) => {
    const id = req.params.id;
    if (!dp.apiKeys.has(id)) return res.status(404).json({ error: "Not found" });
    dp.apiKeys.delete(id);
    res.json({ ok: true });
  });

  dev.get("/projects", (req, res) => {
    res.json({ projects: [...dp.projects.values()] });
  });

  dev.post("/projects", (req, res) => {
    const id = `proj_${crypto.randomBytes(6).toString("hex")}`;
    const row = {
      id,
      name: (req.body && req.body.name) || "New Project",
      ownerUserId: (req.body && req.body.ownerUserId) || "anonymous",
      tier: (req.body && req.body.tier) || "free",
      createdAt: new Date().toISOString(),
    };
    dp.projects.set(id, row);
    res.status(201).json(row);
  });

  dev.patch("/projects/:id", (req, res) => {
    const row = dp.projects.get(req.params.id);
    if (!row) return res.status(404).json({ error: "Not found" });
    if (req.body?.name) row.name = String(req.body.name);
    if (req.body?.tier && ["free", "pro", "scale"].includes(req.body.tier)) {
      row.tier = req.body.tier;
      for (const k of dp.apiKeys.values()) {
        if (k.projectId === row.id) k.rateLimitPerMin = dp.tierLimits(row.tier).rpm;
      }
    }
    res.json(row);
  });

  dev.get("/logs", (req, res) => {
    res.json({ logs: dp.requestLogs.slice(0, 200) });
  });

  dev.get("/webhooks", (req, res) => {
    res.json({
      webhooks: [...dp.webhooks.values()].map((w) => ({
        id: w.id,
        url: w.url,
        events: w.events,
        active: w.active,
        projectId: w.projectId,
      })),
    });
  });

  dev.post("/webhooks", (req, res) => {
    const { url, events, projectId } = req.body || {};
    if (!url) return res.status(400).json({ error: "url required" });
    const wid = `wh_${crypto.randomBytes(6).toString("hex")}`;
    const secret = crypto.randomBytes(16).toString("hex");
    dp.ensureDefaultProject();
    const row = {
      id: wid,
      projectId: projectId || [...dp.projects.keys()][0],
      url,
      secret,
      events: Array.isArray(events) && events.length
        ? events
        : ["session.started", "session.ended", "revenue.updated", "agent.execution.completed", "dapp.deploy.completed"],
      active: true,
      createdAt: new Date().toISOString(),
    };
    dp.webhooks.set(wid, row);
    res.status(201).json({ id: wid, secret, note: "Save webhook signing secret; shown once." });
  });

  dev.get("/marketplace", (req, res) => {
    res.json({ listings: [...dp.marketplaceListings.values()] });
  });

  dev.post("/marketplace", (req, res) => {
    const id = `lst_${crypto.randomBytes(6).toString("hex")}`;
    const priceUsd = Number(req.body?.priceUsd) || 0;
    const row = {
      id,
      type: req.body?.type || "dapp",
      title: req.body?.title || "Untitled",
      priceUsd,
      sellerFeePercent: 100 - dp.PLATFORM_FEE_PCT,
      platformFeePercent: dp.PLATFORM_FEE_PCT,
      createdAt: new Date().toISOString(),
    };
    dp.marketplaceListings.set(id, row);
    res.status(201).json(row);
  });

  dev.get("/billing/tiers", (req, res) => {
    res.json({
      tiers: [
        { id: "free", priceUsd: 0, limits: dp.tierLimits("free") },
        { id: "pro", priceUsd: 49, limits: dp.tierLimits("pro") },
        { id: "scale", priceUsd: 299, limits: dp.tierLimits("scale") },
      ],
      metering: "pay_per_call_available",
      revenueShare: { platformPercent: dp.PLATFORM_FEE_PCT, builderPercent: 100 - dp.PLATFORM_FEE_PCT },
    });
  });

  app.use("/v1", v1);
  app.use("/api/developer", dev);

  app.use((req, res) => {
    res.status(404).json({ error: "Not found", path: req.originalUrl || req.url });
  });

  return app;
}

module.exports = { createDeveloperApp, apiKeyMiddleware };
