const { trackUsage, recordAttributedRevenue } = require("./billingEngine");

function seedAutomationHub() {
  AGENT_TYPES.slice(0, 5).forEach((type, index) => {
    upsertAgentInstance({
      id: `seed-agent-${type.id}`,
      agentTypeId: type.id,
      name: `${type.name} (demo)`,
      status: index % 2 === 0 ? "running" : "idle",
      tenantId: "default",
      config: { demo: true },
    });
  });
  const { pipeline } = instantiatePipelineFromTemplate("tpl-marketing-funnel", {
    id: "seed-pipeline-marketing",
    tenantId: "default",
    name: "Demo — nurture funnel",
    status: "active",
  });
  if (pipeline) {
    pipeline.problemStatement = "Demo: grow webinar signups with automated nurture.";
    require("./store").pipelines.set(pipeline.id, pipeline);
  }

  trackUsage("default", { type: "pipeline_run", quantity: 12, metadata: { source: "seed" } });
  trackUsage("default", { type: "agent_action", quantity: 4800, metadata: { source: "seed" } });
  trackUsage("default", { type: "api_call", quantity: 900, metadata: { source: "seed" } });
  recordAttributedRevenue("default", 5200);
}

module.exports = { seedAutomationHub };
