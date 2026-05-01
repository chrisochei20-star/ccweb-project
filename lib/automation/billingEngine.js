const crypto = require("crypto");
const { SUBSCRIPTION_PLANS, USAGE_RATES, PERFORMANCE_FEE } = require("./pricing");
const {
  usageByTenant,
  billingHistory,
  tenantPlans,
  revenueAttributionByTenant,
  tenantMetrics,
} = require("./store");

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatMoney(value) {
  return Math.round(value * 100) / 100;
}

function getPlanForTenant(tenantId) {
  const id = tenantId || "default";
  const planId = tenantPlans.get(id) || "free";
  const plan = SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.free;
  return { planId, plan };
}

function setTenantPlan(tenantId, planId) {
  const id = tenantId || "default";
  if (!SUBSCRIPTION_PLANS[planId]) {
    return { error: "Unknown plan.", status: 400 };
  }
  tenantPlans.set(id, planId);
  return { planId, plan: SUBSCRIPTION_PLANS[planId] };
}

function ensureUsageBucket(tenantId) {
  const id = tenantId || "default";
  if (!usageByTenant.has(id)) {
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);
    usageByTenant.set(id, {
      tenantId: id,
      periodStart: periodStart.toISOString(),
      workflowRuns: 0,
      agentActions: 0,
      apiUnits: 0,
      dataProcessingGb: 0,
      compatibilityReports: 0,
      pipelineRuns: 0,
      estimatedAiRequests: 0,
      marketplacePurchases: 0,
      premiumIntegrationDays: 0,
      updatedAt: new Date().toISOString(),
    });
  }
  return usageByTenant.get(id);
}

function trackUsage(tenantId, event) {
  const type = (event.type || "").toString().trim();
  const quantity = Math.max(0, safeNumber(event.quantity, 1));
  const bucket = ensureUsageBucket(tenantId);

  switch (type) {
    case "workflow_run":
    case "pipeline_run":
      bucket.workflowRuns += quantity;
      bucket.pipelineRuns += quantity;
      break;
    case "agent_action":
      bucket.agentActions += quantity;
      break;
    case "api_call":
    case "ai_request":
      bucket.apiUnits += quantity;
      bucket.estimatedAiRequests += quantity;
      break;
    case "data_processing_gb":
      bucket.dataProcessingGb += quantity;
      break;
    case "compatibility_analyze":
      bucket.compatibilityReports += quantity;
      bucket.apiUnits += Math.ceil(quantity * 3);
      break;
    case "problem_solve":
      bucket.apiUnits += Math.ceil(quantity * 8);
      break;
    case "marketplace_usage":
      bucket.marketplacePurchases += quantity;
      break;
    case "premium_integration_day":
      bucket.premiumIntegrationDays += quantity;
      break;
    default:
      bucket.apiUnits += quantity;
  }

  bucket.updatedAt = new Date().toISOString();
  usageByTenant.set(bucket.tenantId, bucket);

  const logEntry = {
    id: `usage-${crypto.randomUUID().slice(0, 12)}`,
    tenantId: bucket.tenantId,
    type,
    quantity,
    metadata: event.metadata && typeof event.metadata === "object" ? event.metadata : {},
    createdAt: bucket.updatedAt,
  };

  return { usage: bucket, logEntry };
}

function overageUsd(plan, usage) {
  const limits = plan.limits;
  const runsOver = Math.max(0, usage.workflowRuns - limits.includedWorkflowRunsPerMonth);
  const actionsOver = Math.max(0, usage.agentActions - limits.includedAgentActionsPerMonth);
  const apiOver = Math.max(0, usage.apiUnits - limits.includedApiUnitsPerMonth);
  const dataOver = Math.max(0, usage.dataProcessingGb - limits.includedDataProcessingGbPerMonth);

  return {
    workflowRunsOverage: runsOver,
    agentActionsOverage: actionsOver,
    apiUnitsOverage: apiOver,
    dataGbOverage: dataOver,
    costWorkflowRuns: formatMoney(runsOver * USAGE_RATES.workflowRun),
    costAgentActions: formatMoney((actionsOver / 1000) * USAGE_RATES.agentActionsPer1k),
    costApi: formatMoney(apiOver * USAGE_RATES.apiUnit),
    costData: formatMoney(dataOver * USAGE_RATES.dataProcessingPerGb),
  };
}

