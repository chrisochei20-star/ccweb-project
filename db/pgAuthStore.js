/**
 * PostgreSQL-backed auth users (when DATABASE_URL is set).
 * Schema: db/schema.sql — table ccweb_auth_users
 */

const crypto = require("crypto");
const { query } = require("./pool");

function normalizeEmail(e) {
  return String(e || "")
    .trim()
    .toLowerCase();
}

function fromRow(r) {
  if (!r) return null;
  return {
    id: r.id,
    email: r.email,
    emailVerified: Boolean(r.email_verified),
    passwordHash: r.password_hash,
    walletEvm: r.wallet_evm,
    walletSol: r.wallet_sol,
    totpSecretEnc: r.totp_secret_enc,
    totpEnabled: Boolean(r.totp_enabled),
    backupCodesHashed: Array.isArray(r.backup_codes_hashed) ? r.backup_codes_hashed : r.backup_codes_hashed || [],
    refreshFamilyId: r.refresh_family_id,
    refreshTokenHash: r.refresh_token_hash,
    failedLoginAttempts: r.failed_login_attempts || 0,
    lockedUntil: r.locked_until ? new Date(r.locked_until).getTime() : null,
    emailVerifyToken: r.email_verify_token,
    emailVerifyExpires: r.email_verify_expires ? new Date(r.email_verify_expires).getTime() : null,
    passwordResetToken: r.password_reset_token,
    passwordResetExpires: r.password_reset_expires ? new Date(r.password_reset_expires).getTime() : null,
    oauthProvider: r.oauth_provider || null,
    oauthSub: r.oauth_sub || null,
    appleSub: r.apple_sub || null,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
  };
}

function toRow(u) {
  return {
    id: u.id,
    email: u.email,
    email_verified: Boolean(u.emailVerified),
    password_hash: u.passwordHash,
    wallet_evm: u.walletEvm,
    wallet_sol: u.walletSol,
    totp_secret_enc: u.totpSecretEnc,
    totp_enabled: Boolean(u.totpEnabled),
    backup_codes_hashed: JSON.stringify(u.backupCodesHashed || []),
    refresh_family_id: u.refreshFamilyId,
    refresh_token_hash: u.refreshTokenHash,
    failed_login_attempts: u.failedLoginAttempts || 0,
    locked_until: u.lockedUntil ? new Date(u.lockedUntil) : null,
    email_verify_token: u.emailVerifyToken,
    email_verify_expires: u.emailVerifyExpires ? new Date(u.emailVerifyExpires) : null,
    password_reset_token: u.passwordResetToken,
    password_reset_expires: u.passwordResetExpires ? new Date(u.passwordResetExpires) : null,
    oauth_provider: u.oauthProvider || null,
    oauth_sub: u.oauthSub || null,
    apple_sub: u.appleSub || null,
  };
}

async function findByEmail(email) {
  const em = normalizeEmail(email);
  const { rows } = await query("SELECT * FROM ccweb_auth_users WHERE email = $1", [em]);
  return fromRow(rows[0]);
}

async function findByVerifyToken(token) {
  const t = String(token || "").trim();
  if (!t) return null;
  const { rows } = await query("SELECT * FROM ccweb_auth_users WHERE email_verify_token = $1", [t]);
  return fromRow(rows[0]);
}

async function findById(id) {
  const { rows } = await query("SELECT * FROM ccweb_auth_users WHERE id = $1", [id]);
  return fromRow(rows[0]);
}

async function findByWalletEvm(addr) {
  if (!addr) return null;
  const { rows } = await query("SELECT * FROM ccweb_auth_users WHERE wallet_evm = $1", [String(addr).toLowerCase()]);
  return fromRow(rows[0]);
}

async function findByWalletSol(addr) {
  if (!addr) return null;
  const { rows } = await query("SELECT * FROM ccweb_auth_users WHERE wallet_sol = $1", [addr]);
  return fromRow(rows[0]);
}

async function findByOAuth(provider, sub) {
  const p = String(provider || "").trim();
  const s = String(sub || "").trim();
  if (!p || !s) return null;
  const { rows } = await query("SELECT * FROM ccweb_auth_users WHERE oauth_provider = $1 AND oauth_sub = $2", [p, s]);
  return fromRow(rows[0]);
}

