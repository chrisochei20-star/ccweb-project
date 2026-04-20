const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3000);
const PLATFORM_FEE_RATE = 0.08;
const deals = new Map();
let nextDealId = 1;

const sampleBusinesses = [
  { name: "Bluebird Dental Studio", city: "London", country: "UK", category: "Dental Clinic", rating: 4.1, reviewCount: 214, website: "https://bluebirddental.example" },
  { name: "Harborview Fitness", city: "Sydney", country: "Australia", category: "Gym", rating: 3.8, reviewCount: 189, website: "https://harborviewfitness.example" },
  { name: "Nova Skin & Laser", city: "Toronto", country: "Canada", category: "Med Spa", rating: 4.0, reviewCount: 132, website: "https://novaskinlaser.example" },
  { name: "Alta Family Law", city: "New York", country: "USA", category: "Law Firm", rating: 3.7, reviewCount: 90, website: "https://altafamilylaw.example" },
  { name: "Greenfield Vet Care", city: "Berlin", country: "Germany", category: "Veterinary Clinic", rating: 4.4, reviewCount: 166, website: "https://greenfieldvet.example" },
  { name: "Cedar & Spice Bistro", city: "Dubai", country: "UAE", category: "Restaurant", rating: 3.9, reviewCount: 248, website: "https://cedarspice.example" },
  { name: "Orbit Auto Repair", city: "Johannesburg", country: "South Africa", category: "Auto Service", rating: 3.6, reviewCount: 121, website: "https://orbitautorepair.example" },
  { name: "Sakura Smile Studio", city: "Tokyo", country: "Japan", category: "Dental Clinic", rating: 4.3, reviewCount: 304, website: "https://sakurasmile.example" },
];

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