function recordAttributedRevenue(tenantId, attributedGrowthUsd) {
  const id = tenantId || "default";
  const prev = revenueAttributionByTenant.get(id) || { monthAttributedUsd: 0 };
  const next = {
    ...prev,
    monthAttributedUsd: formatMoney(prev.monthAttributedUsd + safeNumber(attributedGrowthUsd, 0)),
    updatedAt: new Date().toISOString(),
  };
  revenueAttributionByTenant.set(id, next);
  return next;
}

function calculateCost(tenantId, options = {}) {
  const { planId, plan } = getPlanForTenant(tenantId);
  const usage = { ...ensureUsageBucket(tenantId) };
  const over = overageUsd(plan, usage);

  const usageSubtotal = formatMoney(
    over.costWorkflowRuns + over.costAgentActions + over.costApi + over.costData
  );

  const perfPct = safeNumber(plan.performanceFeePercent, PERFORMANCE_FEE.defaultPercent);
  const attributed = revenueAttributionByTenant.get(tenantId || "default");
  const attributedUsd = safeNumber(attributed?.monthAttributedUsd, 0);
  const performanceFee = formatMoney(Math.max(0, (attributedUsd * perfPct) / 100));

  const subscriptionUsd =
    plan.monthlyPriceUsd > 0 ? plan.monthlyPriceUsd : planId === "enterprise" ? 0 : 0;

  const premiumIntegrationCost = formatMoney(
    safeNumber(usage.premiumIntegrationDays, 0) * USAGE_RATES.premiumConnectorDaily
  );

  const estimatedTotal = formatMoney(
    subscriptionUsd + usageSubtotal + performanceFee + premiumIntegrationCost
  );

  return {
    tenantId: tenantId || "default",
    planId,
    planName: plan.name,
    periodLabel: options.periodLabel || "current_month",
    subscriptionUsd,
    usageBreakdown: {
      included: {
        workflowRuns: plan.limits.includedWorkflowRunsPerMonth,
        agentActions: plan.limits.includedAgentActionsPerMonth,
        apiUnits: plan.limits.includedApiUnitsPerMonth,
        dataGb: plan.limits.includedDataProcessingGbPerMonth,
      },
      actual: {
        workflowRuns: usage.workflowRuns,
        agentActions: usage.agentActions,
        apiUnits: usage.apiUnits,
        dataGb: formatMoney(usage.dataProcessingGb),
      },
      overage: over,
      usageChargesUsd: usageSubtotal,
    },
    performanceFee: {
      percent: perfPct,
      attributedRevenueUsd: attributedUsd,
      feeUsd: performanceFee,
    },
    premiumIntegrationUsd: premiumIntegrationCost,
    estimatedTotalUsd: estimatedTotal,
    rates: USAGE_RATES,
  };
}

function pushBillingHistory(tenantId, entry) {
  const id = tenantId || "default";
  const list = billingHistory.get(id) || [];
  list.unshift({
    id: `bill-${crypto.randomUUID().slice(0, 10)}`,
    ...entry,
    createdAt: new Date().toISOString(),
  });
  billingHistory.set(id, list.slice(0, 100));
}

function attributedValueForDisplay(tenantId) {
  const id = tenantId || "default";
  const manual = revenueAttributionByTenant.get(id);
  if (manual && manual.monthAttributedUsd > 0) {
    return formatMoney(manual.monthAttributedUsd);
  }
  const tm = tenantMetrics.get(id);
  if (tm && safeNumber(tm.revenueImpactUsd, 0) > 0) {
    return formatMoney(tm.revenueImpactUsd);
  }
  return 0;
}

