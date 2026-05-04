/**
 * PostgreSQL persistence for Growth Hub (listings, orders, leads, campaigns, metrics).
 * When DATABASE_URL is unset, growth hub uses in-memory hub (businessGrowthHub.js).
 */

const crypto = require("crypto");
const { query } = require("./pool");

const PLATFORM_FEE_PCT = Number(process.env.CCWEB_GROWTH_PLATFORM_FEE_PCT || 8);
const LEAD_FEE_USD = Number(process.env.CCWEB_GROWTH_LEAD_FEE_USD || 2.5);

const INDUSTRIES = ["e-commerce", "real-estate", "services", "consulting", "saas", "local-retail"];
const CHANNELS = ["x", "facebook", "instagram", "linkedin", "email", "blog"];

function usePostgres() {
  return Boolean((process.env.DATABASE_URL || "").trim());
}

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

function mapListingRow(r) {
  return {
    id: r.id,
    title: r.title,
    type: r.type,
    industry: r.industry,
    priceUsd: Number(r.price_usd),
    currency: r.currency,
    sellerId: r.seller_id,
    sellerName: r.seller_name,
    description: r.description,
    status: r.status,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
  };
}

function mapOrderRow(r) {
  return {
    id: r.id,
    listingId: r.listing_id,
    listingTitle: r.listing_title,
    sellerId: r.seller_id,
    buyerId: r.buyer_id,
    buyerName: r.buyer_name,
    amountUsd: Number(r.amount_usd),
    platformFeeUsd: Number(r.platform_fee_usd),
    sellerPendingUsd: Number(r.seller_pending_usd),
    status: r.status,
    stripeCheckoutSessionId: r.stripe_checkout_session_id || undefined,
    stripePaymentIntentId: r.stripe_payment_intent_id || undefined,
    audit: Array.isArray(r.audit) ? r.audit : typeof r.audit === "string" ? JSON.parse(r.audit || "[]") : [],
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
    deliveredAt: r.delivered_at ? new Date(r.delivered_at).toISOString() : undefined,
    completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : undefined,
  };
}

