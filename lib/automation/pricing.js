/**
 * Transparent CCWEB Automation monetization — simple rates and tier limits.
 * Tune constants for production; all numbers are exposed via API for the UI.
 */

const SUBSCRIPTION_PLANS = {
  free: {
    id: "free",
    name: "Free",
    monthlyPriceUsd: 0,
    limits: {
      maxActiveAgents: 2,
      maxActiveWorkflows: 3,
      includedWorkflowRunsPerMonth: 50,
      includedAgentActionsPerMonth: 5000,
      includedApiUnitsPerMonth: 2000,
      includedDataProcessingGbPerMonth: 1,
    },
    features: ["Community templates", "Standard queue", "Email support"],
    performanceFeePercent: 0,
    marketplaceListingFeePercent: 15,
    premiumIntegrationFeeUsd: 0,
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyPriceUsd: 149,
    limits: {
      maxActiveAgents: 12,
      maxActiveWorkflows: 25,
      includedWorkflowRunsPerMonth: 800,
      includedAgentActionsPerMonth: 80000,
      includedApiUnitsPerMonth: 40000,
      includedDataProcessingGbPerMonth: 25,
    },
    features: ["Advanced analytics", "Priority processing", "ROI dashboard", "API webhooks"],
    performanceFeePercent: 5,
    marketplaceListingFeePercent: 12,
    premiumIntegrationFeeUsd: 49,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    monthlyPriceUsd: 0,
    limits: {
      maxActiveAgents: 999,
      maxActiveWorkflows: 999,
      includedWorkflowRunsPerMonth: 999999,
      includedAgentActionsPerMonth: 999999999,
      includedApiUnitsPerMonth: 999999999,
      includedDataProcessingGbPerMonth: 9999,
    },
    features: ["Custom integrations", "Dedicated capacity", "Volume discounts", "SSO & audit"],
    performanceFeePercent: 3,
    marketplaceListingFeePercent: 8,
    premiumIntegrationFeeUsd: 0,
    contactSales: true,
  },
};

/** Pay-as-you-go overage (USD) — shown on pricing page */
const USAGE_RATES = {
  agentActionsPer1k: 0.18,
  workflowRun: 0.06,
  apiUnit: 0.0008,
  dataProcessingPerGb: 0.35,
  premiumConnectorDaily: 2.5,
};

const PERFORMANCE_FEE = {
  /** Default % of attributed uplift when plan does not override */
  defaultPercent: 5,
  minBillUsd: 25,
};

const MARKETPLACE = {
  ccwebCommissionPercent: 12,
};

module.exports = {
  SUBSCRIPTION_PLANS,
  USAGE_RATES,
  PERFORMANCE_FEE,
  MARKETPLACE,
};