async function serveFile(filePath, res) {
  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Internal server error");
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatMoney(value) {
  return Number(value.toFixed(2));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString("utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("INVALID_JSON");
  }
}

function buildProblemCards(business) {
  const rating = safeNumber(business.rating, 4.0);
  const reviewCount = safeNumber(business.reviewCount, 100);
  const responseRate = safeNumber(business.responseRate, 35);
  const missingDirectories = safeNumber(business.missingDirectories, 3);
  const averageReplyHours = safeNumber(business.averageReplyHours, 24);
  const websiteScore = safeNumber(business.websiteScore, 58);

  return [
    {
      title: "Review Sentiment Drift",
      finding: `Average rating is ${rating.toFixed(1)} across ${reviewCount} reviews with recurring service-delay complaints.`,
      impact: "Trust drop lowers conversion from local search visitors.",
      fix: "Deploy weekly review-response playbook and escalation tags.",
    },
    {
      title: "Low Owner Response Coverage",
      finding: `Only ${responseRate}% of reviews have owner replies.`,
      impact: "Prospects interpret silence as weak customer care.",
      fix: "Set 24-hour response SLA with AI-assisted drafts.",
    },
    {
      title: "Directory Consistency Gaps",
      finding: `${missingDirectories} high-intent directories show inconsistent profile data.`,
      impact: "Ranking authority and map visibility are diluted.",
      fix: "Publish synchronized NAP and service metadata across listings.",
    },
    {
      title: "Slow Lead Follow-up",
      finding: `Average response time to enquiries is ${averageReplyHours} hours.`,
      impact: "Hot leads convert to competitors before contact.",
      fix: "Trigger automated lead routing with same-day callback queue.",
    },
    {
      title: "Website Conversion Friction",
      finding: `Estimated website conversion score is ${websiteScore}/100 with weak CTA placement.`,
      impact: "Traffic does not convert into booked calls or visits.",
      fix: "Restructure CTA hierarchy and add proof-rich landing sections.",
    },
    {
      title: "Offer Positioning Is Generic",
      finding: "Online messaging lacks differentiated value proposition by audience segment.",
      impact: "Competing providers appear similar on price and quality.",
      fix: "Rebuild service pages around outcomes, guarantees, and niches.",
    },
  ];
}

function handleSearch(url, res) {
  const city = (url.searchParams.get("city") || "").trim().toLowerCase();
  const query = (url.searchParams.get("query") || "").trim().toLowerCase();

  const results = sampleBusinesses.filter((business) => {
    const cityMatch = city ? business.city.toLowerCase().includes(city) : true;
    const queryMatch = query
      ? `${business.name} ${business.category}`.toLowerCase().includes(query)
      : true;
    return cityMatch && queryMatch;
  });

  sendJson(res, 200, {
    mode: "google-maps-ai-search",
    city: city || "any",
    query: query || "any",
    count: results.length,
    results,
  });
}

async function handleAnalyze(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  const businessName = (body.businessName || "Selected business").toString();
  const city = (body.city || "Unknown city").toString();
  const category = (body.category || "Local business").toString();

  const cards = buildProblemCards(body);

  sendJson(res, 200, {
    analyzer: "claude-online-presence-analyzer",
    business: { businessName, city, category },
    cards,
  });
}

async function handleCreateDeal(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  const clientName = (body.clientName || "").toString().trim();
  const applicantName = (body.applicantName || "").toString().trim();
  const proposalText = (body.proposalText || "").toString().trim();
  const dealValue = safeNumber(body.dealValue, 0);

  if (!clientName || !applicantName || !proposalText || dealValue <= 0) {
    sendJson(res, 400, {
      error: "clientName, applicantName, proposalText and positive dealValue are required.",
    });
    return;
  }

  const platformFee = formatMoney(dealValue * PLATFORM_FEE_RATE);
  const applicantPayout = formatMoney(dealValue - platformFee);
  const id = String(nextDealId++);

  const deal = {
    id,
    clientName,
    applicantName,
    proposalText,
    dealValue: formatMoney(dealValue),
    platformFee,
    applicantPayout,
    feeRatePercent: PLATFORM_FEE_RATE * 100,
    status: "funded_in_ccweb_escrow",
    createdAt: new Date().toISOString(),
    releasedAt: null,
  };

  deals.set(id, deal);
  sendJson(res, 201, deal);
}

function handleConfirmDeal(urlPath, res) {
  const match = urlPath.match(/^\/api\/deals\/([^/]+)\/confirm$/);
  if (!match) {
    sendJson(res, 404, { error: "Deal route not found." });
    return;
  }

  const dealId = match[1];
  const deal = deals.get(dealId);

  if (!deal) {
    sendJson(res, 404, { error: "Deal not found." });
    return;
  }

  if (deal.status === "released_to_applicant") {
    sendJson(res, 200, deal);
    return;
  }

  deal.status = "released_to_applicant";
  deal.releasedAt = new Date().toISOString();
  deals.set(dealId, deal);
  sendJson(res, 200, deal);
}

function handleGetDeal(urlPath, res) {
  const match = urlPath.match(/^\/api\/deals\/([^/]+)$/);
  if (!match) {
    sendJson(res, 404, { error: "Deal route not found." });
    return;
  }

  const deal = deals.get(match[1]);
  if (!deal) {
    sendJson(res, 404, { error: "Deal not found." });
    return;
  }

  sendJson(res, 200, deal);
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 400, { error: "Invalid request URL." });
    return;
  }

  const requestUrl = new URL(req.url, `http://localhost:${PORT}`);
  const { pathname } = requestUrl;

  if (pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (pathname === "/api/maps-search" && req.method === "GET") {
    handleSearch(requestUrl, res);
    return;
  }

  if (pathname === "/api/analyze" && req.method === "POST") {
    await handleAnalyze(req, res);
    return;
  }

  if (pathname === "/api/deals" && req.method === "POST") {
    await handleCreateDeal(req, res);
    return;
  }

  if (pathname.match(/^\/api\/deals\/[^/]+\/confirm$/) && req.method === "POST") {
    handleConfirmDeal(pathname, res);
    return;
  }

  if (pathname.match(/^\/api\/deals\/[^/]+$/) && req.method === "GET") {
    handleGetDeal(pathname, res);
    return;
  }

  const urlPath =
    pathname === "/"
      ? "/index.html"
      : pathname === "/about"
      ? "/about.html"
      : pathname === "/app"
      ? "/app.html"
      : pathname;
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(__dirname, "public", safePath);
  await serveFile(filePath, res);
});

server.listen(PORT, () => {
  console.log(`ccweb-project app running on http://localhost:${PORT}`);
});
