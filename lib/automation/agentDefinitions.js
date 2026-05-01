/**
 * Seed agent catalog — modular roles for the Agent Operator.
 */

module.exports.AGENT_TYPES = [
  {
    id: "market-research",
    name: "Market Research Analyst",
    role: "research",
    capabilities: ["web_scrape", "summarize", "competitor_map", "trend_scan", "signal_digest"],
    costTier: "low",
    schedule: "continuous",
  },
  {
    id: "workflow-orchestrator",
    name: "Workflow Orchestrator",
    role: "orchestration",
    capabilities: ["branch", "merge", "retry", "human_handoff"],
    costTier: "low",
    schedule: "on_demand",
  },
  {
    id: "marketing-automation",
    name: "Growth & Marketing Agent",
    role: "marketing",
    capabilities: ["email_sequence", "segment", "ab_test", "landing_optimize"],
    costTier: "medium",
    schedule: "continuous",
  },
  {
    id: "legal-assistant",
    name: "Legal Document Agent",
    role: "legal",
    capabilities: ["draft_review", "clause_extract", "compliance_check", "redline"],
    costTier: "medium",
    schedule: "on_demand",
  },
  {
    id: "finance-analyst",
    name: "Financial Ops Agent",
    role: "finance",
    capabilities: ["ledger_sync", "report", "forecast", "variance_alert"],
    costTier: "medium",
    schedule: "scheduled",
  },
  {
    id: "ops-runner",
    name: "Business Operations Agent",
    role: "operations",
    capabilities: ["ticket_route", "inventory_sync", "sla_watch", "booking_flow"],
    costTier: "low",
    schedule: "continuous",
  },
  {
    id: "bio-research",
    name: "Research Lab Agent",
    role: "biotech",
    capabilities: ["literature_review", "protocol_parse", "data_pipeline", "hypothesis_track"],
    costTier: "high",
    schedule: "continuous",
  },
  {
    id: "support-resolver",
    name: "Customer Support Agent",
    role: "support",
    capabilities: ["intent_classify", "kb_answer", "escalate", "csat_loop"],
    costTier: "low",
    schedule: "continuous",
  },
];
