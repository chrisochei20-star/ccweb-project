/**
 * Beta testing: public profile slugs, invite codes, session / feature analytics.
 */

const crypto = require("crypto");
const { query } = require("./pool");

function usePostgres() {
  return Boolean((process.env.DATABASE_URL || "").trim());
}

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

const SLUG_RE = /^[a-z0-9]([a-z0-9-]{1,30}[a-z0-9])?$/;

function normalizeSlug(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function hashIp(ip, salt) {
  const raw = String(ip || "");
  if (!raw || !salt) return null;
  return crypto.createHash("sha256").update(`${salt}:${raw}`).digest("hex").slice(0, 16);
}

async function resolveSlug(slug) {
  if (!usePostgres()) return null;
  const s = normalizeSlug(slug);
  if (!s || !SLUG_RE.test(s)) return null;
  const { rows } = await query(
    `SELECT s.user_id, s.slug
     FROM ccweb_profile_slugs s
     WHERE s.slug = $1`,
    [s]
  );
  const r = rows[0];
  if (!r) return null;
  return { userId: r.user_id, slug: r.slug };
}

async function setMySlug(userId, requestedSlug) {
  if (!usePostgres() || !userId) return { ok: false, error: "no_database" };
  const s = normalizeSlug(requestedSlug);
  if (!s || s.length < 3) return { ok: false, error: "slug_too_short" };
  if (!SLUG_RE.test(s)) return { ok: false, error: "invalid_slug" };
  const reserved = new Set(["admin", "api", "login", "signup", "health", "auth", "invite", "test", "u", "beta"]);
  if (reserved.has(s)) return { ok: false, error: "reserved" };
  try {
    await query(
      `INSERT INTO ccweb_profile_slugs (user_id, slug) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET slug = EXCLUDED.slug, updated_at = NOW()`,
      [userId, s]
    );
    return { ok: true, slug: s };
  } catch (e) {
    if (String(e.message || "").includes("unique") || e.code === "23505") {
      return { ok: false, error: "slug_taken" };
    }
    throw e;
  }
}

async function getInvite(code) {
  if (!usePostgres()) return null;
  const c = String(code || "")
    .trim()
    .toLowerCase()
    .slice(0, 64);
  if (!c) return null;
  const { rows } = await query(`SELECT code, label, expires_at FROM ccweb_beta_invites WHERE code = $1`, [c]);
  const r = rows[0];
  if (!r) return null;
  if (r.expires_at && new Date(r.expires_at) < new Date()) return { expired: true, code: c };
  return { code: r.code, label: r.label, valid: true };
}

async function recordBetaEvent({
  userId,
  inviteCode,
  slug,
  eventType,
  path,
  featureKey,
  userAgent,
  clientIp,
  metadata,
}) {
  if (!usePostgres()) return { skipped: true };
  const salt = (process.env.CCWEB_BETA_IP_SALT || process.env.AUTH_JWT_SECRET || "ccweb-beta").slice(0, 32);
  const ipHash = hashIp(clientIp, salt);
  await query(
    `INSERT INTO ccweb_beta_events (id, user_id, invite_code, slug, event_type, path, feature_key, user_agent, ip_hash, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`,
    [
      newId("bev"),
      userId || null,
      inviteCode ? String(inviteCode).trim().slice(0, 64) : null,
      slug ? normalizeSlug(slug) : null,
      String(eventType || "session").slice(0, 64),
      path ? String(path).slice(0, 512) : null,
      featureKey ? String(featureKey).slice(0, 128) : null,
      userAgent ? String(userAgent).slice(0, 512) : null,
      ipHash,
      JSON.stringify(typeof metadata === "object" && metadata ? metadata : {}),
    ]
  );
  return { ok: true };
}

async function betaAnalyticsSummary(sinceDays = 30) {
  if (!usePostgres()) return null;
  const d = Math.min(365, Math.max(1, sinceDays));
  const { rows: tot } = await query(
    `SELECT COUNT(*)::int AS c FROM ccweb_beta_events WHERE created_at >= NOW() - ($1 * INTERVAL '1 day')`,
    [d]
  );
  const { rows: byInvite } = await query(
    `SELECT invite_code, COUNT(*)::int AS c FROM ccweb_beta_events
     WHERE created_at >= NOW() - ($1 * INTERVAL '1 day') AND invite_code IS NOT NULL
     GROUP BY invite_code ORDER BY c DESC LIMIT 25`,
    [d]
  );
  const { rows: bySlug } = await query(
    `SELECT slug, COUNT(*)::int AS c FROM ccweb_beta_events
     WHERE created_at >= NOW() - ($1 * INTERVAL '1 day') AND slug IS NOT NULL
     GROUP BY slug ORDER BY c DESC LIMIT 25`,
    [d]
  );
  return {
    windowDays: d,
    totalEvents: tot[0]?.c || 0,
    topInvites: byInvite.map((x) => ({ inviteCode: x.invite_code, hits: x.c })),
    topSlugs: bySlug.map((x) => ({ slug: x.slug, hits: x.c })),
  };
}

async function createInvite({ code, label, expiresAt }) {
  if (!usePostgres()) return { ok: false, error: "no_database" };
  const c = String(code || "")
    .trim()
    .toLowerCase()
    .slice(0, 64);
  if (!c || c.length < 4) return { ok: false, error: "invalid_code" };
  await query(
    `INSERT INTO ccweb_beta_invites (code, label, expires_at) VALUES ($1,$2,$3)
     ON CONFLICT (code) DO UPDATE SET label = COALESCE(EXCLUDED.label, ccweb_beta_invites.label), expires_at = COALESCE(EXCLUDED.expires_at, ccweb_beta_invites.expires_at)`,
    [c, label ? String(label).slice(0, 120) : null, expiresAt ? new Date(expiresAt) : null]
  );
  return { ok: true, code: c };
}

async function getSlugForUser(userId) {
  if (!usePostgres() || !userId) return null;
  const { rows } = await query(`SELECT slug FROM ccweb_profile_slugs WHERE user_id = $1`, [userId]);
  return rows[0]?.slug || null;
}

module.exports = {
  usePostgres,
  normalizeSlug,
  resolveSlug,
  setMySlug,
  getSlugForUser,
  getInvite,
  recordBetaEvent,
  betaAnalyticsSummary,
  createInvite,
};
