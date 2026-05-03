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
  nextPipelineRunId,
  nextCompatibilityId,
};