function getBillingSummary(tenantId) {
  const id = tenantId || "default";
  const cost = calculateCost(id);
  const usage = ensureUsageBucket(id);
  const { plan } = getPlanForTenant(id);

  const impliedValueUsd = attributedValueForDisplay(id);

  const spend = cost.estimatedTotalUsd;
  const roiMultiple =
    spend > 0 && impliedValueUsd > 0 ? formatMoney(impliedValueUsd / spend) : null;

  return {
    tenantId: id,
    cost,
    usageMeter: {
      workflowRuns: {
        used: usage.workflowRuns,
        limit: plan.limits.includedWorkflowRunsPerMonth,
        percent: Math.min(
          100,
          Math.round((usage.workflowRuns / Math.max(1, plan.limits.includedWorkflowRunsPerMonth)) * 100)
        ),
      },
      agentActions: {
        used: usage.agentActions,
        limit: plan.limits.includedAgentActionsPerMonth,
        percent: Math.min(
          100,
          Math.round((usage.agentActions / Math.max(1, plan.limits.includedAgentActionsPerMonth)) * 100)
        ),
      },
      apiUnits: {
        used: usage.apiUnits,
        limit: plan.limits.includedApiUnitsPerMonth,
        percent: Math.min(
          100,
          Math.round((usage.apiUnits / Math.max(1, plan.limits.includedApiUnitsPerMonth)) * 100)
        ),
      },
    },
    valueStory: {
      estimatedSpendUsd: spend,
      attributedValueUsd: impliedValueUsd,
      roiMultiple,
      headline:
        impliedValueUsd <= 0
          ? "Add attributed revenue (CRM sync or manual entry) to see performance fees and ROI clearly."
          : roiMultiple && roiMultiple >= 2
            ? `Strong ROI signal: ~${roiMultiple}× value vs spend this period (attributed or modeled impact).`
            : impliedValueUsd > 0 && spend > 0
              ? `You spent ~$${spend} this period vs ~$${impliedValueUsd} in attributed or modeled value.`
              : "Connect revenue attribution to unlock performance-based pricing visibility.",
    },
    transparency: {
      noHiddenFees:
        "Subscription covers included quotas; overages use published meter rates. Performance fee applies only to attributed growth you approve.",
      marketplaceNote: "Creator templates: CCWEB commission is deducted before creator payout (see plan).",
    },
    history: (billingHistory.get(id) || []).slice(0, 12),
  };
}

function costOptimizationHints(tenantId, usage, plan) {
  const hints = [];
  const over = overageUsd(plan, usage);
  if (over.workflowRunsOverage > 50) {
    hints.push({
      severity: "warning",
      code: "high_run_volume",
      title: "Workflow run overage",
      detail: `You are past included runs (${over.workflowRunsOverage} over). Batch stages or upgrade to reduce per-run cost.`,
    });
  }
  if (over.agentActionsOverage > 10000) {
    hints.push({
      severity: "warning",
      code: "agent_action_spike",
      title: "Agent actions accumulating",
      detail: "Consider caching research steps or shortening pipelines to cut redundant actions.",
    });
  }
  if (usage.apiUnits / Math.max(1, usage.workflowRuns) > 400) {
    hints.push({
      severity: "info",
      code: "api_intensity",
      title: "High AI/API intensity per run",
      detail: "Operator recommends consolidating LLM calls into single analysis stages where safe.",
    });
  }
  if (hints.length === 0) {
    hints.push({
      severity: "info",
      code: "healthy",
      title: "Usage within reasonable bounds",
      detail: "Continue monitoring; enable attribution tags for performance-based fee clarity.",
    });
  }
  return hints;
}

module.exports = {
  getPlanForTenant,
  setTenantPlan,
  trackUsage,
  calculateCost,
  getBillingSummary,
  pushBillingHistory,
  costOptimizationHints,
  recordAttributedRevenue,
  ensureUsageBucket,
  attributedValueForDisplay,
};
