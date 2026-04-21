const crypto = require("crypto");
const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3000);
const PLATFORM_FEE_RATE = 0.08;

const deals = new Map();
const applicants = new Map();
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

const categorySkillMap = {
  "dental clinic": ["local seo", "review management", "conversion copy", "google maps"],
  gym: ["lead generation", "social media", "crm", "landing pages"],
  "med spa": ["paid ads", "funnel optimization", "booking automation", "review management"],
  "law firm": ["content strategy", "seo", "lead qualification", "intake automation"],
  "veterinary clinic": ["local seo", "sms campaigns", "customer retention"],
  restaurant: ["reputation management", "menu optimization", "maps seo"],
  "auto service": ["google maps", "call tracking", "follow-up automation"],
};

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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

function tokenHint(token) {
  if (!token || token.length < 8) {
    return "***";
  }
  return `${token.slice(0, 4)}...${token.slice(-2)}`;
}

function generateReleaseToken() {
  return crypto.randomBytes(16).toString("hex");
}

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

function findBusinessById(businessId) {
  return sampleBusinesses.find((business) => business.id === businessId) || null;
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

function normalizeSkills(skillsInput) {
  if (!skillsInput) {
    return [];
  }

  const entries = Array.isArray(skillsInput) ? skillsInput : skillsInput.toString().split(",");

  return entries
    .map((entry) => {
      if (typeof entry === "string") {
        const [namePart, capacityPart] = entry.split(":");
        return {
          name: (namePart || "").trim(),
          capacity: clamp(safeNumber(capacityPart, 70), 1, 100),
        };
      }

      return {
        name: (entry.name || "").toString().trim(),
        capacity: clamp(safeNumber(entry.capacity, 70), 1, 100),
      };
    })
    .filter((skill) => Boolean(skill.name));
}

function normalizeCertificates(certsInput) {
  if (!certsInput) {
    return [];
  }

  const entries = Array.isArray(certsInput) ? certsInput : certsInput.toString().split(",");
  return entries.map((entry) => entry.toString().trim()).filter(Boolean);
}

function buildApplicantProfile(body, existing = null) {
  const now = new Date().toISOString();
  const fallbackId = existing?.id || `app-${slugify(body.fullName || "applicant") || crypto.randomUUID().slice(0, 8)}`;
  const id = (body.id || body.applicantId || fallbackId).toString().trim();
  const fullName = (body.fullName || existing?.fullName || "").toString().trim();

  return {
    id,
    fullName,
    headline: (body.headline || existing?.headline || "").toString().trim(),
    city: (body.city || existing?.city || "Global").toString().trim(),
    skills: normalizeSkills(body.skills || existing?.skills || []),
    certificates: normalizeCertificates(body.certificates || existing?.certificates || []),
    capacity: {
      weeklyHours: clamp(safeNumber(body.weeklyHours ?? body.capacity?.weeklyHours ?? existing?.capacity?.weeklyHours, 30), 1, 80),
      maxConcurrentDeals: clamp(
        safeNumber(body.maxConcurrentDeals ?? body.capacity?.maxConcurrentDeals ?? existing?.capacity?.maxConcurrentDeals, 3),
        1,
        20
      ),
      currentActiveDeals: clamp(
        safeNumber(body.currentActiveDeals ?? body.capacity?.currentActiveDeals ?? existing?.capacity?.currentActiveDeals, 0),
        0,
        20
      ),
    },
    stats: {
      jobsCompleted: Math.max(0, safeNumber(body.jobsCompleted ?? body.stats?.jobsCompleted ?? existing?.stats?.jobsCompleted, 0)),
      totalEarningsUsd: Math.max(
        0,
        safeNumber(body.totalEarningsUsd ?? body.stats?.totalEarningsUsd ?? existing?.stats?.totalEarningsUsd, 0)
      ),
      avgRating: clamp(safeNumber(body.avgRating ?? body.stats?.avgRating ?? existing?.stats?.avgRating, 4.2), 1, 5),
      onTimeRate: clamp(safeNumber(body.onTimeRate ?? body.stats?.onTimeRate ?? existing?.stats?.onTimeRate, 92), 0, 100),
    },
    paymentProfile: {
      payoutCurrency: (body.payoutCurrency || existing?.paymentProfile?.payoutCurrency || "USD").toString(),
      payoutCadence: (body.payoutCadence || existing?.paymentProfile?.payoutCadence || "weekly").toString(),
      roles: ["applicant", "client_approver", "platform_admin"],
      securityTier: (body.securityTier || existing?.paymentProfile?.securityTier || "enhanced").toString(),
    },
    updatedAt: now,
    createdAt: existing?.createdAt || now,
  };
}

function sanitizeApplicant(applicant) {
  return {
    ...applicant,
    compatibilityTags: applicant.skills.map((skill) => skill.name.toLowerCase()),
  };
}

function seedApplicants() {
  const initial = buildApplicantProfile({
    applicantId: "app-001",
    fullName: "Amina Growth Ops",
    headline: "Web3 growth operator for local businesses",
    city: "London",
    skills: ["Local SEO:90", "Review Management:88", "Lead Generation:86", "Google Maps:84"],
    certificates: ["Google Business Profile Optimization", "HubSpot Inbound Marketing", "Web3 GTM Strategy"],
    weeklyHours: 35,
    maxConcurrentDeals: 4,
    currentActiveDeals: 0,
    jobsCompleted: 42,
    totalEarningsUsd: 78500,
    avgRating: 4.8,
    onTimeRate: 97,
    securityTier: "enhanced",
  });
  applicants.set(initial.id, initial);
}

function buildMatchReasons(business, applicant) {
  const categoryKey = business.category.toLowerCase();
  const neededSkills = categorySkillMap[categoryKey] || ["local seo", "review management", "lead generation"];
  const applicantSkills = applicant.skills.map((skill) => skill.name.toLowerCase());

  const matchedSkills = neededSkills.filter((needed) =>
    applicantSkills.some((appSkill) => appSkill.includes(needed) || needed.includes(appSkill))
  );

  return {
    neededSkills,
    matchedSkills,
    coveragePercent: formatMoney((matchedSkills.length / neededSkills.length) * 100),
  };
}

function scoreOpportunity(applicant, business) {
  const reasons = buildMatchReasons(business, applicant);
  const capacityRoom = Math.max(0, applicant.capacity.maxConcurrentDeals - applicant.capacity.currentActiveDeals);
  const capacityScore = clamp(capacityRoom * 7, 0, 21);
  const skillScore = clamp((reasons.coveragePercent / 100) * 55, 0, 55);
  const demandScore = clamp((5 - safeNumber(business.rating, 4)) * 10, 5, 20);
  const velocityScore = clamp(safeNumber(business.reviewCount, 100) / 30, 0, 12);

  const totalScore = Math.round(skillScore + capacityScore + demandScore + velocityScore);
  const projectedGrossDeal = formatMoney(600 + totalScore * 15);
  const platformFee = formatMoney(projectedGrossDeal * PLATFORM_FEE_RATE);
  const applicantNet = formatMoney(projectedGrossDeal - platformFee);

  return {
    score: clamp(totalScore, 1, 100),
    reasons,
    projectedIncome: {
      grossDealUsd: projectedGrossDeal,
      platformFeeUsd: platformFee,
      applicantNetUsd: applicantNet,
    },
  };
}

function handleApplicantList(res) {
  const list = Array.from(applicants.values()).map(sanitizeApplicant);
  sendJson(res, 200, { count: list.length, applicants: list });
}

function handleGetApplicant(applicantId, res) {
  const applicant = applicants.get(applicantId);
  if (!applicant) {
    sendJson(res, 404, { error: "Applicant not found." });
    return;
  }

  sendJson(res, 200, sanitizeApplicant(applicant));
}

async function handleUpsertApplicant(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  const requestedId = (body.id || body.applicantId || "").toString().trim();
  const existing = requestedId ? applicants.get(requestedId) : null;
  const profile = buildApplicantProfile(body, existing);

  if (!profile.id || !profile.fullName) {
    sendJson(res, 400, { error: "applicantId and fullName are required." });
    return;
  }

  if (profile.capacity.currentActiveDeals > profile.capacity.maxConcurrentDeals) {
    sendJson(res, 400, {
      error: "currentActiveDeals cannot exceed maxConcurrentDeals.",
    });
    return;
  }

  applicants.set(profile.id, profile);
  sendJson(res, existing ? 200 : 201, sanitizeApplicant(profile));
}

function handleEngineMatch(requestUrl, res) {
  const applicantId = (requestUrl.searchParams.get("applicantId") || "").trim();
  if (!applicantId) {
    sendJson(res, 400, { error: "applicantId is required." });
    return;
  }

  const applicant = applicants.get(applicantId);
  if (!applicant) {
    sendJson(res, 404, { error: "Applicant not found." });
    return;
  }

  const city = requestUrl.searchParams.get("city");
  const query = requestUrl.searchParams.get("query");
  const { results } = searchBusinesses(city, query);

  const ranked = results
    .map((business) => {
      const score = scoreOpportunity(applicant, business);
      return {
        business,
        compatibilityScore: score.score,
        neededSkills: score.reasons.neededSkills,
        matchedSkills: score.reasons.matchedSkills,
        skillCoveragePercent: score.reasons.coveragePercent,
        projectedIncome: score.projectedIncome,
      };
    })
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  sendJson(res, 200, {
    mode: "ai-business-finder-income-engine",
    applicant: sanitizeApplicant(applicant),
    city: city || "any",
    query: query || "any",
    opportunities: ranked,
  });
}

function decrementApplicantLoad(applicantId) {
  if (!applicantId) {
    return;
  }
  const applicant = applicants.get(applicantId);
  if (!applicant) {
    return;
  }
  applicant.capacity.currentActiveDeals = Math.max(0, applicant.capacity.currentActiveDeals - 1);
  applicant.updatedAt = new Date().toISOString();
  applicants.set(applicantId, applicant);
}

function maybeIncrementApplicantLoad(applicantId) {
  if (!applicantId) {
    return { ok: true };
  }

  const applicant = applicants.get(applicantId);
  if (!applicant) {
    return { ok: false, status: 404, error: "Applicant profile not found for deal." };
  }

  if (applicant.capacity.currentActiveDeals >= applicant.capacity.maxConcurrentDeals) {
    return {
      ok: false,
      status: 409,
      error: "Applicant is at capacity; increase maxConcurrentDeals or complete active deals first.",
    };
  }

  applicant.capacity.currentActiveDeals += 1;
  applicant.updatedAt = new Date().toISOString();
  applicants.set(applicantId, applicant);
  return { ok: true };
}

function releaseDeal(deal, role, reason = "") {
  const now = new Date().toISOString();
  const releasePercent = deal.payoutMode === "split_release" ? clamp(deal.splitReleasePercent, 10, 100) : 100;
  const releasedAmount = formatMoney((deal.applicantPayout * releasePercent) / 100);
  const pendingAmount = formatMoney(deal.applicantPayout - releasedAmount);

  deal.releasedAmount = releasedAmount;
  deal.pendingAmount = pendingAmount;
  deal.releasedAt = now;
  deal.updatedAt = now;
  deal.status = pendingAmount > 0 ? "partially_released_to_applicant" : "released_to_applicant";
  deal.auditTrail.push({
    at: now,
    role,
    event: "payout_release_authorized",
    note: reason || "",
  });

  decrementApplicantLoad(deal.applicantId);
}

function buildDealResponse(deal, options = {}) {
  const { includeReleaseToken = false } = options;
  const escrowStatus = deal.status.includes("released")
    ? deal.pendingAmount > 0
      ? "partially_released"
      : "released"
    : "funded";
  const response = {
    deal: {
      id: deal.id,
      businessId: deal.businessId,
      businessName: deal.businessName,
      clientName: deal.clientName,
      applicantId: deal.applicantId,
      applicantName: deal.applicantName,
      proposalText: deal.proposalText,
      feeRatePercent: deal.feeRatePercent,
      status: deal.status,
      payoutMode: deal.payoutMode,
      splitReleasePercent: deal.splitReleasePercent,
      createdAt: deal.createdAt,
      releasedAt: deal.releasedAt,
      updatedAt: deal.updatedAt,
    },
    payout: {
      totalAmount: deal.dealValue,
      platformFee: deal.platformFee,
      applicantPayout: deal.applicantPayout,
      releasedAmount: deal.releasedAmount,
      pendingAmount: deal.pendingAmount,
      escrowStatus,
      autoReleaseEnabled: true,
    },
    security: {
      requiredApproverRole: "client_approver",
      fallbackApproverRole: "platform_admin",
      escrowProtection: "enabled",
      releaseTokenRequired: true,
      releaseTokenHint: tokenHint(deal.releaseToken),
    },
  };

  if (includeReleaseToken) {
    response.security.releaseToken = deal.releaseToken;
  }

  return response;
}

async function handleCreateDeal(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  const businessId = (body.businessId || "").toString().trim();
  const business = businessId ? findBusinessById(businessId) : null;
  const applicantId = (body.applicantId || "").toString().trim() || null;
  const applicantProfile = applicantId ? applicants.get(applicantId) : null;
  const clientName = (body.clientName || "").toString().trim();
  const applicantName = (
    body.applicantName ||
    applicantProfile?.fullName ||
    ""
  ).toString().trim();
  const proposalText = (body.proposalText || "").toString().trim();
  const dealValue = safeNumber(body.amount ?? body.dealValue, 0);
  const payoutMode = body.payoutMode === "split_release" ? "split_release" : "single_release";
  const splitReleasePercent = payoutMode === "split_release" ? clamp(safeNumber(body.splitReleasePercent, 70), 10, 100) : 100;

  if (!clientName || !applicantName || !proposalText || dealValue <= 0) {
    sendJson(res, 400, {
      error: "clientName, applicantName, proposalText and positive dealValue are required.",
    });
    return;
  }

  const loadResult = maybeIncrementApplicantLoad(applicantId);
  if (!loadResult.ok) {
    sendJson(res, loadResult.status, { error: loadResult.error });
    return;
  }

  const platformFee = formatMoney(dealValue * PLATFORM_FEE_RATE);
  const applicantPayout = formatMoney(dealValue - platformFee);
  const id = String(nextDealId++);
  const now = new Date().toISOString();
  const releaseToken = generateReleaseToken();

  const deal = {
    id,
    businessId: businessId || null,
    businessName: business?.name || (body.businessName || "Unknown business"),
    clientName,
    applicantId,
    applicantName,
    proposalText,
    dealValue: formatMoney(dealValue),
    platformFee,
    applicantPayout,
    releasedAmount: 0,
    pendingAmount: applicantPayout,
    feeRatePercent: PLATFORM_FEE_RATE * 100,
    status: "funded_in_ccweb_escrow",
    payoutMode,
    splitReleasePercent,
    createdAt: now,
    releasedAt: null,
    updatedAt: now,
    releaseToken,
    auditTrail: [
      { at: now, role: "system", event: "deal_created_in_escrow", note: "Client funded CCWEB escrow." },
    ],
  };

  deals.set(id, deal);
  sendJson(res, 201, buildDealResponse(deal, { includeReleaseToken: true }));
}

async function handleConfirmDeal(urlPath, req, res) {
  const match = urlPath.match(/^\/api\/deals\/([^/]+)\/confirm$/);
  if (!match) {
    sendJson(res, 404, { error: "Deal route not found." });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Body must be valid JSON." });
    return;
  }

  const dealId = match[1];
  const deal = deals.get(dealId);

  if (!deal) {
    sendJson(res, 404, { error: "Deal not found." });
    return;
  }

  if (deal.status.includes("released")) {
    sendJson(res, 200, buildDealResponse(deal));
    return;
  }

  const paymentRole = (body.paymentRole || "").toString().trim();
  if (paymentRole !== "client_approver" && paymentRole !== "platform_admin") {
    sendJson(res, 403, {
      error: "paymentRole must be client_approver or platform_admin.",
    });
    return;
  }

  if (paymentRole === "client_approver") {
    const confirmed = body.clientConfirmed === true || body.clientConfirmed === "true";
    if (!confirmed) {
      sendJson(res, 400, { error: "clientConfirmed must be true for client_approver release." });
      return;
    }

    const providedToken = (body.releaseToken || "").toString().trim();
    if (!providedToken || providedToken !== deal.releaseToken) {
      sendJson(res, 403, {
        error: "Invalid release token for secure payout release.",
      });
      return;
    }
  }

  if (paymentRole === "platform_admin" && !(body.adminOverrideReason || "").toString().trim()) {
    sendJson(res, 400, {
      error: "adminOverrideReason is required for platform_admin release.",
    });
    return;
  }

  releaseDeal(deal, paymentRole, (body.adminOverrideReason || "").toString().trim());
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

seedApplicants();

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

  if (pathname === "/api/analyze" && req.method === "POST") {
    await handleAnalyze(req, res);
    return;
  }

  if (pathname.match(/^\/api\/analyze\/[^/]+$/) && req.method === "GET") {
    const businessId = pathname.split("/").pop();
    await handleAnalyze(req, res, businessId);
    return;
  }

  if (pathname === "/api/applicants" && req.method === "GET") {
    handleApplicantList(res);
    return;
  }

  if (pathname === "/api/applicants" && req.method === "POST") {
    await handleUpsertApplicant(req, res);
    return;
  }

  if (pathname.match(/^\/api\/applicants\/[^/]+$/) && req.method === "GET") {
    const applicantId = pathname.split("/").pop();
    handleGetApplicant(applicantId, res);
    return;
  }

  if (pathname === "/api/engine/match" && req.method === "GET") {
    handleEngineMatch(requestUrl, res);
    return;
  }

  if (pathname === "/api/deals" && req.method === "POST") {
    await handleCreateDeal(req, res);
    return;
  }

  if (pathname.match(/^\/api\/deals\/[^/]+\/confirm$/) && req.method === "POST") {
    await handleConfirmDeal(pathname, req, res);
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
