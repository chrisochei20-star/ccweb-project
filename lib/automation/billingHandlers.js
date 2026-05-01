const {
  trackUsage,
  calculateCost,
  getBillingSummary,
  setTenantPlan,
  recordAttributedRevenue,
} = require("./billingEngine");
const { SUBSCRIPTION_PLANS, USAGE_RATES, MARKETPLACE, LEAD_GEN_RATES } = require("./pricing");

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString("utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("INVALID_JSON");
  }
}

function handleBillingPricing(res) {
  sendJson(res, 200, {
    currency: "USD",
    plans: Object.values(SUBSCRIPTION_PLANS),
    meterRates: USAGE_RATES,
    leadGenRates: LEAD_GEN_RATES,
    marketplace: MARKETPLACE,
    performanceFeeNote:
      "Performance fee applies only to revenue or pipeline-value you explicitly attribute to CCWEB automation (Pro: 5%, Enterprise: 3%).",
  });
}

async function handleTrackUsage(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }
  const tenantId = (body.tenantId || "default").toString().trim();
  const result = trackUsage(tenantId, body);
  sendJson(res, 200, {
    ok: true,
    usage: result.usage,
    estimatedPeriodCost: calculateCost(tenantId),
  });
}

function handleCalculateCost(requestUrl, res) {
  const tenantId = requestUrl.searchParams.get("tenantId") || "default";
  sendJson(res, 200, calculateCost(tenantId));
}

function handleBillingSummary(requestUrl, res) {
  const tenantId = requestUrl.searchParams.get("tenantId") || "default";
  sendJson(res, 200, getBillingSummary(tenantId));
}

async function handleSetPlan(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }
  const tenantId = (body.tenantId || "default").toString().trim();
  const planId = (body.planId || "").toString().trim();
  const result = setTenantPlan(tenantId, planId);
  if (result.error) {
    sendJson(res, result.status || 400, { error: result.error });
    return;
  }
  sendJson(res, 200, {
    tenantId,
    planId: result.planId,
    plan: result.plan,
    estimatedPeriodCost: calculateCost(tenantId),
  });
}

async function handleAttributedRevenue(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }
  const tenantId = (body.tenantId || "default").toString().trim();
  const amount = Number(body.attributedGrowthUsd ?? body.amountUsd ?? 0);
  recordAttributedRevenue(tenantId, amount);
  sendJson(res, 200, {
    ok: true,
    attribution: calculateCost(tenantId).performanceFee,
    billingSummary: getBillingSummary(tenantId),
  });
}

module.exports = {
  handleBillingPricing,
  handleTrackUsage,
  handleCalculateCost,
  handleBillingSummary,
  handleSetPlan,
  handleAttributedRevenue,
};
