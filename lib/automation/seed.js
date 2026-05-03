const { AGENT_TYPES } = require("./agentDefinitions");
const { upsertAgentInstance, instantiatePipelineFromTemplate } = require("./agentOperator");

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
}

module.exports = { seedAutomationHub };
