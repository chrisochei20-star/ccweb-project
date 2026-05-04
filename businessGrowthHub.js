/**
 * CCWEB Business Growth Hub — Global Marketing Agent + marketplace + escrow (prototype).
 * In-memory; replace with PostgreSQL + job queues for production.
 * Organic-first: no automated bulk messaging; suggestions require human approval.
 */

const crypto = require("crypto");

const PLATFORM_FEE_PCT = Number(process.env.CCWEB_GROWTH_PLATFORM_FEE_PCT || 8);
const LEAD_FEE_USD = Number(process.env.CCWEB_GROWTH_LEAD_FEE_USD || 2.5);

/** @type {Map<string, object>} */
const listings = new Map();
/** @type {Map<string, object>} */
const orders = new Map();
/** @type {Map<string, object>} */
const leads = new Map();
/** @type {Map<string, object>} */
const campaigns = new Map();
/** @type {object} */
let metrics = {
  leadsGenerated: 0,
  leadsConverted: 0,
  salesCompleted: 0,
  revenueGrossUsd: 0,
  revenueNetBusinessUsd: 0,
  revenuePlatformUsd: 0,
  campaignsActive: 0,
};

let nextListing = 1;
let nextOrder = 1;
let nextLead = 1;
let nextCampaign = 1;

const INDUSTRIES = ["e-commerce", "real-estate", "services", "consulting", "saas", "local-retail"];

const CHANNELS = ["x", "facebook", "instagram", "linkedin", "email", "blog"];

function seedIfEmpty() {
  if (listings.size) return;
  const samples = [
    {
      title: "Fractional CMO — 90-day growth sprint",
      type: "service",
      industry: "consulting",
      priceUsd: 12000,
      currency: "USD",
      sellerId: "biz-demo-1",
      sellerName: "Northstar Advisory",
      description: "Strategy, positioning, and weekly execution reviews.",
    },
    {
      title: "Shopify store optimization bundle",
      type: "product",
      industry: "e-commerce",
      priceUsd: 2499,
      currency: "USD",
      sellerId: "biz-demo-2",
      sellerName: "Atlas Commerce Lab",
      description: "CRO audit, collection structure, and email flows.",
    },
    {
      title: "Luxury listing media pack",
      type: "service",
      industry: "real-estate",
      priceUsd: 899,
      currency: "USD",
      sellerId: "biz-demo-3",
      sellerName: "Lumen Estates Media",
      description: "Photo direction, reel script, and listing copy.",
    },
  ];
  for (const s of samples) {
    const id = `lst_${String(nextListing++).padStart(4, "0")}`;
    listings.set(id, {
      id,
      ...s,
      status: "active",
      createdAt: new Date().toISOString(),
    });
  }
}

function scoreLead(seed) {
  const base = 40 + (seed % 45);
  const engagement = Math.round(15 + (seed % 20));
  return { score: Math.min(100, base + engagement), engagementHint: engagement >= 25 ? "high" : "medium" };
}

function createLead({ businessId, industry, region, source }) {
  const id = `lead_${String(nextLead++).padStart(5, "0")}`;
  const seed = crypto.randomBytes(2).readUInt16BE(0);
  const { score, engagementHint } = scoreLead(seed);
  const row = {
    id,
    businessId: businessId || "biz-default",
    industry: industry || "services",
    region: region || "global",
    source: source || "organic_research",
    score,
    engagementHint,
    status: "new",
    createdAt: new Date().toISOString(),
    complianceNote: "Human review required before any outreach; no cold spam.",
  };
  leads.set(id, row);
  metrics.leadsGenerated += 1;
  return row;
}

