const {
  createLeadCampaign,
  runLeadCampaignWorkflow,
  listLeadCampaigns,
  getLeadCampaign,
  getContactsForCampaign,
  getLeadEvents,
  getLeadGenDashboard,
} = require("./leadGenEngine");

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

async function handleLeadGenCampaignsCreate(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }
  const result = createLeadCampaign(body);
  if (result.error) {
    sendJson(res, result.status || 400, { error: result.error });
    return;
  }
  sendJson(res, 201, result.campaign);
}

function handleLeadGenCampaignsList(requestUrl, res) {
  const tenantId = requestUrl.searchParams.get("tenantId") || "default";
  sendJson(res, 200, { campaigns: listLeadCampaigns(tenantId) });
}

function handleLeadGenCampaignGet(pathname, res) {
  const match = pathname.match(/^\/api\/automation\/lead-gen\/campaigns\/([^/]+)$/);
  const id = match ? match[1] : null;
  if (!id) {
    sendJson(res, 404, { error: "Not found." });
    return;
  }
  const campaign = getLeadCampaign(id);
  if (!campaign) {
    sendJson(res, 404, { error: "Campaign not found." });
    return;
  }
  sendJson(res, 200, {
    campaign,
    contacts: getContactsForCampaign(id),
  });
}

async function handleLeadGenCampaignRun(pathname, req, res) {
  const match = pathname.match(/^\/api\/automation\/lead-gen\/campaigns\/([^/]+)\/run$/);
  const campaignId = match ? match[1] : null;
  if (!campaignId) {
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
  const tenantId = (body.tenantId || "default").toString().trim();
  const result = runLeadCampaignWorkflow(campaignId, tenantId, body);
  if (result.error) {
    sendJson(res, result.status || 400, { error: result.error });
    return;
  }
  sendJson(res, 200, result);
}

function handleLeadGenEvents(requestUrl, res) {
  const tenantId = requestUrl.searchParams.get("tenantId") || null;
  const campaignId = requestUrl.searchParams.get("campaignId") || null;
  sendJson(res, 200, { events: getLeadEvents(tenantId, campaignId) });
}

module.exports = {
  handleLeadGenCampaignsCreate,
  handleLeadGenCampaignsList,
  handleLeadGenCampaignGet,
  handleLeadGenCampaignRun,
  handleLeadGenDashboard,
  handleLeadGenEvents,
};
