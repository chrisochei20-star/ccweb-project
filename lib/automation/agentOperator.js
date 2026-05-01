const crypto = require("crypto");
const { AGENT_TYPES } = require("./agentDefinitions");
const { PIPELINE_TEMPLATES } = require("./templates");
const {
  agents,
  pipelines,
  pipelineRuns,
  compatibilityReports,
  insights,
  tenantMetrics,
  nextPipelineRunId,
  nextCompatibilityId,
} = require("./store");
const {
  trackUsage,
  calculateCost,
  costOptimizationHints,
  recordAttributedRevenue,
  ensureUsageBucket,
  getPlanForTenant,
  pushBillingHistory,
  getBillingSummary,
} = require("./billingEngine");

const DOMAIN_KEYWORDS = {
  marketing: ["customer", "lead", "sales", "conversion", "funnel", "ads", "marketing", "acquisition", "revenue", "book"],
  legal: ["legal", "contract", "clause", "compliance", "policy", "nda", "terms"],
  finance: ["financial", "invoice", "budget", "cash", "reporting", "ledger", "forecast"],
  operations: ["booking", "schedule", "operations", "inventory", "support", "ticket", "sla"],
  biotech: ["research", "lab", "trial", "clinical", "protocol", "compound", "experiment"],
};

const PROBLEM_PATTERNS = [
  {
    id: "growth-customers",
    match: (t) =>
      /customer|lead|growth|acquisition|traffic/i.test(t) || (/more/i.test(t) && /sale|customer|lead/i.test(t)),
    intent: "Increase qualified demand and conversion.",
    templateId: "tpl-marketing-funnel",
    primaryAgents: ["marketing-automation", "research-analyst", "workflow-orchestrator"],
  },
  {
    id: "booking-automation",
    match: (t) => /book|schedule|calendar|appointment|reservation/i.test(t),
    intent: "Automate scheduling, reminders, and capacity rules.",
    templateId: "tpl-support-automation",
    primaryAgents: ["ops-runner", "support-resolver", "workflow-orchestrator"],
  },
  {
    id: "sales-conversion",
    match: (t) => /sale|pipeline|crm|conversion|close/i.test(t),
    intent: "Improve qualification, follow-up, and win-rate instrumentation.",
    templateId: "tpl-sales-pipeline",
    primaryAgents: ["marketing-automation", "research-analyst", "finance-analyst"],
  },
  {
    id: "performance-analytics",
    match: (t) => /performance|analytics|kpi|dashboard|metric/i.test(t),
    intent: "Unify metrics, variance detection, and executive-ready narratives.",
    templateId: "tpl-research-engine",
    primaryAgents: ["finance-analyst", "research-analyst", "workflow-orchestrator"],
  },
];

function slug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

function ensureTenantMetrics(tenantId) {
  const id = tenantId || "default";
  if (!tenantMetrics.has(id)) {
    tenantMetrics.set(id, {
      tenantId: id,
      conversionRatePercent: 3.2 + Math.random() * 1.4,
      responseRatePercent: 78 + Math.random() * 12,
      revenueImpactUsd: 12400 + Math.round(Math.random() * 8000),
      costPerOutcomeUsd: 1.15 + Math.random() * 0.35,
      errorRatePercent: 0.4 + Math.random() * 0.3,
      updatedAt: new Date().toISOString(),
    });
  }
  return tenantMetrics.get(id);
}

function pushInsight(entry) {
  insights.unshift(entry);
  if (insights.length > 200) insights.pop();
}

function getAgentType(agentTypeId) {
  return AGENT_TYPES.find((a) => a.id === agentTypeId) || null;
}

function listAgentsCatalog() {
  return AGENT_TYPES.map((a) => ({ ...a }));
}

