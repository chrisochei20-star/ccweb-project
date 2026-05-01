/**
 * In-memory persistence for the Automation Hub.
 * Swap this module for MongoDB (mongoose) or PostgreSQL (pg/knex) in production.
 */

const agents = new Map();
const pipelines = new Map();
const pipelineRuns = new Map();
const compatibilityReports = new Map();
const insights = [];
const tenantMetrics = new Map();
const usageByTenant = new Map();
const billingHistory = new Map();
const tenantPlans = new Map();
const revenueAttributionByTenant = new Map();

let nextRunId = 1;
let nextReportId = 1;

function nextPipelineRunId() {
  return `run-${String(nextRunId++).padStart(5, "0")}`;
}

function nextCompatibilityId() {
  return `compat-${String(nextReportId++).padStart(5, "0")}`;
}

module.exports = {
  agents,
  pipelines,
  pipelineRuns,
  compatibilityReports,
  insights,
  tenantMetrics,
  usageByTenant,
  billingHistory,
  tenantPlans,
  revenueAttributionByTenant,
  nextPipelineRunId,
  nextCompatibilityId,
};