function createCampaign(body) {
  const id = `cmp_${String(nextCampaign++).padStart(4, "0")}`;
  const row = {
    id,
    businessId: (body.businessId || "biz-default").toString(),
    name: (body.name || "Organic growth campaign").toString().slice(0, 120),
    objective: (body.objective || "awareness").toString(),
    channels: Array.isArray(body.channels) ? body.channels.filter((c) => CHANNELS.includes(c)) : ["linkedin", "blog"],
    industries: Array.isArray(body.industries) ? body.industries.filter((i) => INDUSTRIES.includes(i)) : ["services"],
    organicOnly: body.organicOnly !== false,
    status: "draft",
    policyBanner:
      "CCWEB agents suggest compliant, opt-in friendly content. You must follow each platform's Terms and anti-spam rules. Automated bulk DMs are disabled.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  campaigns.set(id, row);
  metrics.campaignsActive += 1;
  return row;
}

function suggestionsForCampaign(campaign) {
  const ch = campaign.channels.join(", ");
  return {
    posts: [
      {
        channel: "linkedin",
        angle: "Thought leadership — problem → insight → soft CTA to booking link",
        draft:
          "Three shifts we see in {industry} buyer behavior this quarter… [your POV]. If helpful, we published a short framework — comment 'guide' and we'll DM the link (no pitch).",
      },
      {
        channel: "x",
        angle: "Thread hook + value bullets; link only in last tweet",
        draft:
          "Unpopular opinion: {industry} teams over-invest in ads before fixing ICP clarity. Here's a 6-point checklist we use with clients…",
      },
    ],
    dms: [
      {
        channel: "linkedin",
        useCase: "Warm intro only — mutual connection or prior engagement",
        template:
          "Hi {{name}}, noticed your work on {{topic}}. We put together a 1-pager on {{angle}} — happy to share if useful. No pressure.",
      },
    ],
    adsSuggestions: [
      { platform: "meta", objective: "Lead form — gated asset", note: "Use Advantage+ only with clear creative testing plan" },
      { platform: "linkedin", objective: "Conversation ads", note: "Strictly limited audience; monitor frequency caps" },
    ],
    researchChecklist: [
      "Customer behavior: segment by jobs-to-be-done; review support tickets / reviews",
      "Market trends: 3 competitor positioning maps + pricing bands",
      "Channel fit: match message to platform norms (LinkedIn ≠ X tone)",
    ],
    booking: {
      message: "Embed Cal.com / Calendly — agent can draft invite copy but cannot auto-book without user consent.",
    },
  };
}

function createListing(body) {
  seedIfEmpty();
  const id = `lst_${String(nextListing++).padStart(4, "0")}`;
  const row = {
    id,
    title: (body.title || "Untitled").toString().slice(0, 200),
    type: body.type === "product" ? "product" : "service",
    industry: INDUSTRIES.includes(body.industry) ? body.industry : "services",
    priceUsd: Math.max(0, Number(body.priceUsd) || 0),
    currency: "USD",
    sellerId: (body.sellerId || "biz-anon").toString(),
    sellerName: (body.sellerName || "Seller").toString().slice(0, 120),
    description: (body.description || "").toString().slice(0, 2000),
    status: "active",
    createdAt: new Date().toISOString(),
  };
  listings.set(id, row);
  return row;
}

function createOrder({ listingId, buyerId, buyerName }) {
  seedIfEmpty();
  const listing = listings.get(listingId);
  if (!listing) return { error: "Listing not found." };
  const gross = listing.priceUsd;
  const platformFee = +((gross * PLATFORM_FEE_PCT) / 100).toFixed(2);
  const id = `ord_${String(nextOrder++).padStart(4, "0")}`;
  const row = {
    id,
    listingId,
    listingTitle: listing.title,
    sellerId: listing.sellerId,
    buyerId: buyerId || "buyer-anon",
    buyerName: buyerName || "Customer",
    amountUsd: gross,
    platformFeeUsd: platformFee,
    sellerPendingUsd: +(gross - platformFee).toFixed(2),
    status: "escrow_funded",
    createdAt: new Date().toISOString(),
    audit: [{ at: new Date().toISOString(), event: "funded_escrow", note: "Simulated payment held until buyer confirms delivery." }],
  };
  orders.set(id, row);
  return row;
}

function confirmOrder(orderId) {
  const o = orders.get(orderId);
  if (!o) return { error: "Order not found." };
  if (o.status !== "escrow_funded" && o.status !== "delivered_pending_confirm") {
    return { error: "Order not in a confirmable state." };
  }
  o.status = "completed";
  o.completedAt = new Date().toISOString();
  o.audit.push({ at: o.completedAt, event: "buyer_confirmed_release", note: "Escrow released to seller minus platform fee." });
  metrics.salesCompleted += 1;
  metrics.revenueGrossUsd = +(metrics.revenueGrossUsd + o.amountUsd).toFixed(2);
  metrics.revenueNetBusinessUsd = +(metrics.revenueNetBusinessUsd + o.sellerPendingUsd).toFixed(2);
  metrics.revenuePlatformUsd = +(metrics.revenuePlatformUsd + o.platformFeeUsd).toFixed(2);
  orders.set(orderId, o);
  return { order: o };
}

function convertLead(leadId) {
  const row = leads.get(leadId);
  if (!row) return { error: "Not found" };
  row.status = "converted";
  row.convertedAt = new Date().toISOString();
  leads.set(leadId, row);
  metrics.leadsConverted += 1;
  const platformFeeUsd = +(LEAD_FEE_USD * (PLATFORM_FEE_PCT / 100)).toFixed(2);
  return { lead: row, leadFeeUsd: LEAD_FEE_USD, platformFeeUsd };
}

function markDelivered(orderId) {
  const o = orders.get(orderId);
  if (!o) return { error: "Order not found." };
  if (o.status !== "escrow_funded") return { error: "Invalid state." };
  o.status = "delivered_pending_confirm";
  o.deliveredAt = new Date().toISOString();
  o.audit.push({ at: o.deliveredAt, event: "seller_marked_delivered", note: "Awaiting buyer confirmation." });
  orders.set(orderId, o);
  return { order: o };
}

function overview() {
  seedIfEmpty();
  return {
    metrics: { ...metrics },
    platformFeePercent: PLATFORM_FEE_PCT,
    leadFeeUsd: LEAD_FEE_USD,
    disclaimer:
      "Prototype ledger. Escrow and payouts are simulated. Production requires licensed payment + compliance review for each channel and region.",
    organicPolicy:
      "No unsolicited bulk messaging. Use double opt-in where required. Agent outputs are suggestions — human approval before publish.",
    listingsCount: listings.size,
    openOrders: [...orders.values()].filter((o) => o.status.startsWith("escrow") || o.status === "delivered_pending_confirm").length,
  };
}

module.exports = {
  INDUSTRIES,
  CHANNELS,
  PLATFORM_FEE_PCT,
  LEAD_FEE_USD,
  seedIfEmpty,
  createLead,
  createCampaign,
  suggestionsForCampaign,
  createListing,
  createOrder,
  confirmOrder,
  markDelivered,
  convertLead,
  overview,
  listings,
  orders,
  leads,
  campaigns,
};