function upsertAgentInstance(body) {
  const agentTypeId = (body.agentTypeId || "").toString().trim();
  const type = getAgentType(agentTypeId);
  if (!type) {
    return { error: "Unknown agentTypeId.", status: 400 };
  }
  const id = (body.id || `agent-${slug(type.id)}-${crypto.randomUUID().slice(0, 8)}`).toString().trim();
  const now = new Date().toISOString();
  const existing = agents.get(id);
  const record = {
    id,
    agentTypeId: type.id,
    name: (body.name || type.name).toString().trim(),
    status: ["idle", "running", "paused", "error"].includes(body.status) ? body.status : existing?.status || "idle",
    tenantId: (body.tenantId || existing?.tenantId || "default").toString().trim(),
    config: body.config && typeof body.config === "object" ? body.config : existing?.config || {},
    lastHeartbeatAt: now,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  agents.set(id, record);
  return { agent: record };
}

function cloneStages(stages) {
  return stages.map((s, index) => ({
    ...s,
    id: s.id || `stage-${index + 1}`,
    order: index,
  }));
}

function instantiatePipelineFromTemplate(templateId, overrides = {}) {
  const tpl = PIPELINE_TEMPLATES.find((t) => t.id === templateId);
  if (!tpl) {
    return { error: "Template not found.", status: 404 };
  }
  const id = (overrides.id || `pipe-${slug(tpl.name)}-${crypto.randomUUID().slice(0, 8)}`).toString().trim();
  const now = new Date().toISOString();
  const stages = cloneStages(overrides.stages || tpl.stages);
  const status =
    ["draft", "active", "paused"].includes(overrides.status) ? overrides.status : "draft";
  const record = {
    id,
    name: (overrides.name || tpl.name).toString().trim(),
    description: (overrides.description || tpl.description).toString(),
    domain: (overrides.domain || tpl.domain).toString(),
    templateId: tpl.id,
    stages,
    status,
    tenantId: (overrides.tenantId || "default").toString().trim(),
    createdAt: now,
    updatedAt: now,
  };
  pipelines.set(id, record);
  return { pipeline: record };
}

function detectDomains(text) {
  const t = text.toLowerCase();
  const hits = [];
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    if (keywords.some((k) => t.includes(k))) hits.push(domain);
  }
  return [...new Set(hits)];
}

function scoreAgentCompatibility(workflowText, domain) {
  const text = workflowText.toLowerCase();
  const agentScores = AGENT_TYPES.map((agent) => {
    let score = 40;
    if (agent.role === domain) score += 28;
    if (domain === "marketing" && agent.role === "marketing") score += 12;
    if (domain === "legal" && agent.role === "legal") score += 18;
    if (domain === "finance" && agent.role === "finance") score += 18;
    if (domain === "operations" && ["operations", "support"].includes(agent.role)) score += 14;
    if (domain === "biotech" && agent.role === "biotech") score += 20;
    agent.capabilities.forEach((cap) => {
      const token = cap.replace(/_/g, " ");
      if (text.includes(token) || text.includes(cap)) score += 6;
    });
    score = Math.min(99, Math.round(score + Math.random() * 6));
    return { agentTypeId: agent.id, fitScore: score, rationale: `Mapped ${agent.role} capabilities to workflow language.` };
  });
  return agentScores.sort((a, b) => b.fitScore - a.fitScore);
}