async function findByAppleSub(sub) {
  const s = String(sub || "").trim();
  if (!s) return null;
  const { rows } = await query("SELECT * FROM ccweb_auth_users WHERE apple_sub = $1", [s]);
  return fromRow(rows[0]);
}

async function saveUser(row) {
  const u = { ...row, updatedAt: new Date().toISOString() };
  const t = toRow(u);
  await query(
    `UPDATE ccweb_auth_users SET
      email = $2, email_verified = $3, password_hash = $4, wallet_evm = $5, wallet_sol = $6,
      totp_secret_enc = $7, totp_enabled = $8, backup_codes_hashed = $9::jsonb,
      refresh_family_id = $10, refresh_token_hash = $11, failed_login_attempts = $12, locked_until = $13,
      email_verify_token = $14, email_verify_expires = $15, password_reset_token = $16, password_reset_expires = $17,
      oauth_provider = $18, oauth_sub = $19, apple_sub = $20, updated_at = NOW()
     WHERE id = $1`,
    [
      t.id,
      t.email,
      t.email_verified,
      t.password_hash,
      t.wallet_evm,
      t.wallet_sol,
      t.totp_secret_enc,
      t.totp_enabled,
      t.backup_codes_hashed,
      t.refresh_family_id,
      t.refresh_token_hash,
      t.failed_login_attempts,
      t.locked_until,
      t.email_verify_token,
      t.email_verify_expires,
      t.password_reset_token,
      t.password_reset_expires,
      t.oauth_provider,
      t.oauth_sub,
      t.apple_sub,
    ]
  );
}

async function createUser(row) {
  const id = row.id || `usr-${crypto.randomUUID().slice(0, 12)}`;
  const u = {
    id,
    email: row.email ? normalizeEmail(row.email) : null,
    emailVerified: Boolean(row.emailVerified),
    passwordHash: row.passwordHash || null,
    walletEvm: row.walletEvm ? String(row.walletEvm).toLowerCase() : null,
    walletSol: row.walletSol || null,
    totpSecretEnc: row.totpSecretEnc || null,
    totpEnabled: Boolean(row.totpEnabled),
    backupCodesHashed: Array.isArray(row.backupCodesHashed) ? row.backupCodesHashed : [],
    refreshFamilyId: row.refreshFamilyId || null,
    refreshTokenHash: row.refreshTokenHash || null,
    failedLoginAttempts: row.failedLoginAttempts || 0,
    lockedUntil: row.lockedUntil || null,
    emailVerifyToken: row.emailVerifyToken || null,
    emailVerifyExpires: row.emailVerifyExpires || null,
    passwordResetToken: row.passwordResetToken || null,
    passwordResetExpires: row.passwordResetExpires || null,
    oauthProvider: row.oauthProvider || null,
    oauthSub: row.oauthSub || null,
    appleSub: row.appleSub || null,
    createdAt: row.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const t = toRow(u);
  try {
    await query(
      `INSERT INTO ccweb_auth_users (
        id, email, email_verified, password_hash, wallet_evm, wallet_sol, totp_secret_enc, totp_enabled, backup_codes_hashed,
        refresh_family_id, refresh_token_hash, failed_login_attempts, locked_until,
        email_verify_token, email_verify_expires, password_reset_token, password_reset_expires,
        oauth_provider, oauth_sub, apple_sub, created_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,NOW(),NOW()
      )`,
      [
        t.id,
        t.email,
        t.email_verified,
        t.password_hash,
        t.wallet_evm,
        t.wallet_sol,
        t.totp_secret_enc,
        t.totp_enabled,
        t.backup_codes_hashed,
        t.refresh_family_id,
        t.refresh_token_hash,
        t.failed_login_attempts,
        t.locked_until,
        t.email_verify_token,
        t.email_verify_expires,
        t.password_reset_token,
        t.password_reset_expires,
        t.oauth_provider,
        t.oauth_sub,
        t.apple_sub,
      ]
    );
  } catch (e) {
    if (e.code === "23505") throw new Error("DUPLICATE");
    throw e;
  }
  return u;
}

module.exports = {
  normalizeEmail,
  findByEmail,
  findById,
  findByWalletEvm,
  findByWalletSol,
  findByVerifyToken,
  findByOAuth,
  findByAppleSub,
  saveUser,
  createUser,
};
