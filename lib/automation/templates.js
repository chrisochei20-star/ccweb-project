/**
 * Prebuilt pipeline templates for common business automation patterns.
 */

module.exports.PIPELINE_TEMPLATES = [
  {
    id: "tpl-marketing-funnel",
    name: "Marketing funnel",
    description: "Capture leads, nurture sequences, and conversion experiments.",
    domain: "marketing",
    stages: [
      { id: "s1", label: "Input", kind: "trigger", agentHint: "workflow-orchestrator" },
      { id: "s2", label: "Audience & offer analysis", kind: "ai_analysis", agentHint: "market-research" },
      { id: "s3", label: "Campaign & sequence build", kind: "task_breakdown", agentHint: "marketing-automation" },
      { id: "s4", label: "Launch & monitor", kind: "execution", agentHint: "marketing-automation" },
      { id: "s5", label: "Feedback & optimize", kind: "feedback", agentHint: "workflow-orchestrator" },
    ],
  },
  {
    id: "tpl-support-automation",
    name: "Customer support automation",
    description: "Intent routing, knowledge answers, and escalation with SLA tracking.",
    domain: "operations",
    stages: [
      { id: "s1", label: "Inbound channel", kind: "trigger", agentHint: "workflow-orchestrator" },
      { id: "s2", label: "Classify & prioritize", kind: "ai_analysis", agentHint: "support-resolver" },
      { id: "s3", label: "Resolve or escalate", kind: "execution", agentHint: "support-resolver" },
      { id: "s4", label: "CSAT & coaching loop", kind: "feedback", agentHint: "workflow-orchestrator" },
    ],
  },
  {
    id: "tpl-sales-pipeline",
    name: "Sales pipeline",
    description: "Qualify leads, book meetings, and sync CRM outcomes.",
    domain: "marketing",
    stages: [
      { id: "s1", label: "Lead intake", kind: "trigger", agentHint: "workflow-orchestrator" },
      { id: "s2", label: "ICP fit scoring", kind: "ai_analysis", agentHint: "market-research" },
      { id: "s3", label: "Sequences & tasks", kind: "task_breakdown", agentHint: "marketing-automation" },
      { id: "s4", label: "Outreach execution", kind: "execution", agentHint: "ops-runner" },
      { id: "s5", label: "Pipeline analytics", kind: "feedback", agentHint: "finance-analyst" },
    ],
  },
  {
    id: "tpl-research-engine",
    name: "Research engine",
    description: "Continuous scans of markets, competitors, and emerging signals.",
    domain: "biotech",
    stages: [
      { id: "s1", label: "Research brief", kind: "trigger", agentHint: "workflow-orchestrator" },
      { id: "s2", label: "Source & synthesize", kind: "ai_analysis", agentHint: "market-research" },
      { id: "s3", label: "Structured insights", kind: "task_breakdown", agentHint: "bio-research" },
      { id: "s4", label: "Deliver & alert", kind: "execution", agentHint: "workflow-orchestrator" },
      { id: "s5", label: "Weekly refinement", kind: "feedback", agentHint: "market-research" },
    ],
  },
];