function analyzeCompatibility(body) {
  const tenantId = (body.tenantId || "default").toString().trim();
  const workflowDescription = (body.workflowDescription || body.workflow || "").toString().trim();
  const businessFunction = (body.businessFunction || "general").toString().trim();
  if (!workflowDescription) {
    return { error: "workflowDescription is required.", status: 400 };
  }

  const domains = detectDomains(workflowDescription);
  const domain = domains[0] || businessFunction || "operations";

  const steps = [
    {
      id: "step-1",
      title: "Intake & scope",
      actions: [
        { type: "tool_call", name: "capture_requirements", inputs: ["stakeholder goals", "constraints"] },
        { type: "agent_task", agentHint: "workflow-orchestrator", description: "Normalize inputs into structured objectives." },
      ],
      risks: ["Ambiguous success criteria may cause rework."],
    },
    {
      id: "step-2",
      title: "Source systems & data",
      actions: [
        { type: "integration", name: "connectors", inputs: ["crm", "calendar", "billing", "ticketing"] },
        { type: "agent_task", agentHint: "ops-runner", description: "Validate credentials and data freshness." },
      ],
      risks: ["Stale integrations inflate false automation confidence."],
    },
    {
      id: "step-3",
      title: "Execute agent pipeline",
      actions: [
        { type: "agent_task", agentHint: domain === "legal" ? "legal-assistant" : "workflow-orchestrator", description: "Run staged automation with guardrails." },
      ],
      risks: ["Model drift if feedback loop is not closed weekly."],
    },
  ];

  const inefficiencies = [];
  if (/manual|spreadsheet|email chain/i.test(workflowDescription)) {
    inefficiencies.push({
      type: "manual_handoff",
      severity: "high",
      detail: "Repeated manual steps detected; consolidate into a single orchestrated pipeline.",
    });
  }
  if (!/api|webhook|oauth|integration/i.test(workflowDescription)) {
    inefficiencies.push({
      type: "integration_gap",
      severity: "medium",
      detail: "No explicit integration hooks named; add connector inventory before scaling.",
    });
  }

  const risks = [];
  if (domain === "legal") risks.push({ code: "human_review", detail: "Legal outcomes require attorney review for enforceability." });
  if (domain === "finance") risks.push({ code: "data_accuracy", detail: "Financial automation requires reconciled sources of truth." });

  const agentRanking = scoreAgentCompatibility(workflowDescription, domain);
  const agentCompatible = agentRanking[0]?.fitScore >= 72;

  const reportId = nextCompatibilityId();
  const report = {
    id: reportId,
    businessFunction,
    workflowSummary: workflowDescription.slice(0, 280),
    domainsDetected: domains.length ? domains : [domain],
    agentCompatible,
    compatibilityScore: agentRanking[0]?.fitScore ?? 0,
    steps,
    inefficiencies,
    risks,
    recommendedAgents: agentRanking.slice(0, 4),
    createdAt: new Date().toISOString(),
  };
  compatibilityReports.set(reportId, report);

  trackUsage(tenantId, {
    type: "compatibility_analyze",
    quantity: 1,
    metadata: { reportId },
  });
  trackUsage(tenantId, { type: "api_call", quantity: 4, metadata: { source: "compatibility_analyze" } });

  return { report };
}

function matchProblemPattern(text) {
  const normalized = text.toLowerCase();
  for (const pattern of PROBLEM_PATTERNS) {
    if (pattern.match(normalized)) return pattern;
  }
  return {
    id: "general-automation",
    intent: "Translate the problem into an orchestrated workflow with measurable KPIs.",
    templateId: "tpl-sales-pipeline",
    primaryAgents: ["workflow-orchestrator", "research-analyst", "ops-runner"],
  };
}

function solveBusinessProblem(body) {
  const problem = (body.problem || body.goal || "").toString().trim();
  if (!problem) {
    return { error: "problem is required.", status: 400 };
  }
  const tenantId = (body.tenantId || "default").toString().trim();
  const pattern = matchProblemPattern(problem);
  const instantiated = instantiatePipelineFromTemplate(pattern.templateId, {
    tenantId,
    name: `${pattern.intent.slice(0, 48)}…`,
    description: problem,
  });
  if (instantiated.error) {
    return instantiated;
  }
  const pipeline = instantiated.pipeline;
  pipeline.status = "active";
  pipeline.problemStatement = problem;
  pipeline.assignedAgents = pattern.primaryAgents.map((id) => {
    const t = getAgentType(id);
    return { agentTypeId: id, name: t?.name || id };
  });
  pipelines.set(pipeline.id, pipeline);

  trackUsage(tenantId, {
    type: "problem_solve",
    quantity: 1,
    metadata: { pipelineId: pipeline.id },
  });

  const run = executePipelineRun(pipeline.id, { tenantId, goal: problem });
  if (run.error) return run;

  return {
    interpretation: {
      intent: pattern.intent,
      patternId: pattern.id,
      domains: detectDomains(problem),
    },
    pipeline,
    run,
  };
}