async function seedIfEmpty() {
  const { rows } = await query("SELECT COUNT(*)::int AS c FROM growth_listings", []);
  if (rows[0].c > 0) return;
  const samples = [
    ["Fractional CMO — 90-day growth sprint", "service", "consulting", 12000, "biz-demo-1", "Northstar Advisory", "Strategy, positioning, and weekly execution reviews."],
    ["Shopify store optimization bundle", "product", "e-commerce", 2499, "biz-demo-2", "Atlas Commerce Lab", "CRO audit, collection structure, and email flows."],
    ["Luxury listing media pack", "service", "real-estate", 899, "biz-demo-3", "Lumen Estates Media", "Photo direction, reel script, and listing copy."],
  ];
  for (const [title, type, industry, priceUsd, sellerId, sellerName, description] of samples) {
    const id = newId("lst");
    await query(
      `INSERT INTO growth_listings (id, title, type, industry, price_usd, seller_id, seller_name, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, title, type, industry, priceUsd, sellerId, sellerName, description]
    );
  }
}

async function overview() {
  await seedIfEmpty();
  const m = await query("SELECT * FROM growth_metrics WHERE id = 1", []);
  const row = m.rows[0];
  const lc = await query("SELECT COUNT(*)::int AS c FROM growth_listings", []);
  const oc = await query(
    `SELECT COUNT(*)::int AS c FROM growth_orders WHERE status IN ('pending_payment','escrow_funded','delivered_pending_confirm')`,
    []
  );
  return {
    metrics: {
      leadsGenerated: row.leads_generated,
      leadsConverted: row.leads_converted,
      salesCompleted: row.sales_completed,
      revenueGrossUsd: Number(row.revenue_gross_usd),
      revenueNetBusinessUsd: Number(row.revenue_net_business_usd),
      revenuePlatformUsd: Number(row.revenue_platform_usd),
      campaignsActive: row.campaigns_active,
    },
    platformFeePercent: PLATFORM_FEE_PCT,
    leadFeeUsd: LEAD_FEE_USD,
    disclaimer:
      "PostgreSQL ledger. Escrow settlement uses Stripe in production when configured; otherwise funded state is recorded after checkout session completes.",
    organicPolicy:
      "No unsolicited bulk messaging. Use double opt-in where required. Agent outputs are suggestions — human approval before publish.",
    listingsCount: lc.rows[0].c,
    openOrders: oc.rows[0].c,
  };
}

async function listListings(industry) {
  await seedIfEmpty();
  const params = [];
  let sql = "SELECT * FROM growth_listings WHERE 1=1";
  if (industry) {
    sql += " AND industry = $1";
    params.push(industry);
  }
  sql += " ORDER BY created_at DESC";
  const { rows } = await query(sql, params);
  return rows.map(mapListingRow);
}

async function getListing(id) {
  await seedIfEmpty();
  const { rows } = await query("SELECT * FROM growth_listings WHERE id = $1", [id]);
  return rows[0] ? mapListingRow(rows[0]) : null;
}

async function createListing(body) {
  await seedIfEmpty();
  const id = newId("lst");
  const title = (body.title || "Untitled").toString().slice(0, 200);
  const type = body.type === "product" ? "product" : "service";
  const industry = INDUSTRIES.includes(body.industry) ? body.industry : "services";
  const priceUsd = Math.max(0, Number(body.priceUsd) || 0);
  const sellerId = (body.sellerId || "biz-anon").toString();
  const sellerName = (body.sellerName || "Seller").toString().slice(0, 120);
  const description = (body.description || "").toString().slice(0, 2000);
  await query(
    `INSERT INTO growth_listings (id, title, type, industry, price_usd, seller_id, seller_name, description)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [id, title, type, industry, priceUsd, sellerId, sellerName, description]
  );
  return getListing(id);
}

async function createOrder({ listingId, buyerId, buyerName, stripeCheckoutSessionId, stripePaymentIntentId }) {
  await seedIfEmpty();
  const listing = await getListing(listingId);
  if (!listing) return { error: "Listing not found." };
  const gross = listing.priceUsd;
  const platformFee = +((gross * PLATFORM_FEE_PCT) / 100).toFixed(2);
  const id = newId("ord");
  const paidUpfront = Boolean(stripeCheckoutSessionId && stripePaymentIntentId);
  const audit = [
    {
      at: new Date().toISOString(),
      event: paidUpfront ? "stripe_checkout_completed" : "order_created",
      note: paidUpfront
        ? "Escrow funded via Stripe (session attached at creation)."
        : "Order created; awaiting Stripe checkout completion.",
    },
  ];
  const status = paidUpfront ? "escrow_funded" : "pending_payment";
  await query(
    `INSERT INTO growth_orders (id, listing_id, listing_title, seller_id, buyer_id, buyer_name, amount_usd, platform_fee_usd, seller_pending_usd, status, stripe_checkout_session_id, stripe_payment_intent_id, audit)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)`,
    [
      id,
      listingId,
      listing.title,
      listing.sellerId,
      buyerId || "buyer-anon",
      buyerName || "Customer",
      gross,
      platformFee,
      +(gross - platformFee).toFixed(2),
      status,
      stripeCheckoutSessionId || null,
      stripePaymentIntentId || null,
      JSON.stringify(audit),
    ]
  );
  const o = await getOrder(id);
  return o;
}

async function getOrder(id) {
  const { rows } = await query("SELECT * FROM growth_orders WHERE id = $1", [id]);
  return rows[0] ? mapOrderRow(rows[0]) : null;
}

async function listOrders(sellerId) {
  await seedIfEmpty();
  const params = [];
  let sql = "SELECT * FROM growth_orders WHERE 1=1";
  if (sellerId) {
    sql += " AND seller_id = $1";
    params.push(sellerId);
  }
  sql += " ORDER BY created_at DESC";
  const { rows } = await query(sql, params);
  return rows.map(mapOrderRow);
}

async function markDelivered(orderId) {
  const o = await getOrder(orderId);
  if (!o) return { error: "Order not found." };
  if (o.status !== "escrow_funded") return { error: "Invalid state." };
  const audit = [...o.audit, { at: new Date().toISOString(), event: "seller_marked_delivered", note: "Awaiting buyer confirmation." }];
  await query(
    `UPDATE growth_orders SET status = $1, delivered_at = NOW(), audit = $2::jsonb WHERE id = $3`,
    ["delivered_pending_confirm", JSON.stringify(audit), orderId]
  );
  return { order: await getOrder(orderId) };
}

async function confirmOrder(orderId) {
  const o = await getOrder(orderId);
  if (!o) return { error: "Order not found." };
  if (o.status !== "escrow_funded" && o.status !== "delivered_pending_confirm") {
    return { error: "Order not in a confirmable state." };
  }
  const audit = [
    ...o.audit,
    { at: new Date().toISOString(), event: "buyer_confirmed_release", note: "Escrow released to seller minus platform fee." },
  ];
  await query(
    `UPDATE growth_orders SET status = $1, completed_at = NOW(), audit = $2::jsonb WHERE id = $3`,
    ["completed", JSON.stringify(audit), orderId]
  );
  await query(
    `UPDATE growth_metrics SET
      sales_completed = sales_completed + 1,
      revenue_gross_usd = revenue_gross_usd + $1,
      revenue_net_business_usd = revenue_net_business_usd + $2,
      revenue_platform_usd = revenue_platform_usd + $3
     WHERE id = 1`,
    [o.amountUsd, o.sellerPendingUsd, o.platformFeeUsd]
  );
  return { order: await getOrder(orderId) };
}

async function createLead(body) {
  const id = newId("lead");
  const seed = crypto.randomBytes(2).readUInt16BE(0);
  const base = 40 + (seed % 45);
  const engagement = Math.round(15 + (seed % 20));
  const score = Math.min(100, base + engagement);
  const engagementHint = engagement >= 25 ? "high" : "medium";
  await query(
    `INSERT INTO growth_leads (id, business_id, industry, region, source, score, engagement_hint, status, compliance_note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      id,
      body.businessId || "biz-default",
      body.industry || "services",
      body.region || "global",
      body.source || "organic_research",
      score,
      engagementHint,
      "new",
      "Human review required before any outreach; no cold spam.",
    ]
  );
  await query("UPDATE growth_metrics SET leads_generated = leads_generated + 1 WHERE id = 1", []);
  const { rows } = await query("SELECT * FROM growth_leads WHERE id = $1", [id]);
  return mapLeadRow(rows[0]);
}

function mapLeadRow(r) {
  return {
    id: r.id,
    businessId: r.business_id,
    industry: r.industry,
    region: r.region,
    source: r.source,
    score: r.score,
    engagementHint: r.engagement_hint,
    status: r.status,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
    complianceNote: r.compliance_note,
    convertedAt: r.converted_at ? new Date(r.converted_at).toISOString() : undefined,
  };
}

async function listLeads(businessId) {
  await seedIfEmpty();
  const params = [];
  let sql = "SELECT * FROM growth_leads WHERE 1=1";
  if (businessId) {
    sql += " AND business_id = $1";
    params.push(businessId);
  }
  sql += " ORDER BY created_at DESC";
  const { rows } = await query(sql, params);
  return rows.map(mapLeadRow);
}

async function convertLead(leadId) {
  const { rows } = await query("SELECT * FROM growth_leads WHERE id = $1", [leadId]);
  if (!rows[0]) return { error: "Not found" };
  await query(`UPDATE growth_leads SET status = 'converted', converted_at = NOW() WHERE id = $1`, [leadId]);
  await query("UPDATE growth_metrics SET leads_converted = leads_converted + 1 WHERE id = 1", []);
  const platformFeeUsd = +((LEAD_FEE_USD * (PLATFORM_FEE_PCT / 100)).toFixed(2));
  const { rows: r2 } = await query("SELECT * FROM growth_leads WHERE id = $1", [leadId]);
  return { lead: mapLeadRow(r2[0]), leadFeeUsd: LEAD_FEE_USD, platformFeeUsd };
}

async function createCampaign(body) {
  const id = newId("cmp");
  const channels = Array.isArray(body.channels) ? body.channels.filter((c) => CHANNELS.includes(c)) : ["linkedin", "blog"];
  const industries = Array.isArray(body.industries) ? body.industries.filter((i) => INDUSTRIES.includes(i)) : ["services"];
  await query(
    `INSERT INTO growth_campaigns (id, business_id, name, objective, channels, industries, organic_only, status, policy_banner)
     VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8,$9)`,
    [
      id,
      (body.businessId || "biz-default").toString(),
      (body.name || "Organic growth campaign").toString().slice(0, 120),
      (body.objective || "awareness").toString(),
      JSON.stringify(channels),
      JSON.stringify(industries),
      body.organicOnly !== false,
      "draft",
      "CCWEB agents suggest compliant, opt-in friendly content. You must follow each platform's Terms and anti-spam rules. Automated bulk DMs are disabled.",
    ]
  );
  await query("UPDATE growth_metrics SET campaigns_active = campaigns_active + 1 WHERE id = 1", []);
  return getCampaign(id);
}

async function getCampaign(id) {
  const { rows } = await query("SELECT * FROM growth_campaigns WHERE id = $1", [id]);
  if (!rows[0]) return null;
  const r = rows[0];
  return {
    id: r.id,
    businessId: r.business_id,
    name: r.name,
    objective: r.objective,
    channels: r.channels,
    industries: r.industries,
    organicOnly: r.organic_only,
    status: r.status,
    policyBanner: r.policy_banner,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
  };
}

async function listCampaigns() {
  const { rows } = await query("SELECT * FROM growth_campaigns ORDER BY created_at DESC", []);
  return rows.map((r) => ({
    id: r.id,
    businessId: r.business_id,
    name: r.name,
    objective: r.objective,
    channels: r.channels,
    industries: r.industries,
    organicOnly: r.organic_only,
    status: r.status,
    policyBanner: r.policy_banner,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
  }));
}

async function attachStripeToOrder(orderId, sessionId, paymentIntentId) {
  const o = await getOrder(orderId);
  if (!o) return { error: "Order not found." };
  const audit = [
    ...o.audit,
    {
      at: new Date().toISOString(),
      event: "stripe_attached",
      sessionId,
      paymentIntentId,
      note: "Stripe session / payment intent linked; marking escrow funded.",
    },
  ];
  await query(
    `UPDATE growth_orders SET
      stripe_checkout_session_id = COALESCE($2, stripe_checkout_session_id),
      stripe_payment_intent_id = COALESCE($3, stripe_payment_intent_id),
      status = CASE WHEN $1::text IS NOT NULL AND status = 'pending_payment' THEN 'escrow_funded' ELSE status END,
      audit = $4::jsonb
     WHERE id = $1`,
    [orderId, sessionId || null, paymentIntentId || null, JSON.stringify(audit)]
  );
  return { order: await getOrder(orderId) };
}

module.exports = {
  usePostgres,
  PLATFORM_FEE_PCT,
  LEAD_FEE_USD,
  INDUSTRIES,
  CHANNELS,
  seedIfEmpty,
  overview,
  listListings,
  getListing,
  createListing,
  createOrder,
  getOrder,
  listOrders,
  markDelivered,
  confirmOrder,
  createLead,
  listLeads,
  convertLead,
  createCampaign,
  getCampaign,
  listCampaigns,
  attachStripeToOrder,
};
