/**
 * CCWEB marketplace catalog: stores, listings, SKUs, purchases, entitlements, AI versions, reviews.
 */

const crypto = require("crypto");
const { query } = require("./pool");

function usePostgres() {
  return Boolean((process.env.DATABASE_URL || "").trim());
}

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

function slugify(raw) {
  return String(raw || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "store";
}

function normalizeTags(input) {
  if (!input) return [];
  const arr = Array.isArray(input) ? input : String(input).split(/[,#]/);
  const out = [];
  for (const raw of arr) {
    const t = String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "")
      .slice(0, 32);
    if (t && !out.includes(t)) out.push(t);
    if (out.length >= 16) break;
  }
  return out;
}

function moderationOnPublish() {
  return String(process.env.CCWEB_MP_REQUIRE_LISTING_REVIEW || "").trim() === "1" ? "pending_review" : "visible";
}

async function ensureCcwebUser(userId) {
  if (!userId) return;
  await query(`INSERT INTO ccweb_users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`, [userId]);
}

async function getOrCreateStoreForUser(ownerUserId, { title, slug, tagline, description, bannerUrl, avatarUrl, published = true } = {}) {
  await ensureCcwebUser(ownerUserId);
  const { rows: ex } = await query(`SELECT * FROM ccweb_marketplace_stores WHERE owner_user_id = $1 LIMIT 1`, [ownerUserId]);
  if (ex[0]) {
    const s = ex[0];
    const nextSlug = slug ? slugify(slug) : s.slug;
    await query(
      `UPDATE ccweb_marketplace_stores SET
         title = COALESCE($2, title),
         slug = CASE WHEN $3::text IS NOT NULL AND $3 <> '' THEN $3 ELSE slug END,
         tagline = COALESCE($4, tagline),
         description = COALESCE($5, description),
         banner_url = COALESCE($6, banner_url),
         avatar_url = COALESCE($7, avatar_url),
         published = COALESCE($8, published),
         updated_at = NOW()
       WHERE id = $1`,
      [
        s.id,
        title != null ? String(title).slice(0, 200) : null,
        nextSlug,
        tagline != null ? String(tagline).slice(0, 300) : null,
        description != null ? String(description).slice(0, 8000) : null,
        bannerUrl || null,
        avatarUrl || null,
        published != null ? Boolean(published) : null,
      ]
    );
    const { rows } = await query(`SELECT * FROM ccweb_marketplace_stores WHERE id = $1`, [s.id]);
    return mapStore(rows[0]);
  }
  const id = newId("mps");
  const base = slug ? slugify(slug) : slugify(title || `creator-${ownerUserId.slice(0, 8)}`);
  let finalSlug = base;
  for (let i = 0; i < 12; i++) {
    const trySlug = i === 0 ? finalSlug : `${base}-${i}`;
    const { rows: clash } = await query(`SELECT 1 FROM ccweb_marketplace_stores WHERE slug = $1 LIMIT 1`, [trySlug]);
    if (!clash[0]) {
      finalSlug = trySlug;
      break;
    }
    finalSlug = `${base}-${crypto.randomBytes(2).toString("hex")}`;
  }
  await query(
    `INSERT INTO ccweb_marketplace_stores (id, owner_user_id, slug, title, tagline, description, banner_url, avatar_url, published)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      id,
      ownerUserId,
      finalSlug,
      String(title || "Creator store").slice(0, 200),
      String(tagline || "").slice(0, 300),
      String(description || "").slice(0, 8000),
      bannerUrl || null,
      avatarUrl || null,
      Boolean(published),
    ]
  );
  const { rows } = await query(`SELECT * FROM ccweb_marketplace_stores WHERE id = $1`, [id]);
  return mapStore(rows[0]);
}

function mapStore(r) {
  if (!r) return null;
  return {
    id: r.id,
    ownerUserId: r.owner_user_id,
    slug: r.slug,
    title: r.title,
    tagline: r.tagline,
    description: r.description,
    bannerUrl: r.banner_url,
    avatarUrl: r.avatar_url,
    published: r.published,
    creatorVerified: Boolean(r.creator_verified),
    metadata: typeof r.metadata === "object" ? r.metadata : {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

async function getStoreBySlug(slug) {
  if (!usePostgres()) return null;
  const { rows } = await query(`SELECT * FROM ccweb_marketplace_stores WHERE slug = $1 AND published = TRUE LIMIT 1`, [String(slug).trim()]);
  return mapStore(rows[0]);
}

async function listPublishedListingsForStore(storeId, limit = 40) {
  const lim = Math.min(100, Math.max(1, limit));
  const { rows } = await query(
    `SELECT l.* FROM ccweb_marketplace_listings l
     WHERE l.store_id = $1 AND l.status = 'published' AND l.moderation_status = 'visible'
     ORDER BY l.featured DESC, l.updated_at DESC LIMIT $2`,
    [storeId, lim]
  );
  return rows.map(mapListingRow);
}

async function createListing(ownerUserId, body) {
  if (!usePostgres()) return { ok: false, error: "NO_DATABASE" };
  await ensureCcwebUser(ownerUserId);
  const store = await getOrCreateStoreForUser(ownerUserId, { title: body.storeTitle });
  const id = newId("mpl");
  let slug = slugify(body.slug || body.title);
  for (let i = 0; i < 20; i++) {
    const trySlug = i === 0 ? slug : `${slug}-${i}`;
    const { rows: c } = await query(`SELECT 1 FROM ccweb_marketplace_listings WHERE slug = $1 LIMIT 1`, [trySlug]);
    if (!c[0]) {
      slug = trySlug;
      break;
    }
  }
  const kind = String(body.kind || "tool").toLowerCase();
  const allowed = ["agent", "workflow", "tool", "prompt_pack", "bundle", "digital"];
  const k = allowed.includes(kind) ? kind : "tool";
  const status = body.publish ? "published" : "draft";
  const tagsArr = normalizeTags(body.tags);
  const mod0 = status === "published" ? moderationOnPublish() : "visible";
  await query(
    `INSERT INTO ccweb_marketplace_listings (
       id, store_id, slug, title, subtitle, description, kind, category_slug, status, featured,
       moderation_status, tags, thumbnail_url, install_hint, metadata
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::text[],$13,$14,$15::jsonb)`,
    [
      id,
      store.id,
      slug,
      String(body.title || "Listing").slice(0, 200),
      String(body.subtitle || "").slice(0, 300),
      String(body.description || "").slice(0, 20000),
      k,
      String(body.categorySlug || "general").slice(0, 64),
      status === "published" ? "published" : "draft",
      Boolean(body.featured),
      mod0,
      tagsArr,
      body.thumbnailUrl ? String(body.thumbnailUrl).slice(0, 2000) : null,
      String(body.installHint || "Open Build → AI agents to configure credentials and run.").slice(0, 2000),
      JSON.stringify(body.metadata && typeof body.metadata === "object" ? body.metadata : {}),
    ]
  );
  const row = (await query(`SELECT * FROM ccweb_marketplace_listings WHERE id = $1`, [id])).rows[0];
  return { ok: true, listing: mapListingRow(row) };
}

async function updateListing(listingId, ownerUserId, patch) {
  const { rows } = await query(
    `SELECT l.* FROM ccweb_marketplace_listings l
     JOIN ccweb_marketplace_stores s ON s.id = l.store_id
     WHERE l.id = $1 AND s.owner_user_id = $2 LIMIT 1`,
    [listingId, ownerUserId]
  );
  if (!rows[0]) return { ok: false, error: "not_found" };
  const prev = rows[0];
  const wasPublished = prev.status === "published";
  const p = patch || {};
  await query(
    `UPDATE ccweb_marketplace_listings SET
       title = COALESCE($2, title),
       subtitle = COALESCE($3, subtitle),
       description = COALESCE($4, description),
       kind = COALESCE($5, kind),
       category_slug = COALESCE($6, category_slug),
       status = COALESCE($7, status),
       featured = COALESCE($8, featured),
       thumbnail_url = COALESCE($9, thumbnail_url),
       install_hint = COALESCE($10, install_hint),
       metadata = CASE WHEN $11::jsonb IS NOT NULL THEN metadata || $11::jsonb ELSE metadata END,
       updated_at = NOW()
     WHERE id = $1`,
    [
      listingId,
      p.title != null ? String(p.title).slice(0, 200) : null,
      p.subtitle != null ? String(p.subtitle).slice(0, 300) : null,
      p.description != null ? String(p.description).slice(0, 20000) : null,
      p.kind != null ? String(p.kind).slice(0, 32) : null,
      p.categorySlug != null ? String(p.categorySlug).slice(0, 64) : null,
      p.status != null ? String(p.status).slice(0, 32) : null,
      p.featured != null ? Boolean(p.featured) : null,
      p.thumbnailUrl !== undefined ? (p.thumbnailUrl ? String(p.thumbnailUrl).slice(0, 2000) : null) : null,
      p.installHint != null ? String(p.installHint).slice(0, 2000) : null,
      p.metadata && typeof p.metadata === "object" ? JSON.stringify(p.metadata) : null,
    ]
  );
  if (p.tags !== undefined) {
    const tagsArr = normalizeTags(p.tags);
    await query(`UPDATE ccweb_marketplace_listings SET tags = $2::text[], updated_at = NOW() WHERE id = $1`, [listingId, tagsArr]);
  }
  const nextStatus = p.status != null ? String(p.status).slice(0, 32) : prev.status;
  if (!wasPublished && nextStatus === "published") {
    await query(`UPDATE ccweb_marketplace_listings SET moderation_status = $2, updated_at = NOW() WHERE id = $1`, [
      listingId,
      moderationOnPublish(),
    ]);
  }
  const u = (await query(`SELECT * FROM ccweb_marketplace_listings WHERE id = $1`, [listingId])).rows[0];
  return { ok: true, listing: mapListingRow(u) };
}

function mapListingRow(r) {
  if (!r) return null;
  const tags = Array.isArray(r.tags) ? r.tags : [];
  return {
    id: r.id,
    storeId: r.store_id,
    slug: r.slug,
    title: r.title,
    subtitle: r.subtitle,
    description: r.description,
    kind: r.kind,
    categorySlug: r.category_slug,
    status: r.status,
    featured: r.featured,
    moderationStatus: r.moderation_status || "visible",
    tags,
    thumbnailUrl: r.thumbnail_url,
    installHint: r.install_hint,
    versionPublished: Number(r.version_published),
    metadata: typeof r.metadata === "object" ? r.metadata : {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

async function getListingBySlug(listingSlug) {
  if (!usePostgres()) return null;
  const { rows } = await query(
    `SELECT l.*, s.slug AS store_slug, s.title AS store_title, s.owner_user_id AS store_owner_id,
            COALESCE(s.creator_verified, FALSE) AS store_creator_verified
     FROM ccweb_marketplace_listings l
     JOIN ccweb_marketplace_stores s ON s.id = l.store_id
     WHERE l.slug = $1 AND l.status = 'published' AND s.published = TRUE AND l.moderation_status = 'visible'
     LIMIT 1`,
    [String(listingSlug).trim()]
  );
  const r = rows[0];
  if (!r) return null;
  const listing = mapListingRow(r);
  listing.storeSlug = r.store_slug;
  listing.storeTitle = r.store_title;
  listing.storeOwnerId = r.store_owner_id;
  listing.storeCreatorVerified = Boolean(r.store_creator_verified);
  return listing;
}

async function listListingsPublic({ q, categorySlug, featuredOnly, tag, limit = 30, offset = 0 } = {}) {
  if (!usePostgres()) return [];
  const lim = Math.min(80, Math.max(1, limit));
  const off = Math.max(0, Number(offset) || 0);
  const params = [];
  let where = `l.status = 'published' AND s.published = TRUE AND l.moderation_status = 'visible'`;
  if (categorySlug) {
    params.push(String(categorySlug).trim());
    where += ` AND l.category_slug = $${params.length}`;
  }
  if (featuredOnly) {
    where += ` AND l.featured = TRUE`;
  }
  if (tag && String(tag).trim()) {
    params.push(String(tag).trim().toLowerCase().slice(0, 32));
    where += ` AND $${params.length} = ANY(l.tags)`;
  }
  if (q && String(q).trim()) {
    params.push(`%${String(q).trim().slice(0, 120).replace(/[%_]/g, " ")}%`);
    where += ` AND (l.title ILIKE $${params.length} OR l.description ILIKE $${params.length} OR l.subtitle ILIKE $${params.length})`;
  }
  params.push(lim, off);
  const { rows } = await query(
    `SELECT l.*, s.slug AS store_slug, s.title AS store_title
     FROM ccweb_marketplace_listings l
     JOIN ccweb_marketplace_stores s ON s.id = l.store_id
     WHERE ${where}
     ORDER BY l.featured DESC, l.updated_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows.map((r) => {
    const x = mapListingRow(r);
    x.storeSlug = r.store_slug;
    x.storeTitle = r.store_title;
    return x;
  });
}

async function listFeaturedListings(limit = 12) {
  return listListingsPublic({ featuredOnly: true, limit });
}

async function listTrendingListings(limit = 12) {
  if (!usePostgres()) return [];
  const lim = Math.min(50, Math.max(1, limit));
  const { rows } = await query(
    `SELECT l.*, s.slug AS store_slug, s.title AS store_title,
            COUNT(DISTINCT p.id)::int AS purchase_count_14d,
            (SELECT COUNT(*)::int FROM ccweb_marketplace_reviews r
              WHERE r.listing_id = l.id AND r.status = 'visible') AS review_count
     FROM ccweb_marketplace_listings l
     JOIN ccweb_marketplace_stores s ON s.id = l.store_id
     LEFT JOIN ccweb_marketplace_purchases p ON p.listing_id = l.id AND p.created_at > NOW() - INTERVAL '14 days'
     WHERE l.status = 'published' AND s.published = TRUE AND l.moderation_status = 'visible'
     GROUP BY l.id, s.slug, s.title
     ORDER BY (COUNT(DISTINCT p.id) * 3 + (SELECT COUNT(*)::int FROM ccweb_marketplace_reviews r2 WHERE r2.listing_id = l.id AND r2.status = 'visible')) DESC,
              l.updated_at DESC
     LIMIT $1`,
    [lim]
  );
  return rows.map((r) => {
    const x = mapListingRow(r);
    x.storeSlug = r.store_slug;
    x.storeTitle = r.store_title;
    x.trendPurchaseCount14d = Number(r.purchase_count_14d) || 0;
    x.trendReviewCount = Number(r.review_count) || 0;
    return x;
  });
}

async function getSkuById(skuId) {
  const { rows } = await query(
    `SELECT k.*, l.id AS listing_id, l.store_id, l.slug AS listing_slug, l.title AS listing_title, l.status AS listing_status,
            l.moderation_status AS listing_moderation_status, s.owner_user_id AS seller_user_id
     FROM ccweb_marketplace_skus k
     JOIN ccweb_marketplace_listings l ON l.id = k.listing_id
     JOIN ccweb_marketplace_stores s ON s.id = l.store_id
     WHERE k.id = $1 LIMIT 1`,
    [skuId]
  );
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    listingId: r.listing_id,
    storeId: r.store_id,
    code: r.code,
    label: r.label,
    priceUsdCents: Number(r.price_usd_cents),
    priceNgn: Number(r.price_ngn),
    billing: r.billing,
    active: r.active,
    entitlementDays: r.entitlement_days != null ? Number(r.entitlement_days) : null,
    metadata: typeof r.metadata === "object" ? r.metadata : {},
    sellerUserId: r.seller_user_id,
    listingSlug: r.listing_slug,
    listingStatus: r.listing_status,
    listingModerationStatus: r.listing_moderation_status || "visible",
  };
}

async function addSku(listingId, ownerUserId, body) {
  const { rows } = await query(
    `SELECT l.id FROM ccweb_marketplace_listings l
     JOIN ccweb_marketplace_stores s ON s.id = l.store_id
     WHERE l.id = $1 AND s.owner_user_id = $2 LIMIT 1`,
    [listingId, ownerUserId]
  );
  if (!rows[0]) return { ok: false, error: "not_found" };
  const id = newId("mpk");
  const code = slugify(body.code || "default") || "default";
  const label = String(body.label || "Standard").slice(0, 200);
  const priceUsdCents = Math.max(0, Math.round(Number(body.priceUsdCents) || 0));
  const priceNgn = Math.max(0, Math.round(Number(body.priceNgn) || 0));
  const billing = ["once", "monthly", "yearly"].includes(String(body.billing || "").toLowerCase())
    ? String(body.billing).toLowerCase()
    : "once";
  const entitlementDays = body.entitlementDays != null ? Math.min(3650, Math.max(1, Number(body.entitlementDays))) : null;
  try {
    await query(
      `INSERT INTO ccweb_marketplace_skus (id, listing_id, code, label, price_usd_cents, price_ngn, billing, active, entitlement_days, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,$8,$9::jsonb)`,
      [
        id,
        listingId,
        code,
        label,
        priceUsdCents,
        priceNgn,
        billing,
        entitlementDays,
        JSON.stringify(body.metadata && typeof body.metadata === "object" ? body.metadata : {}),
      ]
    );
  } catch (e) {
    if (e.code === "23505") return { ok: false, error: "sku_code_exists" };
    throw e;
  }
  const k = (await query(`SELECT * FROM ccweb_marketplace_skus WHERE id = $1`, [id])).rows[0];
  return { ok: true, sku: mapSkuRow(k) };
}

function mapSkuRow(r) {
  return {
    id: r.id,
    listingId: r.listing_id,
    code: r.code,
    label: r.label,
    priceUsdCents: Number(r.price_usd_cents),
    priceNgn: Number(r.price_ngn),
    billing: r.billing,
    active: r.active,
    entitlementDays: r.entitlement_days != null ? Number(r.entitlement_days) : null,
    metadata: typeof r.metadata === "object" ? r.metadata : {},
  };
}

async function listSkusForListing(listingId, { onlyActive = true } = {}) {
  const act = onlyActive ? "AND active = TRUE" : "";
  const { rows } = await query(`SELECT * FROM ccweb_marketplace_skus WHERE listing_id = $1 ${act} ORDER BY created_at ASC`, [listingId]);
  return rows.map(mapSkuRow);
}

async function createReview(listingId, authorUserId, { rating, title, body }) {
  await ensureCcwebUser(authorUserId);
  const r = Math.round(Number(rating));
  if (!Number.isFinite(r) || r < 1 || r > 5) return { ok: false, error: "bad_rating" };
  const id = newId("mpr");
  try {
    await query(
      `INSERT INTO ccweb_marketplace_reviews (id, listing_id, author_user_id, rating, title, body, status)
       VALUES ($1,$2,$3,$4,$5,$6,'visible')`,
      [id, listingId, authorUserId, r, String(title || "").slice(0, 200), String(body || "").slice(0, 4000)]
    );
  } catch (e) {
    if (e.code === "23505") return { ok: false, error: "already_reviewed" };
    throw e;
  }
  return { ok: true, id };
}

async function listReviewsForListing(listingId, limit = 40, opts = {}) {
  const lim = Math.min(100, Math.max(1, limit));
  const vis = opts.allStatuses ? "" : "AND status = 'visible'";
  const { rows } = await query(
    `SELECT id, listing_id, author_user_id, rating, title, body, status, created_at
     FROM ccweb_marketplace_reviews WHERE listing_id = $1 ${vis} ORDER BY created_at DESC LIMIT $2`,
    [listingId, lim]
  );
  return rows.map((x) => ({
    id: x.id,
    listingId: x.listing_id,
    authorUserId: x.author_user_id,
    rating: x.rating,
    title: x.title,
    body: x.body,
    status: x.status,
    createdAt: x.created_at,
  }));
}

async function upsertAiVersion(listingId, ownerUserId, body) {
  const { rows } = await query(
    `SELECT l.id, l.version_published FROM ccweb_marketplace_listings l
     JOIN ccweb_marketplace_stores s ON s.id = l.store_id
     WHERE l.id = $1 AND s.owner_user_id = $2 LIMIT 1`,
    [listingId, ownerUserId]
  );
  if (!rows[0]) return { ok: false, error: "not_found" };
  const nextV = Math.max(1, Math.round(Number(body.version) || rows[0].version_published + 1));
  const id = newId("mpa");
  const agent = body.agentConfig && typeof body.agentConfig === "object" ? body.agentConfig : {};
  const wf = body.workflowGraph && typeof body.workflowGraph === "object" ? body.workflowGraph : {};
  const prompts = Array.isArray(body.prompts) ? body.prompts : [];
  const exec = body.executionConfig && typeof body.executionConfig === "object" ? body.executionConfig : {};
  const tools = body.toolManifest && typeof body.toolManifest === "object" ? body.toolManifest : {};
  await query(`UPDATE ccweb_marketplace_ai_versions SET is_default = FALSE WHERE listing_id = $1`, [listingId]);
  await query(
    `INSERT INTO ccweb_marketplace_ai_versions (
       id, listing_id, version, agent_config, workflow_graph, prompts, execution_config, tool_manifest, changelog, is_default
     ) VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9,TRUE)
     ON CONFLICT (listing_id, version) DO UPDATE SET
       agent_config = EXCLUDED.agent_config,
       workflow_graph = EXCLUDED.workflow_graph,
       prompts = EXCLUDED.prompts,
       execution_config = EXCLUDED.execution_config,
       tool_manifest = EXCLUDED.tool_manifest,
       changelog = EXCLUDED.changelog,
       is_default = TRUE`,
    [
      id,
      listingId,
      nextV,
      JSON.stringify(agent),
      JSON.stringify(wf),
      JSON.stringify(prompts),
      JSON.stringify(exec),
      JSON.stringify(tools),
      String(body.changelog || "").slice(0, 4000),
    ]
  );
  await query(`UPDATE ccweb_marketplace_listings SET version_published = $2, updated_at = NOW() WHERE id = $1`, [listingId, nextV]);
  return { ok: true, version: nextV, id };
}

async function listAiVersions(listingId, limit = 20) {
  const lim = Math.min(50, Math.max(1, limit));
  const { rows } = await query(
    `SELECT id, listing_id, version, agent_config, workflow_graph, prompts, execution_config, tool_manifest, changelog, is_default, created_at
     FROM ccweb_marketplace_ai_versions WHERE listing_id = $1 ORDER BY version DESC LIMIT $2`,
    [listingId, lim]
  );
  return rows.map((r) => ({
    id: r.id,
    listingId: r.listing_id,
    version: r.version,
    agentConfig: r.agent_config,
    workflowGraph: r.workflow_graph,
    prompts: r.prompts,
    executionConfig: r.execution_config,
    toolManifest: r.tool_manifest,
    changelog: r.changelog,
    isDefault: r.is_default,
    createdAt: r.created_at,
  }));
}

async function getDefaultAiVersionPublic(listingId) {
  const { rows } = await query(
    `SELECT * FROM ccweb_marketplace_ai_versions WHERE listing_id = $1 AND is_default = TRUE ORDER BY version DESC LIMIT 1`,
    [listingId]
  );
  const r = rows[0];
  if (!r) return null;
  return {
    version: r.version,
    agentConfig: r.agent_config,
    workflowGraph: r.workflow_graph,
    prompts: r.prompts,
    executionConfig: r.execution_config,
    toolManifest: r.tool_manifest,
    changelog: r.changelog,
  };
}

/**
 * Idempotent fulfillment after Flutterwave charge completes.
 * @param {object} row ccweb_flutterwave_transactions row (RETURNING *)
 */
async function fulfillMarketplaceSkuFromTx(row) {
  if (!usePostgres() || !row) return { applied: false };
  const flw = require("./persistenceFlutterwave");
  const meta = typeof row.metadata === "object" ? row.metadata : {};
  const skuId = String(meta.marketplaceSkuId || "").trim();
  if (!skuId) return { applied: false, reason: "no_sku" };
  const sku = await getSkuById(skuId);
  if (!sku || !sku.active || sku.listingStatus !== "published") return { applied: false, reason: "invalid_sku" };
  if (String(sku.listingModerationStatus || "visible") !== "visible") return { applied: false, reason: "listing_not_public" };

  const pid = newId("mpp");
  const ins = await query(
    `INSERT INTO ccweb_marketplace_purchases (id, flutterwave_tx_id, buyer_user_id, sku_id, listing_id, amount_minor, currency, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'completed')
     ON CONFLICT (flutterwave_tx_id) DO NOTHING RETURNING id`,
    [pid, row.id, row.user_id, skuId, sku.listingId, row.amount_minor, row.currency]
  );
  if (!ins.rows[0]) return { applied: false, reason: "already_fulfilled" };

  const purchaseId = ins.rows[0].id;
  const days = sku.entitlementDays || (meta.entitlementDays != null ? Number(meta.entitlementDays) : null);
  const validUntil = days ? new Date(Date.now() + days * 86400000) : null;
  const eid = newId("mpe");
  await query(
    `INSERT INTO ccweb_marketplace_entitlements (id, user_id, listing_id, sku_id, purchase_id, valid_until, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
    [eid, row.user_id, sku.listingId, skuId, purchaseId, validUntil, JSON.stringify({ source: "flutterwave", txRef: row.tx_ref })]
  );

  const feeBps = flw.platformFeeBps();
  const { platformFeeMinor, creatorMinor } = flw.splitCreatorAmount(row.amount_minor, feeBps);
  const seller = sku.sellerUserId;
  if (seller && creatorMinor > 0) {
    if (row.currency === "USD") await flw.bumpWallet(seller, { usdCents: creatorMinor });
    else await flw.bumpWallet(seller, { ngn: creatorMinor });
    await query(
      `INSERT INTO ccweb_earnings (id, user_id, source, amount_usd, currency, reference_type, reference_id, metadata)
       VALUES ($1,$2,'marketplace_sku', $3, $4, 'flutterwave_tx', $5, $6::jsonb)`,
      [
        newId("earn"),
        seller,
        row.currency === "USD" ? creatorMinor / 100 : 0,
        row.currency,
        row.id,
        JSON.stringify({ skuId, listingId: sku.listingId, platformFeeMinor }),
      ]
    );
  }

  if (platformFeeMinor > 0) {
    await query(
      `INSERT INTO ccweb_metering_events (id, user_id, kind, amount_usd, platform_share_usd, metadata)
       VALUES ($1,$2,'flutterwave_platform_fee', $3, $3, $4::jsonb)`,
      [newId("met"), row.user_id, row.currency === "USD" ? platformFeeMinor / 100 : 0, JSON.stringify({ txRef: row.tx_ref, marketplaceSkuId: skuId })]
    );
  }

  return { applied: true, purchaseId };
}

async function reviewStatsForListing(listingId) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS c, COALESCE(AVG(rating), 0)::float AS avg
     FROM ccweb_marketplace_reviews WHERE listing_id = $1 AND status = 'visible'`,
    [listingId]
  );
  return { count: Number(rows[0]?.c || 0), avgRating: Number(rows[0]?.avg || 0) };
}

async function getListingPublicBundle(slug) {
  const listing = await getListingBySlug(slug);
  if (!listing) return null;
  const [skus, ai, reviews, reviewStats] = await Promise.all([
    listSkusForListing(listing.id, { onlyActive: true }),
    getDefaultAiVersionPublic(listing.id),
    listReviewsForListing(listing.id, 15),
    reviewStatsForListing(listing.id),
  ]);
  return { listing, skus, defaultAi: ai, reviews, reviewStats };
}

async function listEntitlementsForUser(userId, limit = 40) {
  const lim = Math.min(100, Math.max(1, limit));
  const { rows } = await query(
    `SELECT e.*, l.slug AS listing_slug, l.title AS listing_title
     FROM ccweb_marketplace_entitlements e
     JOIN ccweb_marketplace_listings l ON l.id = e.listing_id
     WHERE e.user_id = $1 AND (e.valid_until IS NULL OR e.valid_until > NOW())
     ORDER BY e.created_at DESC LIMIT $2`,
    [userId, lim]
  );
  return rows.map((r) => ({
    id: r.id,
    listingId: r.listing_id,
    listingSlug: r.listing_slug,
    listingTitle: r.listing_title,
    skuId: r.sku_id,
    validUntil: r.valid_until,
    createdAt: r.created_at,
  }));
}

async function listDistinctCategoriesPublic(limit = 40) {
  if (!usePostgres()) return [];
  const lim = Math.min(80, Math.max(1, limit));
  const { rows } = await query(
    `SELECT DISTINCT l.category_slug AS slug, COUNT(*)::int AS listing_count
     FROM ccweb_marketplace_listings l
     JOIN ccweb_marketplace_stores s ON s.id = l.store_id
     WHERE l.status = 'published' AND s.published = TRUE AND l.moderation_status = 'visible'
     GROUP BY l.category_slug
     ORDER BY listing_count DESC, slug ASC
     LIMIT $1`,
    [lim]
  );
  return rows.map((r) => ({ slug: r.slug, listingCount: Number(r.listing_count) || 0 }));
}

async function listRecommendations({ userId, limit = 12 } = {}) {
  if (!usePostgres()) return [];
  const lim = Math.min(40, Math.max(1, limit));
  if (userId) {
    const { rows } = await query(
      `SELECT l.*, s.slug AS store_slug, s.title AS store_title
       FROM ccweb_marketplace_listings l
       JOIN ccweb_marketplace_stores s ON s.id = l.store_id
       WHERE l.status = 'published' AND s.published = TRUE AND l.moderation_status = 'visible'
         AND l.category_slug IN (
           SELECT DISTINCT l2.category_slug FROM ccweb_marketplace_library lib
           JOIN ccweb_marketplace_listings l2 ON l2.id = lib.listing_id
           WHERE lib.user_id = $1
         )
       ORDER BY l.featured DESC, l.updated_at DESC
       LIMIT $2`,
      [userId, lim]
    );
    if (rows.length > 0) {
      return rows.map((r) => {
        const x = mapListingRow(r);
        x.storeSlug = r.store_slug;
        x.storeTitle = r.store_title;
        return x;
      });
    }
  }
  return listFeaturedListings(lim);
}

async function listTrendingStores(limit = 12) {
  if (!usePostgres()) return [];
  const lim = Math.min(40, Math.max(1, limit));
  const { rows } = await query(
    `SELECT s.*, COALESCE(agg.c, 0)::int AS sales_30d
     FROM ccweb_marketplace_stores s
     LEFT JOIN (
       SELECT l.store_id, COUNT(p.id)::int AS c
       FROM ccweb_marketplace_purchases p
       JOIN ccweb_marketplace_listings l ON l.id = p.listing_id AND l.status = 'published' AND l.moderation_status = 'visible'
       WHERE p.created_at > NOW() - INTERVAL '30 days'
       GROUP BY l.store_id
     ) agg ON agg.store_id = s.id
     WHERE s.published = TRUE
     ORDER BY COALESCE(agg.c, 0) DESC, s.updated_at DESC
     LIMIT $1`,
    [lim]
  );
  return rows.map((r) => ({
    ...mapStore(r),
    salesCount30d: Number(r.sales_30d) || 0,
  }));
}

async function listCreatorListings(ownerUserId, limit = 80) {
  if (!usePostgres() || !ownerUserId) return [];
  const lim = Math.min(120, Math.max(1, limit));
  const { rows } = await query(
    `SELECT l.* FROM ccweb_marketplace_listings l
     JOIN ccweb_marketplace_stores s ON s.id = l.store_id
     WHERE s.owner_user_id = $1
     ORDER BY l.updated_at DESC
     LIMIT $2`,
    [ownerUserId, lim]
  );
  return rows.map(mapListingRow);
}

async function getListingPrivateBundle(listingId, ownerUserId) {
  const { rows } = await query(
    `SELECT l.* FROM ccweb_marketplace_listings l
     JOIN ccweb_marketplace_stores s ON s.id = l.store_id
     WHERE l.id = $1 AND s.owner_user_id = $2 LIMIT 1`,
    [listingId, ownerUserId]
  );
  const row = rows[0];
  if (!row) return null;
  const listing = mapListingRow(row);
  const [skus, versions, reviews, stats] = await Promise.all([
    listSkusForListing(listing.id, { onlyActive: false }),
    listAiVersions(listing.id, 30),
    listReviewsForListing(listing.id, 50, { allStatuses: true }),
    reviewStatsForListing(listing.id),
  ]);
  return { listing, skus, aiVersions: versions, reviews, reviewStats: stats };
}

async function creatorMarketplaceSummary(ownerUserId) {
  if (!usePostgres() || !ownerUserId) return null;
  const storeRows = await query(`SELECT * FROM ccweb_marketplace_stores WHERE owner_user_id = $1 LIMIT 1`, [ownerUserId]);
  const store = mapStore(storeRows.rows[0]);
  const { rows: lc } = await query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE l.status = 'published' AND l.moderation_status = 'visible')::int AS live,
       COUNT(*) FILTER (WHERE l.moderation_status = 'pending_review')::int AS pending_review
     FROM ccweb_marketplace_listings l
     JOIN ccweb_marketplace_stores s ON s.id = l.store_id
     WHERE s.owner_user_id = $1`,
    [ownerUserId]
  );
  const { rows: sales } = await query(
    `SELECT COUNT(*)::int AS c, COALESCE(SUM(p.amount_minor), 0)::bigint AS vol_minor, p.currency
     FROM ccweb_marketplace_purchases p
     JOIN ccweb_marketplace_listings l ON l.id = p.listing_id
     JOIN ccweb_marketplace_stores s ON s.id = l.store_id
     WHERE s.owner_user_id = $1 AND p.created_at > NOW() - INTERVAL '30 days'
     GROUP BY p.currency`,
    [ownerUserId]
  );
  const { rows: rv } = await query(
    `SELECT COUNT(*)::int AS c, COALESCE(AVG(r.rating), 0)::float AS avg
     FROM ccweb_marketplace_reviews r
     JOIN ccweb_marketplace_listings l ON l.id = r.listing_id
     JOIN ccweb_marketplace_stores s ON s.id = l.store_id
     WHERE s.owner_user_id = $1 AND r.status = 'visible'`,
    [ownerUserId]
  );
  return {
    store,
    listings: {
      total: Number(lc[0]?.total || 0),
      live: Number(lc[0]?.live || 0),
      pendingReview: Number(lc[0]?.pending_review || 0),
    },
    salesLast30dByCurrency: sales.map((r) => ({
      currency: r.currency,
      count: Number(r.c || 0),
      volumeMinor: Number(r.vol_minor || 0),
    })),
    reviews: { count: Number(rv[0]?.c || 0), avgRating: Number(rv[0]?.avg || 0) },
  };
}

async function listCreatorMarketplaceSales(ownerUserId, limit = 50) {
  if (!usePostgres() || !ownerUserId) return [];
  const lim = Math.min(120, Math.max(1, limit));
  const { rows } = await query(
    `SELECT p.*, l.slug AS listing_slug, l.title AS listing_title, k.label AS sku_label
     FROM ccweb_marketplace_purchases p
     JOIN ccweb_marketplace_listings l ON l.id = p.listing_id
     JOIN ccweb_marketplace_stores s ON s.id = l.store_id
     LEFT JOIN ccweb_marketplace_skus k ON k.id = p.sku_id
     WHERE s.owner_user_id = $1
     ORDER BY p.created_at DESC
     LIMIT $2`,
    [ownerUserId, lim]
  );
  return rows.map((r) => ({
    id: r.id,
    buyerUserId: r.buyer_user_id,
    listingSlug: r.listing_slug,
    listingTitle: r.listing_title,
    skuLabel: r.sku_label,
    amountMinor: Number(r.amount_minor),
    currency: r.currency,
    status: r.status,
    createdAt: r.created_at,
  }));
}

async function listCreatorIncomingReviews(ownerUserId, limit = 40) {
  if (!usePostgres() || !ownerUserId) return [];
  const lim = Math.min(100, Math.max(1, limit));
  const { rows } = await query(
    `SELECT r.id, r.listing_id, r.author_user_id, r.rating, r.title, r.body, r.created_at,
            l.slug AS listing_slug, l.title AS listing_title
     FROM ccweb_marketplace_reviews r
     JOIN ccweb_marketplace_listings l ON l.id = r.listing_id
     JOIN ccweb_marketplace_stores s ON s.id = l.store_id
     WHERE s.owner_user_id = $1 AND r.status = 'visible'
     ORDER BY r.created_at DESC
     LIMIT $2`,
    [ownerUserId, lim]
  );
  return rows.map((r) => ({
    id: r.id,
    listingId: r.listing_id,
    listingSlug: r.listing_slug,
    listingTitle: r.listing_title,
    authorUserId: r.author_user_id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    createdAt: r.created_at,
  }));
}

async function listListingPerformance(ownerUserId, limit = 40) {
  if (!usePostgres() || !ownerUserId) return [];
  const lim = Math.min(80, Math.max(1, limit));
  const { rows } = await query(
    `SELECT l.id, l.slug, l.title, l.status, l.moderation_status, l.category_slug,
            COUNT(DISTINCT p.id)::int AS purchase_count,
            (SELECT COUNT(*)::int FROM ccweb_marketplace_reviews r WHERE r.listing_id = l.id AND r.status = 'visible') AS review_count,
            (SELECT COALESCE(AVG(r2.rating), 0)::float FROM ccweb_marketplace_reviews r2 WHERE r2.listing_id = l.id AND r2.status = 'visible') AS review_avg
     FROM ccweb_marketplace_listings l
     JOIN ccweb_marketplace_stores s ON s.id = l.store_id
     LEFT JOIN ccweb_marketplace_purchases p ON p.listing_id = l.id
     WHERE s.owner_user_id = $1
     GROUP BY l.id
     ORDER BY purchase_count DESC, l.updated_at DESC
     LIMIT $2`,
    [ownerUserId, lim]
  );
  return rows.map((r) => ({
    listingId: r.id,
    slug: r.slug,
    title: r.title,
    status: r.status,
    moderationStatus: r.moderation_status,
    categorySlug: r.category_slug,
    purchaseCount: Number(r.purchase_count) || 0,
    reviewCount: Number(r.review_count) || 0,
    reviewAvg: Number(r.review_avg) || 0,
  }));
}

async function saveLibraryEntry(userId, listingSlug) {
  if (!usePostgres() || !userId || !listingSlug) return { ok: false, error: "bad_input" };
  const listing = await getListingBySlug(String(listingSlug).trim());
  if (!listing) return { ok: false, error: "not_found" };
  await ensureCcwebUser(userId);
  await query(
    `INSERT INTO ccweb_marketplace_library (user_id, listing_id) VALUES ($1, $2)
     ON CONFLICT (user_id, listing_id) DO UPDATE SET created_at = EXCLUDED.created_at`,
    [userId, listing.id]
  );
  return { ok: true, listingId: listing.id };
}

async function removeLibraryEntry(userId, listingSlug) {
  const listing = await getListingBySlug(String(listingSlug).trim());
  if (!listing) return { ok: false, error: "not_found" };
  await query(`DELETE FROM ccweb_marketplace_library WHERE user_id = $1 AND listing_id = $2`, [userId, listing.id]);
  return { ok: true };
}

async function listLibraryForUser(userId, limit = 40) {
  if (!usePostgres() || !userId) return [];
  const lim = Math.min(100, Math.max(1, limit));
  const { rows } = await query(
    `SELECT l.*, s.slug AS store_slug, s.title AS store_title, lib.created_at AS saved_at
     FROM ccweb_marketplace_library lib
     JOIN ccweb_marketplace_listings l ON l.id = lib.listing_id
     JOIN ccweb_marketplace_stores s ON s.id = l.store_id
     WHERE lib.user_id = $1 AND l.status = 'published' AND l.moderation_status = 'visible' AND s.published = TRUE
     ORDER BY lib.created_at DESC
     LIMIT $2`,
    [userId, lim]
  );
  return rows.map((r) => {
    const x = mapListingRow(r);
    x.storeSlug = r.store_slug;
    x.storeTitle = r.store_title;
    x.savedAt = r.saved_at;
    return x;
  });
}

async function adminListListingsByModeration(moderationStatus, limit = 80) {
  if (!usePostgres()) return [];
  const lim = Math.min(200, Math.max(1, limit));
  const st = String(moderationStatus || "pending_review").trim();
  const { rows } = await query(
    `SELECT l.*, s.slug AS store_slug, s.title AS store_title, s.owner_user_id
     FROM ccweb_marketplace_listings l
     JOIN ccweb_marketplace_stores s ON s.id = l.store_id
     WHERE l.moderation_status = $1 AND l.status = 'published'
     ORDER BY l.updated_at DESC
     LIMIT $2`,
    [st, lim]
  );
  return rows.map((r) => {
    const x = mapListingRow(r);
    x.storeSlug = r.store_slug;
    x.storeTitle = r.store_title;
    x.storeOwnerId = r.owner_user_id;
    return x;
  });
}

async function adminSetListingModeration(listingId, moderationStatus) {
  const st = String(moderationStatus || "").trim();
  if (!["visible", "pending_review", "hidden", "rejected"].includes(st)) return { ok: false, error: "bad_status" };
  const { rowCount } = await query(`UPDATE ccweb_marketplace_listings SET moderation_status = $2, updated_at = NOW() WHERE id = $1`, [
    listingId,
    st,
  ]);
  return { ok: rowCount > 0 };
}

async function adminSetStoreVerified(storeId, verified) {
  const { rowCount } = await query(`UPDATE ccweb_marketplace_stores SET creator_verified = $2, updated_at = NOW() WHERE id = $1`, [
    storeId,
    Boolean(verified),
  ]);
  return { ok: rowCount > 0 };
}

async function assertUserOwnsListing(listingId, userId) {
  const { rows } = await query(
    `SELECT 1 FROM ccweb_marketplace_listings l
     JOIN ccweb_marketplace_stores s ON s.id = l.store_id
     WHERE l.id = $1 AND s.owner_user_id = $2 LIMIT 1`,
    [listingId, userId]
  );
  return rows.length > 0;
}

module.exports = {
  usePostgres,
  getOrCreateStoreForUser,
  getStoreBySlug,
  listPublishedListingsForStore,
  createListing,
  updateListing,
  getListingBySlug,
  listListingsPublic,
  listFeaturedListings,
  listTrendingListings,
  listDistinctCategoriesPublic,
  listRecommendations,
  listTrendingStores,
  getSkuById,
  addSku,
  listSkusForListing,
  createReview,
  listReviewsForListing,
  upsertAiVersion,
  listAiVersions,
  getDefaultAiVersionPublic,
  fulfillMarketplaceSkuFromTx,
  mapListingRow,
  getListingPublicBundle,
  listEntitlementsForUser,
  listCreatorListings,
  getListingPrivateBundle,
  creatorMarketplaceSummary,
  listCreatorMarketplaceSales,
  listCreatorIncomingReviews,
  listListingPerformance,
  saveLibraryEntry,
  removeLibraryEntry,
  listLibraryForUser,
  adminListListingsByModeration,
  adminSetListingModeration,
  adminSetStoreVerified,
  assertUserOwnsListing,
};