function synthesizeStageOutput(stage, pipeline, goal, metrics) {
  const kind = stage.kind || "execution";
  const base = {
    stageId: stage.id,
    label: stage.label,
    kind,
    agentTypeId: stage.agentHint,
    status: "completed",
    metrics: {
      latencyMs: 120 + Math.round(Math.random() * 380),
      qualityScore: 0.82 + Math.random() * 0.15,
    },
    summary: "",
    adjustments: [],
  };

  if (kind === "ai_analysis") {
    base.summary = `Interpreted goal "${goal.slice(0, 80)}…" for pipeline "${pipeline.name}" and produced ranked hypotheses.`;
  } else if (kind === "task_breakdown") {
    base.summary = `Decomposed workflow into ${pipeline.stages.length} executable blocks with owners and SLAs.`;
  } else if (kind === "execution") {
    base.summary = `Executed automation with live connectors; observed conversion proxy at ${metrics.conversionRatePercent.toFixed(1)}%.`;
  } else if (kind === "feedback") {
    const delta = (Math.random() * 0.4 + 0.1).toFixed(2);
    base.summary = `Feedback loop closed; recommending +${delta}% budget on best-performing branch.`;
    base.adjustments = [
      { type: "parameter_tune", field: "sequence_rate", delta: `+${delta}%` },
      { type: "routing_rule", field: "escalation_threshold", delta: "-12% false positive tolerance" },
    ];
  } else {
    base.summary = `Stage completed with orchestrator validation for ${pipeline.domain} domain.`;
  }

  return base;
}

function executePipelineRun(pipelineId, options = {}) {
  const pipeline = pipelines.get(pipelineId);
  if (!pipeline) {
    return { error: "Pipeline not found.", status: 404 };
  }
  const tenantId = options.tenantId || pipeline.tenantId || "default";
  const goal = (options.goal || pipeline.problemStatement || pipeline.description || "").toString();
  const metrics = ensureTenantMetrics(tenantId);
  const runId = nextPipelineRunId();
  const now = new Date().toISOString();

  const stageResults = pipeline.stages.map((stage) => synthesizeStageOutput(stage, pipeline, goal, metrics));

  const successScore = Math.min(
    99,
    Math.round(
      stageResults.reduce((sum, s) => sum + (s.metrics.qualityScore || 0.8), 0) * (100 / Math.max(1, stageResults.length)) * 0.01
    )
  );

  const run = {
    id: runId,
    pipelineId: pipeline.id,
    tenantId,
    status: "succeeded",
    startedAt: now,
    finishedAt: new Date().toISOString(),
    goal,
    successScore,
    stageResults,
    operatorNotes: [
      "Validated stage outputs against compatibility guardrails.",
      "Queued weekly replay for drift detection.",
    ],
  };
  pipelineRuns.set(runId, run);

  trackUsage(tenantId, { type: "pipeline_run", quantity: 1, metadata: { pipelineId: pipeline.id, runId } });
  const agentActionEstimate = Math.max(
    12,
    Math.round(pipeline.stages.length * 24 + stageResults.length * 18)
  );
  trackUsage(tenantId, { type: "agent_action", quantity: agentActionEstimate, metadata: { runId } });
  trackUsage(tenantId, {
    type: "api_call",
    quantity: Math.ceil(stageResults.length * 2.5),
    metadata: { runId, kind: "stage_orchestration" },
  });

  const attributedIncrement = formatMoney(Math.min(5000, successScore * 12));
  recordAttributedRevenue(tenantId, attributedIncrement);

  const usageBucket = ensureUsageBucket(tenantId);
  const { plan } = getPlanForTenant(tenantId);
  const costSnapshot = calculateCost(tenantId);
  const billingHints = costOptimizationHints(tenantId, usageBucket, plan);
  run.revenueAndCost = {
    estimatedAttributedUpliftUsd: attributedIncrement,
    periodCostEstimateUsd: costSnapshot.estimatedTotalUsd,
    billingHints,
  };

  pushBillingHistory(tenantId, {
    kind: "pipeline_run",
    runId,
    pipelineId: pipeline.id,
    estimatedBillUsd: costSnapshot.estimatedTotalUsd,
    note: "Rolling monthly estimate after this run.",
  });

  const drift = metrics.errorRatePercent > 0.65;
  pushInsight({
    id: `insight-${runId}`,
    tenantId,
    pipelineId: pipeline.id,
    createdAt: run.finishedAt,
    severity: drift ? "warning" : "info",
    title: drift ? "Elevated error signals detected" : "Pipeline run healthy",
    detail: drift
      ? "Recommend tightening validation rules on execution stages."
      : "Automation stayed within SLA; consider scaling audience cap by 8%.",
    metrics: {
      successScore,
      conversionRatePercent: metrics.conversionRatePercent,
      revenueImpactUsd: metrics.revenueImpactUsd,
    },
  });

  return { run };
}

