const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3000);
const PLATFORM_FEE_RATE = 0.08;
const deals = new Map();
let nextDealId = 1;

const sampleBusinesses = [
  {
    id: "biz-ldn-1",
    name: "Bluebird Dental Studio",
    city: "London",
    country: "UK",
    category: "Dental Clinic",
    rating: 4.1,
    reviewCount: 214,
    responseRate: 42,
    missingDirectories: 2,
    averageReplyHours: 14,
    websiteScore: 66,
    website: "https://bluebirddental.example",
  },
  {
    id: "biz-syd-1",
    name: "Harborview Fitness",
    city: "Sydney",
    country: "Australia",
    category: "Gym",
    rating: 3.8,
    reviewCount: 189,
    responseRate: 31,
    missingDirectories: 4,
    averageReplyHours: 19,
    websiteScore: 55,
    website: "https://harborviewfitness.example",
  },
  {
    id: "biz-tor-1",
    name: "Nova Skin & Laser",
    city: "Toronto",
    country: "Canada",
    category: "Med Spa",
    rating: 4.0,
    reviewCount: 132,
    responseRate: 37,
    missingDirectories: 3,
    averageReplyHours: 20,
    websiteScore: 59,
    website: "https://novaskinlaser.example",
  },
  {
    id: "biz-nyc-1",
    name: "Alta Family Law",
    city: "New York",
    country: "USA",
    category: "Law Firm",
    rating: 3.7,
    reviewCount: 90,
    responseRate: 26,
    missingDirectories: 4,
    averageReplyHours: 26,
    websiteScore: 49,
    website: "https://altafamilylaw.example",
  },
  {
    id: "biz-ber-1",
    name: "Greenfield Vet Care",
    city: "Berlin",
    country: "Germany",
    category: "Veterinary Clinic",
    rating: 4.4,
    reviewCount: 166,
    responseRate: 52,
    missingDirectories: 1,
    averageReplyHours: 9,
    websiteScore: 72,
    website: "https://greenfieldvet.example",
  },
  {
    id: "biz-dxb-1",
    name: "Cedar & Spice Bistro",
    city: "Dubai",
    country: "UAE",
    category: "Restaurant",
    rating: 3.9,
    reviewCount: 248,
    responseRate: 33,
    missingDirectories: 3,
    averageReplyHours: 17,
    websiteScore: 57,
    website: "https://cedarspice.example",
  },
  {
    id: "biz-jhb-1",
    name: "Orbit Auto Repair",
    city: "Johannesburg",
    country: "South Africa",
    category: "Auto Service",
    rating: 3.6,
    reviewCount: 121,
    responseRate: 28,
    missingDirectories: 4,
    averageReplyHours: 28,
    websiteScore: 51,
    website: "https://orbitautorepair.example",
  },
  {
    id: "biz-tyo-1",
    name: "Sakura Smile Studio",
    city: "Tokyo",
    country: "Japan",
    category: "Dental Clinic",
    rating: 4.3,
    reviewCount: 304,
    responseRate: 49,
    missingDirectories: 2,
    averageReplyHours: 11,
    websiteScore: 70,
    website: "https://sakurasmile.example",
  },
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

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function getSyntheticBusinesses(city, query) {
  const cleanCity = city || "Global City";
  const cleanQuery = query || "Local Business";
  const citySlug = slugify(cleanCity || "city");
  const querySlug = slugify(cleanQuery || "business");

  return Array.from({ length: 3 }).map((_, index) => {
    const sequence = index + 1;
    const rating = formatMoney(3.7 + sequence * 0.2);
    return {
      id: `biz-${citySlug}-${querySlug}-${sequence}`,
      name: `${cleanCity} ${cleanQuery} Group ${sequence}`,
      city: cleanCity,
      country: "Global",
      category: cleanQuery,
      rating,
      reviewCount: 80 + sequence * 35,
      responseRate: 30 + sequence * 6,
      missingDirectories: Math.max(1, 5 - sequence),
      averageReplyHours: 10 + sequence * 3,
      websiteScore: 54 + sequence * 5,
      website: `https://${querySlug}-${citySlug}-${sequence}.example`,
    };
  });
}

function searchBusinesses(cityInput, queryInput) {
  const city = (cityInput || "").trim().toLowerCase();
  const query = (queryInput || "").trim().toLowerCase();

  const results = sampleBusinesses.filter((business) => {
    const cityMatch = city ? business.city.toLowerCase().includes(city) : true;
    const queryMatch = query
      ? `${business.name} ${business.category}`.toLowerCase().includes(query)
      : true;
    return cityMatch && queryMatch;
  });

  if (results.length > 0) {
    return { city, query, results };
  }

  return {
    city,
    query,
    results: getSyntheticBusinesses(cityInput || "Global City", queryInput || "Local business"),
  };
}

function handleSearchResponse(res, cityInput, queryInput) {
  const { city, query, results } = searchBusinesses(cityInput, queryInput);

  sendJson(res, 200, {
    mode: "google-maps-ai-search",
    city: city || "any",
    query: query || "any",
    count: results.length,
    results,
  });
}

function findBusinessById(businessId) {
  return sampleBusinesses.find((business) => business.id === businessId) || null;
}

function normalizeAnalyzerCard(card) {
  return {
    title: card.title,
    issue: card.finding,
    impact: card.impact,
    recommendation: card.fix,
  };
}

function buildAnalyzeResponse(businessInput) {
  const businessName = (businessInput.name || businessInput.businessName || "Selected business").toString();
  const city = (businessInput.city || "Unknown city").toString();
  const category = (businessInput.category || "Local business").toString();
  const cards = buildProblemCards(businessInput).map(normalizeAnalyzerCard);
  return {
    analyzer: "claude-online-presence-analyzer",
    business: {
      id: businessInput.id || null,
      name: businessName,
      city,
      category,
      rating: safeNumber(businessInput.rating, 4.0),
      reviewCount: safeNumber(businessInput.reviewCount, 100),
      website: businessInput.website || "",
    },
    summary: "6 critical online-growth problems detected.",
    cards,
  };
}

async function handleAnalyze(req, res, businessIdFromPath = null) {
  if (businessIdFromPath) {
    const business = findBusinessById(businessIdFromPath);
    if (!business) {
      sendJson(res, 404, { error: "Business not found." });
      return;
    }

    sendJson(res, 200, buildAnalyzeResponse(business));
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  if (body.businessId) {
    const business = findBusinessById(body.businessId.toString());
    if (business) {
      sendJson(res, 200, buildAnalyzeResponse(business));
      return;
    }
  }

  sendJson(res, 200, buildAnalyzeResponse(body));
}

function buildDealResponse(deal) {
  const escrowStatus = deal.status === "released_to_applicant" ? "released" : "funded";
  return {
    deal: {
      id: deal.id,
      businessId: deal.businessId,
      businessName: deal.businessName,
      clientName: deal.clientName,
      applicantName: deal.applicantName,
      proposalText: deal.proposalText,
      feeRatePercent: deal.feeRatePercent,
      status: deal.status,
      createdAt: deal.createdAt,
      releasedAt: deal.releasedAt,
    },
    payout: {
      totalAmount: deal.dealValue,
      platformFee: deal.platformFee,
      applicantPayout: deal.applicantPayout,
      escrowStatus,
      autoReleaseEnabled: true,
    },
  };
}

async function handleCreateDeal(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  const dealId = body.dealId ? body.dealId.toString() : null;
  if (dealId && deals.has(dealId)) {
    const existingDeal = deals.get(dealId);
    existingDeal.clientName = (body.clientName || existingDeal.clientName || "").toString().trim();
    existingDeal.applicantName = (body.applicantName || existingDeal.applicantName || "").toString().trim();
    existingDeal.proposalText = (body.proposalText || existingDeal.proposalText || "").toString().trim();

    if (body.doneConfirmedByClient === true || body.doneConfirmedByClient === "true") {
      existingDeal.status = "released_to_applicant";
      existingDeal.releasedAt = new Date().toISOString();
    }

    deals.set(dealId, existingDeal);
    sendJson(res, 200, buildDealResponse(existingDeal));
    return;
  }

  const businessId = (body.businessId || "").toString().trim();
  const business = businessId ? findBusinessById(businessId) : null;
  const clientName = (body.clientName || "").toString().trim();
  const applicantName = (body.applicantName || "").toString().trim();
  const proposalText = (body.proposalText || "").toString().trim();
  const dealValue = safeNumber(body.amount ?? body.dealValue, 0);
  const doneConfirmedByClient = body.doneConfirmedByClient === true || body.doneConfirmedByClient === "true";

  if (!clientName || !applicantName || !proposalText || dealValue <= 0) {
    sendJson(res, 400, {
      error: "clientName, applicantName, proposalText and positive dealValue are required.",
    });
    return;
  }

  const platformFee = formatMoney(dealValue * PLATFORM_FEE_RATE);
  const applicantPayout = formatMoney(dealValue - platformFee);
  const id = dealId || String(nextDealId++);

  const deal = {
    id,
    businessId: businessId || null,
    businessName: business?.name || (body.businessName || "Unknown business"),
    clientName,
    applicantName,
    proposalText,
    dealValue: formatMoney(dealValue),
    platformFee,
    applicantPayout,
    feeRatePercent: PLATFORM_FEE_RATE * 100,
    status: doneConfirmedByClient ? "released_to_applicant" : "funded_in_ccweb_escrow",
    createdAt: new Date().toISOString(),
    releasedAt: doneConfirmedByClient ? new Date().toISOString() : null,
  };

  deals.set(id, deal);
  sendJson(res, 201, buildDealResponse(deal));
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
    sendJson(res, 200, buildDealResponse(deal));
    return;
  }

  deal.status = "released_to_applicant";
  deal.releasedAt = new Date().toISOString();
  deals.set(dealId, deal);
  sendJson(res, 200, buildDealResponse(deal));
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

  sendJson(res, 200, buildDealResponse(deal));
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
    handleSearchResponse(
      res,
      requestUrl.searchParams.get("city"),
      requestUrl.searchParams.get("query")
    );
    return;
  }

  if (pathname === "/api/search" && req.method === "GET") {
    handleSearchResponse(
      res,
      requestUrl.searchParams.get("city"),
      requestUrl.searchParams.get("query")
    );
    return;
  }

  if (pathname === "/api/analyze" && req.method === "POST") {
    await handleAnalyze(req, res);
    return;
  }

  if (pathname === "/api/search" && req.method === "POST") {
    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      sendJson(res, 400, { error: "Body must be valid JSON." });
      return;
    }

    handleSearchResponse(res, body.city, body.query);
    return;
  }

  if (pathname.match(/^\/api\/analyze\/[^/]+$/) && req.method === "GET") {
    const businessId = pathname.split("/").pop();
    await handleAnalyze(req, res, businessId);
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
      : pathname === "/system"
      ? "/system.html"
      : pathname;
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(__dirname, "public", safePath);
  await serveFile(filePath, res);
});

server.listen(PORT, () => {
  console.log(`ccweb-project app running on http://localhost:${PORT}`);
});
