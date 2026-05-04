/**
 * CCWEB Developer Ecosystem — in-memory prototype (PostgreSQL-ready shapes).
 * API keys stored as sha256 hash + prefix for display; never return full secret after creation.
 */

const crypto = require("crypto");

const PLATFORM_FEE_PCT = 8;

let nextKeyId = 1;

/** @type {Map<string, { id, name, ownerUserId, tier, createdAt }>} */
const projects = new Map();
/** @type {Map<string, { id, keyHash, keyPrefix, name, projectId, roles, rateLimitPerMin, createdAt, lastUsedAt }>} */
const apiKeys = new Map();
/** @type {Map<string, { id, projectId, url, secret, events: string[], active, createdAt }>} */
const webhooks = new Map();
/** @type {Array<{ id, ts, keyId, method, path, status, ms, error? }>} */
const requestLogs = [];
const MAX_LOGS = 500;
/** @type {Map<string, { count, windowStart }>} */
const rateBuckets = new Map();

/** @type {Map<string, any>} */
const marketplaceListings = new Map();
/** @type {Map<string, { id, projectId, name, steps: object[], status: string, createdAt: string }>} */
const workflows = new Map();
let nextWorkflowStoreId = 1;

function listWorkflows(projectId) {
  return [...workflows.values()].filter((w) => w.projectId === projectId);
}

function createWorkflow(projectId, body) {
  const id = `wf_${nextWorkflowStoreId++}_${crypto.randomBytes(4).toString("hex")}`;
  const row = {
    id,
    projectId,
    name: (body && body.name) || "Untitled workflow",
    steps: Array.isArray(body?.steps) ? body.steps : [],
    status: "draft",
    createdAt: new Date().toISOString(),
  };
  workflows.set(id, row);
  return row;
}

function runWorkflow(projectId, workflowId, input) {
  const w = workflows.get(workflowId);
  if (!w || w.projectId !== projectId) return { error: "Workflow not found." };
  const runId = `run_${crypto.randomBytes(8).toString("hex")}`;
  return {
    runId,
    workflowId,
    status: "completed",
    simulated: true,
    stepsExecuted: w.steps.length,
    output: { message: "Workflow run simulated.", input: input || {} },
  };
}

function hashKey(secret) {
  return crypto.createHash("sha256").update(secret, "utf8").digest("hex");
}

function generateApiSecret() {
  return `ccweb_live_${crypto.randomBytes(24).toString("base64url")}`;
}

function keyPrefix(secret) {
  return `${secret.slice(0, 12)}…`;
}

function getBucketKey(apiKeyId, ip) {
  return `${apiKeyId}:${ip || "unknown"}`;
}

function checkRateLimit(apiKeyId, ip, limitPerMin) {
  const bk = getBucketKey(apiKeyId, ip);
  const now = Date.now();
  const windowMs = 60_000;
  let b = rateBuckets.get(bk);
  if (!b || now - b.windowStart > windowMs) {
    b = { count: 0, windowStart: now };
    rateBuckets.set(bk, b);
  }
  b.count += 1;
  if (b.count > limitPerMin) {
    return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - b.windowStart)) / 1000) };
  }
  return { ok: true };
}

function logRequest(entry) {
  requestLogs.unshift(entry);
  if (requestLogs.length > MAX_LOGS) requestLogs.pop();
}

async function deliverWebhook(webhook, event, payload) {
  if (!webhook.active || !webhook.events.includes(event)) return;
  const body = JSON.stringify({
    id: `evt_${crypto.randomBytes(8).toString("hex")}`,
    type: event,
    createdAt: new Date().toISOString(),
    data: payload,
  });
  const sig = crypto.createHmac("sha256", webhook.secret).update(body).digest("hex");
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 5000);
    await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CCWEB-Signature": `sha256=${sig}`,
        "X-CCWEB-Event": event,
      },
      body,
      signal: ac.signal,
    });
    clearTimeout(t);
  } catch {
    /* sandbox / broken URLs expected */
  }
}