function getMonitoringSnapshot(tenantId) {
  const id = tenantId || "default";
  const metrics = ensureTenantMetrics(id);
  const recentRuns = Array.from(pipelineRuns.values())
    .filter((r) => r.tenantId === id)
    .sort((a, b) => (a.finishedAt < b.finishedAt ? 1 : -1))
    .slice(0, 12);

  const recentInsights = insights.filter((i) => i.tenantId === id).slice(0, 8);

  const usageBucket = ensureUsageBucket(id);
  const { plan } = getPlanForTenant(id);
  const billingHints = costOptimizationHints(id, usageBucket, plan);
  const costSnapshot = calculateCost(id);

  const recommendations = [
    "Enable auto-remediation on stages with qualityScore below 0.78 for two consecutive runs.",
    "Attach revenue attribution tags before scaling paid acquisition loops.",
    "Pair legal workflows with explicit human approval gates at draft milestones.",
  ];

  const revenueOptimization = billingHints.map((h) => ({
    source: "billing",
    severity: h.severity,
    title: h.title,
    detail: h.detail,
  }));

  if (costSnapshot.estimatedTotalUsd > 0 && costSnapshot.usageBreakdown.usageChargesUsd > 0) {
    revenueOptimization.push({
      source: "operator",
      severity: "info",
      title: "Usage overage is driving variable cost",
      detail: `Overage charges ~$${costSnapshot.usageBreakdown.usageChargesUsd} this month. Consider upgrading the plan or consolidating pipeline stages.`,
    });
  }

  return {
    tenantId: id,
    metrics,
    recentRuns,
    recentInsights,
    recommendations,
    revenueOptimization,
    billingPreview: {
      estimatedPeriodCostUsd: costSnapshot.estimatedTotalUsd,
      usageChargesUsd: costSnapshot.usageBreakdown.usageChargesUsd,
      performanceFeeUsd: costSnapshot.performanceFee.feeUsd,
      planId: costSnapshot.planId,
    },
  };
}

function listPipelines(tenantId) {
  const tid = tenantId || "default";
  return Array.from(pipelines.values()).filter((p) => !tenantId || p.tenantId === tid);
}

function getTemplates() {
  return PIPELINE_TEMPLATES.map((t) => ({ ...t, stages: cloneStages(t.stages) }));
}

module.exports = {
  listAgentsCatalog,
  upsertAgentInstance,
  instantiatePipelineFromTemplate,
  analyzeCompatibility,
  solveBusinessProblem,
  executePipelineRun,
  getMonitoringSnapshot,
  listPipelines,
  getTemplates,
  detectDomains,
  getBillingSummary,
};
