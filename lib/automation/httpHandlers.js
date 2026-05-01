const {
  listAgentsCatalog,
  upsertAgentInstance,
  instantiatePipelineFromTemplate,
  analyzeCompatibility,
  solveBusinessProblem,
  executePipelineRun,
  getMonitoringSnapshot,
  listPipelines,
  getTemplates,
} = require("./agentOperator");
const { agents } = require("./store");

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

function handleAutomationAgentsCatalog(res) {
  sendJson(res, 200, { agents: listAgentsCatalog() });
}

function handleAutomationAgentsList(res) {
  const list = Array.from(agents.values());
  sendJson(res, 200, { count: list.length, agents: list });
}

async function handleAutomationAgentsUpsert(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }
  const result = upsertAgentInstance(body);
  if (result.error) {
    sendJson(res, result.status || 400, { error: result.error });
    return;
  }
  sendJson(res, body.id ? 200 : 201, result.agent);
}

function handleAutomationTemplates(res) {
  sendJson(res, 200, { templates: getTemplates() });
}

function handleAutomationPipelines(requestUrl, res) {
  const tenantId = requestUrl.searchParams.get("tenantId") || "";
  sendJson(res, 200, { pipelines: listPipelines(tenantId || undefined) });
}

async function handleAutomationPipelineCreate(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }
  const templateId = (body.templateId || "").toString().trim();
  const result = instantiatePipelineFromTemplate(templateId, body);
  if (result.error) {
    sendJson(res, result.status || 400, { error: result.error });
    return;
  }
  sendJson(res, 201, result.pipeline);
}

async function handleAutomationPipelineRun(pathname, req, res) {
  const match = pathname.match(/^\/api\/automation\/pipelines\/([^/]+)\/run$/);
  const pipelineId = match ? match[1] : null;
  if (!pipelineId) {
    sendJson(res, 404, { error: "Not found." });
    return;
  }
  let body = {};
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }
  const result = executePipelineRun(pipelineId, body);
  if (result.error) {
    sendJson(res, result.status || 400, { error: result.error });
    return;
  }
  sendJson(res, 200, result);
}

async function handleAutomationCompatibility(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }
  const result = analyzeCompatibility(body);
  if (result.error) {
    sendJson(res, result.status || 400, { error: result.error });
    return;
  }
  sendJson(res, 200, result.report);
}

async function handleAutomationSolve(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }
  const result = solveBusinessProblem(body);
  if (result.error) {
    sendJson(res, result.status || 400, { error: result.error });
    return;
  }
  sendJson(res, 200, result);
}

function handleAutomationMonitoring(requestUrl, res) {
  const tenantId = requestUrl.searchParams.get("tenantId") || "default";
  sendJson(res, 200, getMonitoringSnapshot(tenantId));
}

module.exports = {
  handleAutomationAgentsCatalog,
  handleAutomationAgentsList,
  handleAutomationAgentsUpsert,
  handleAutomationTemplates,
  handleAutomationPipelines,
  handleAutomationPipelineCreate,
  handleAutomationPipelineRun,
  handleAutomationCompatibility,
  handleAutomationSolve,
  handleAutomationMonitoring,
};