function emitWebhook(projectId, event, payload) {
  for (const w of webhooks.values()) {
    if (w.projectId === projectId) deliverWebhook(w, event, payload);
  }
}

function tierLimits(tier) {
  if (tier === "pro") return { rpm: 600, monthlyCalls: 500_000 };
  if (tier === "scale") return { rpm: 2000, monthlyCalls: 5_000_000 };
  return { rpm: 120, monthlyCalls: 50_000 };
}

function ensureDefaultProject() {
  if (projects.size) return;
  const id = "proj_default";
  projects.set(id, {
    id,
    name: "Default Project",
    ownerUserId: "system",
    tier: "free",
    createdAt: new Date().toISOString(),
  });
}

function createApiKey({ name, projectId, roles }) {
  ensureDefaultProject();
  const pid = projectId || [...projects.keys()][0];
  if (!projects.has(pid)) return { error: "Invalid projectId." };
  const secret = generateApiSecret();
  const id = `apk_${nextKeyId++}`;
  const keyHash = hashKey(secret);
  const row = {
    id,
    keyHash,
    keyPrefix: keyPrefix(secret),
    name: name || "API Key",
    projectId: pid,
    roles: Array.isArray(roles) && roles.length ? roles : ["developer"],
    rateLimitPerMin: tierLimits(projects.get(pid).tier).rpm,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    callsThisMonth: 0,
  };
  apiKeys.set(id, row);
  return { id, secret, keyPrefix: row.keyPrefix, name: row.name, projectId: pid };
}

function validateApiKey(secret) {
  if (!secret || typeof secret !== "string") return null;
  const h = hashKey(secret);
  for (const k of apiKeys.values()) {
    if (k.keyHash === h) return k;
  }
  return null;
}

function requireRole(keyRow, roles) {
  return roles.some((r) => keyRow.roles.includes(r) || keyRow.roles.includes("admin"));
}

function buildOpenApiSpec(baseUrl) {
  return {
    openapi: "3.0.3",
    info: {
      title: "CCWEB Public API",
      version: "1.0.0",
      description:
        "Developer platform API. Authenticate with header CCWEB-API-Key or Authorization: Bearer <key>. Production: use HTTPS only.",
    },
    servers: [{ url: `${baseUrl}/v1` }],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "CCWEB-API-Key",
        },
      },
    },
    security: [{ ApiKeyAuth: [] }],
    paths: {
      "/sessions": {
        get: { summary: "List streaming sessions" },
        post: { summary: "Create session (room)" },
      },
      "/sessions/{id}": { get: { summary: "Get session" } },
      "/sessions/{id}/join": { post: { summary: "Join session" } },
      "/sessions/{id}/stream": { post: { summary: "Stream credentials" } },
      "/sessions/{id}/finish": { post: { summary: "End session" } },
      "/users": { get: { summary: "List users (admin key)" } },
      "/revenue": { get: { summary: "Revenue summary" } },
      "/analytics": { get: { summary: "Usage analytics" } },
      "/agents": { get: { summary: "List agents" }, post: { summary: "Register agent" } },
      "/agents/{id}/execute": { post: { summary: "Execute agent (simulated)" } },
      "/workflows": { get: { summary: "List workflows" }, post: { summary: "Create workflow" } },
      "/workflows/{id}/run": { post: { summary: "Run workflow (simulated)" } },
      "/dapp/templates": { get: { summary: "DApp templates" } },
      "/dapp/deploy": { post: { summary: "Deploy (simulated settlement)" } },
      "/graphql": { post: { summary: "GraphQL-style query (subset)" } },
    },
  };
}

module.exports = {
  PLATFORM_FEE_PCT,
  projects,
  apiKeys,
  webhooks,
  marketplaceListings,
  requestLogs,
  checkRateLimit,
  logRequest,
  createApiKey,
  validateApiKey,
  requireRole,
  emitWebhook,
  tierLimits,
  ensureDefaultProject,
  buildOpenApiSpec,
  hashKey,
  listWorkflows,
  createWorkflow,
  runWorkflow,
};
