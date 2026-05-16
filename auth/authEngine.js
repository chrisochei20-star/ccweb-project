/**
 * Auth engine: bcrypt, JWT access/refresh, TOTP 2FA, wallet sign-in, rate limits.
 */

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const authStore = require("./authStore");
const jwtTokens = require("./jwtTokens");
const totp = require("./totp");
const { encryptSecret, decryptSecret } = require("./cryptoSecret");
const { buildSignInMessage, verifyEvmWallet, verifySolanaWallet, randomNonce, normalizeEvmAddress } = require("./walletVerify");
const rateLimit = require("./rateLimit");
const { logger } = require("../logging/logger");

const BCRYPT_ROUNDS = 12;
const MAX_LOGIN_FAILS = 8;
const LOCKOUT_MS = 15 * 60 * 1000;
const NONCE_MS = 10 * 60 * 1000;

/** @type {Map<string, { nonce: string, message: string, expiresAt: number, chainType: string }>} */
const walletNonces = new Map();

function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(String(token), "utf8").digest("hex");
}

async function persistNewUserProfile(userId, profile) {
  if (!(process.env.DATABASE_URL || "").trim()) return;
  try {
    const pgUserProfile = require("../db/pgUserProfile");
    await pgUserProfile.upsert({
      userId,
      displayName: profile.displayName,
      roles: profile.roles,
      isOrganic: profile.isOrganic,
      pushEnabled: profile.pushEnabled,
    });
  } catch (e) {
    logger.warn({ msg: "profile_persist_skipped", userId, err: e.message });
  }
}

/**
 * Load or create the in-memory profile from PostgreSQL (auth row + ccweb_user_profiles).
 * Required after API restart — ccwebUsers Map alone loses entries while JWT/auth rows persist.
 */
async function ensureUserProfile(ccwebUsers, buildUserProfile, userId) {
  let user = ccwebUsers.get(userId);
  if (user) return user;
  const row = await authStore.findById(userId);
  if (!row) return null;

  let displayName = row.email ? row.email.split("@")[0] : "Member";
  let roles = ["member"];
  let isOrganic = true;
  let pushEnabled = true;

  let avatarUrl = null;
  let bannerUrl = null;

  if ((process.env.DATABASE_URL || "").trim()) {
    try {
      const pgUserProfile = require("../db/pgUserProfile");
      const prof = await pgUserProfile.findByUserId(userId);
      if (prof) {
        displayName = prof.display_name || displayName;
        roles = pgUserProfile.parseRoles(prof.roles);
        isOrganic = prof.is_organic !== false;
        pushEnabled = prof.push_enabled !== false;
        avatarUrl = prof.avatar_url || null;
        bannerUrl = prof.banner_url || null;
      }
    } catch (e) {
      logger.warn({ msg: "profile_row_load_failed", userId, err: e.message });
    }
  }

  user = buildUserProfile(
    {
      userId: row.id,
      displayName,
      email: row.email,
      roles,
      isOrganic,
      pushEnabled,
      avatarUrl,
      bannerUrl,
    },
    null
  );
  ccwebUsers.set(userId, user);
  return user;
}

async function issueTokenPair(row, user) {
  const familyId = row.refreshFamilyId || jwtTokens.newFamilyId();
  const refresh = jwtTokens.signRefreshToken(row.id, familyId);
  const access = jwtTokens.signAccessToken(row.id, { ev: row.emailVerified ? 1 : 0 });
  row.refreshFamilyId = familyId;
  row.refreshTokenHash = hashRefreshToken(refresh);
  await authStore.saveUser(row);
  return {
    accessToken: access,
    refreshToken: refresh,
    tokenType: "Bearer",
    expiresIn: jwtTokens.ACCESS_EXPIRES,
    user,
  };
}

async function registerUser(ccwebUsers, buildUserProfile, { email, password, displayName }) {
  const em = authStore.normalizeEmail(email);
  if (!em || !em.includes("@")) return { error: "Valid email is required." };
  if (!password || String(password).length < 8) return { error: "Password must be at least 8 characters." };

  const existing = await authStore.findByEmail(em);
  if (existing) return { error: "An account with this email already exists." };

  const passwordHash = await bcrypt.hash(String(password), BCRYPT_ROUNDS);
  const verifyToken = crypto.randomBytes(24).toString("hex");
  const userId = `usr-${crypto.randomUUID().slice(0, 12)}`;

  try {
    await authStore.createUser({
      id: userId,
      email: em,
      emailVerified: false,
      passwordHash,
      walletEvm: null,
      walletSol: null,
      totpSecretEnc: null,
      totpEnabled: false,
      backupCodesHashed: [],
      refreshFamilyId: null,
      refreshTokenHash: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      emailVerifyToken: verifyToken,
      emailVerifyExpires: Date.now() + 1000 * 60 * 60 * 48,
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  } catch (e) {
    if (e.message === "DUPLICATE") return { error: "An account with this email already exists." };
    throw e;
  }

  const profile = buildUserProfile(
    { userId, displayName: (displayName || em.split("@")[0] || "Member").toString().trim(), email: em, roles: ["member"] },
    null
  );
  ccwebUsers.set(userId, profile);
  await persistNewUserProfile(userId, profile);

  return {
    user: profile,
    emailVerificationSent: true,
    verifyEmailHint:
      process.env.AUTH_DEBUG === "1"
        ? `Dev: visit ${String(process.env.PUBLIC_APP_URL || "").replace(/\/$/, "")}/verify-email?token=${verifyToken}`
        : "Confirm your email via the verification link (configure SMTP for delivery). You can still sign in beforehand.",
  };
}

async function loginPasswordStep(ccwebUsers, buildUserProfile, { email, password, ip }) {
  const rl = rateLimit.check("login", ip, 25, 15 * 60 * 1000);
  if (!rl.ok) return { error: "Too many attempts. Try again later.", retryAfterSec: rl.retryAfterSec, status: 429 };

  const em = authStore.normalizeEmail(email);
  const row = await authStore.findByEmail(em);
  if (!row || !row.passwordHash) {
    return { error: "Invalid email or password.", code: "INVALID_CREDENTIALS" };
  }
  if (row.lockedUntil && row.lockedUntil > Date.now()) {
    return { error: "Account temporarily locked. Try again later.", status: 423 };
  }

  const ok = await bcrypt.compare(String(password), row.passwordHash);
  if (!ok) {
    row.failedLoginAttempts = (row.failedLoginAttempts || 0) + 1;
    if (row.failedLoginAttempts >= MAX_LOGIN_FAILS) {
      row.lockedUntil = Date.now() + LOCKOUT_MS;
    }
    await authStore.saveUser(row);
    return { error: "Invalid email or password.", code: "INVALID_CREDENTIALS" };
  }

  row.failedLoginAttempts = 0;
  row.lockedUntil = null;
  await authStore.saveUser(row);

  const user = await ensureUserProfile(ccwebUsers, buildUserProfile, row.id);
  if (!user) return { error: "Unable to load account profile.", code: "PROFILE_MISSING" };

  if (row.totpEnabled) {
    const pending = jwtTokens.signTwoFactorPending(row.id);
    return { needsTwoFactor: true, twoFactorToken: pending };
  }

  return await issueTokenPair(row, user);
}

async function verifyTwoFactorLogin(ccwebUsers, buildUserProfile, { twoFactorToken, code, ip }) {
  const payload = jwtTokens.verifyTwoFactorPending(twoFactorToken);
  if (!payload) return { error: "Invalid or expired 2FA session." };

  const row = await authStore.findById(payload.sub);
  if (!row || !row.totpEnabled) return { error: "2FA not enabled for this account." };

  const rl = rateLimit.check("2fa", ip, 30, 10 * 60 * 1000);
  if (!rl.ok) return { error: "Too many 2FA attempts.", retryAfterSec: rl.retryAfterSec, status: 429 };

  let valid = false;
  if (row.totpSecretEnc) {
    const sec = decryptSecret(row.totpSecretEnc);
    if (sec && totp.verifyTotp(sec, code)) valid = true;
  }
  if (!valid) {
    const backup = await totp.consumeBackupCode(code, row.backupCodesHashed || []);
    if (backup.ok) {
      valid = true;
      row.backupCodesHashed = backup.remaining;
    }
  }
  if (!valid) {
    await authStore.saveUser(row);
    return { error: "Invalid two-factor code." };
  }

  const user = await ensureUserProfile(ccwebUsers, buildUserProfile, row.id);
  if (!user) return { error: "Unable to load account profile.", code: "PROFILE_MISSING" };
  return await issueTokenPair(row, user);
}

async function setupTwoFactorBegin(userId) {
  const row = await authStore.findById(userId);
  if (!row) return { error: "User not found." };
  const secret = totp.generateSecret();
  row.totpSecretEnc = encryptSecret(secret);
  row.totpEnabled = false;
  await authStore.saveUser(row);
  const email = row.email || "user";
  return { secret, otpauthUrl: totp.otpauthUrl({ email, issuer: "CCWEB", secret }) };
}

async function setupTwoFactorConfirm(userId, code) {
  const row = await authStore.findById(userId);
  if (!row || !row.totpSecretEnc) return { error: "Start setup first." };
  const sec = decryptSecret(row.totpSecretEnc);
  if (!sec || !totp.verifyTotp(sec, code)) return { error: "Invalid authenticator code." };
  const backupPlain = totp.generateBackupCodes(10);
  const backupCodesHashed = await totp.hashBackupCodes(backupPlain);
  row.totpEnabled = true;
  row.backupCodesHashed = backupCodesHashed;
  await authStore.saveUser(row);
  return { ok: true, backupCodes: backupPlain };
}

async function refreshTokens(ccwebUsers, buildUserProfile, refreshToken) {
  const payload = jwtTokens.verifyToken(refreshToken, "refresh");
  if (!payload || !payload.sub) return { error: "Invalid refresh token." };
  const row = await authStore.findById(payload.sub);
  if (!row || !row.refreshTokenHash || row.refreshTokenHash !== hashRefreshToken(refreshToken)) {
    return { error: "Invalid or revoked refresh token." };
  }
  if (payload.fid && row.refreshFamilyId && payload.fid !== row.refreshFamilyId) {
    return { error: "Refresh token family mismatch." };
  }
  const user = await ensureUserProfile(ccwebUsers, buildUserProfile, row.id);
  if (!user) return { error: "Unable to load account profile.", code: "PROFILE_MISSING" };
  return await issueTokenPair(row, user);
}

async function logoutAccessToken(accessToken, refreshToken) {
  const accessPayload = jwtTokens.verifyToken(accessToken, "access");
  if (accessPayload?.sub) {
    const row = await authStore.findById(accessPayload.sub);
    if (row) {
      row.refreshTokenHash = null;
      row.refreshFamilyId = jwtTokens.newFamilyId();
      await authStore.saveUser(row);
    }
  }
  if (refreshToken) {
    const p = jwtTokens.verifyToken(refreshToken, "refresh");
    if (p?.sub) {
      const row = await authStore.findById(p.sub);
      if (row && row.refreshTokenHash === hashRefreshToken(refreshToken)) {
        row.refreshTokenHash = null;
        await authStore.saveUser(row);
      }
    }
  }
}

function getUserIdFromAccess(accessToken) {
  const p = jwtTokens.verifyToken(accessToken, "access");
  return p?.sub || null;
}

async function requestPasswordReset(email) {
  const em = authStore.normalizeEmail(email);
  const row = await authStore.findByEmail(em);
  const token = crypto.randomBytes(24).toString("hex");
  if (row) {
    row.passwordResetToken = token;
    row.passwordResetExpires = Date.now() + 1000 * 60 * 30;
    await authStore.saveUser(row);
  }
  return {
    ok: true,
    message: "If an account exists for this email, reset instructions have been recorded.",
    debugToken: process.env.AUTH_DEBUG === "1" && row ? token : undefined,
  };
}

async function completePasswordReset({ email, token, newPassword }) {
  const em = authStore.normalizeEmail(email);
  const row = await authStore.findByEmail(em);
  if (!row || row.passwordResetToken !== String(token || "").trim() || !row.passwordResetExpires || row.passwordResetExpires < Date.now()) {
    return { error: "Invalid or expired reset token." };
  }
  if (!newPassword || String(newPassword).length < 8) return { error: "Password must be at least 8 characters." };
  row.passwordHash = await bcrypt.hash(String(newPassword), BCRYPT_ROUNDS);
  row.passwordResetToken = null;
  row.passwordResetExpires = null;
  row.refreshTokenHash = null;
  row.refreshFamilyId = jwtTokens.newFamilyId();
  await authStore.saveUser(row);
  return { ok: true };
}

async function verifyEmailWithToken(token) {
  const t = String(token || "").trim();
  if (!t) return { error: "token required" };
  const found = await authStore.findByVerifyToken(t);
  if (!found || (found.emailVerifyExpires && found.emailVerifyExpires < Date.now())) {
    return { error: "Invalid or expired token." };
  }
  found.emailVerified = true;
  found.emailVerifyToken = null;
  found.emailVerifyExpires = null;
  await authStore.saveUser(found);
  return { ok: true, userId: found.id };
}

function nonceKey(chainType, addr) {
  return `${chainType}:${String(addr).trim().toLowerCase()}`;
}

async function walletNonce({ address, chainType }) {
  const ct = (chainType || "evm").toLowerCase();
  const nonce = randomNonce();
  let message;
  let lookupAddr;
  if (ct === "solana") {
    lookupAddr = String(address || "").trim();
    if (!lookupAddr) return { error: "Solana public key required." };
    message = `CCWEB Solana sign-in\nAddress: ${lookupAddr}\nNonce: ${nonce}\nIssued: ${new Date().toISOString()}`;
  } else {
    const addr = normalizeEvmAddress(address);
    if (!addr) return { error: "Invalid EVM address." };
    lookupAddr = addr.toLowerCase();
    message = buildSignInMessage({
      nonce,
      domain: "CCWEB",
      uri: process.env.PUBLIC_APP_URL || "https://ccweb.app",
    });
  }
  const key = nonceKey(ct, lookupAddr);
  walletNonces.set(key, { nonce, message, expiresAt: Date.now() + NONCE_MS, chainType: ct });
  return { nonce, message, expiresAt: new Date(Date.now() + NONCE_MS).toISOString(), chainType: ct };
}

async function walletVerify(ccwebUsers, buildUserProfile, body) {
  const chainType = (body.chainType || "evm").toLowerCase();
  const { message, signature } = body;
  const address = body.address;
  const publicKeyBase58 = body.publicKeyBase58;
  const referralCode = body.referralCode || body.ref;
  const acquisitionSource = body.utm_source || body.acquisitionSource;

  let walletAddr;
  if (chainType === "solana") {
    const pk = publicKeyBase58 || address;
    const v = verifySolanaWallet({ publicKeyBase58: pk, message, signatureBase64: signature });
    if (!v.ok) return { error: v.error };
    walletAddr = v.address;
  } else {
    const v = verifyEvmWallet({ address, message, signature });
    if (!v.ok) return { error: v.error };
    walletAddr = v.address.toLowerCase();
  }

  const key = nonceKey(chainType, chainType === "solana" ? walletAddr : walletAddr);
  const slot = walletNonces.get(key);
  if (!slot || slot.message !== message || slot.expiresAt < Date.now()) {
    return { error: "Invalid or expired nonce. Request a new nonce for this address." };
  }
  if (!message.includes(slot.nonce)) {
    return { error: "Nonce mismatch." };
  }
  walletNonces.delete(key);

  let row =
    chainType === "evm"
      ? await authStore.findByWalletEvm(walletAddr)
      : await authStore.findByWalletSol(walletAddr);

  if (!row) {
    const userId = `usr-${crypto.randomUUID().slice(0, 12)}`;
    await authStore.createUser({
      id: userId,
      email: null,
      emailVerified: false,
      passwordHash: null,
      walletEvm: chainType === "evm" ? walletAddr : null,
      walletSol: chainType === "solana" ? walletAddr : null,
      totpSecretEnc: null,
      totpEnabled: false,
      backupCodesHashed: [],
      refreshFamilyId: null,
      refreshTokenHash: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      emailVerifyToken: null,
      emailVerifyExpires: null,
      passwordResetToken: null,
      passwordResetExpires: null,
    });
    row = await authStore.findById(userId);
    const short = chainType === "solana" ? walletAddr.slice(0, 8) : `${walletAddr.slice(0, 6)}…`;
    const profile = buildUserProfile(
      {
        userId,
        displayName: `Wallet ${short}`,
        email: null,
        roles: ["member"],
      },
      null
    );
    ccwebUsers.set(userId, profile);
    await persistNewUserProfile(userId, profile);
  }

  const user = await ensureUserProfile(ccwebUsers, buildUserProfile, row.id);
  if (!user) return { error: "Unable to load account profile.", code: "PROFILE_MISSING" };

  try {
    const { applyReferralAttribution } = require("../db/referralAttribution");
    const growthEngine = require("../db/persistenceGrowthEngine");
    await applyReferralAttribution(row.id, { referralCode, acquisitionSource });
    await growthEngine.ensureReferralCode(row.id);
    await growthEngine.onUserLogin(row.id);
  } catch {
    /* non-fatal */
  }
  return await issueTokenPair(row, user);
}

/**
 * Google / Apple Sign in with ID token (OIDC). Creates or links user; email marked verified from IdP.
 */
async function oauthSignIn(
  ccwebUsers,
  buildUserProfile,
  { provider, email, oauthSub, displayName, appleSub, referralCode, acquisitionSource }
) {
  const prov = (provider || "").toLowerCase();
  if (prov !== "google" && prov !== "apple") return { error: "Unsupported OAuth provider." };
  const sub = String(oauthSub || "").trim();
  if (!sub) return { error: "Missing OAuth subject." };

  let row =
    prov === "apple" && appleSub
      ? await authStore.findByAppleSub(appleSub)
      : await authStore.findByOAuth(prov, sub);

  const em = email ? authStore.normalizeEmail(email) : null;

  if (!row) {
    if (em) row = await authStore.findByEmail(em);
  }

  if (row) {
    const finalEmail = em || row.email;
    if (!finalEmail) return { error: "Account has no email on file; sign in with email once or re-authorize with email scope." };
    row.email = authStore.normalizeEmail(finalEmail);
    row.emailVerified = true;
    row.oauthProvider = prov;
    row.oauthSub = sub;
    if (appleSub) row.appleSub = appleSub;
    await authStore.saveUser(row);
  } else {
    if (!em || !em.includes("@")) return { error: "Valid email is required for new OAuth accounts (enable email scope)." };
    const userId = `usr-${crypto.randomUUID().slice(0, 12)}`;
    await authStore.createUser({
      id: userId,
      email: em,
      emailVerified: true,
      passwordHash: null,
      walletEvm: null,
      walletSol: null,
      totpSecretEnc: null,
      totpEnabled: false,
      backupCodesHashed: [],
      refreshFamilyId: null,
      refreshTokenHash: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      emailVerifyToken: null,
      emailVerifyExpires: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      oauthProvider: prov,
      oauthSub: sub,
      appleSub: appleSub || null,
    });
    row = await authStore.findById(userId);
    const profile = buildUserProfile(
      {
        userId,
        displayName: (displayName || em.split("@")[0] || "Member").toString().trim(),
        email: em,
        roles: ["member"],
      },
      null
    );
    ccwebUsers.set(userId, profile);
    await persistNewUserProfile(userId, profile);
  }

  let user = await ensureUserProfile(ccwebUsers, buildUserProfile, row.id);
  if (!user) return { error: "Unable to load account profile.", code: "PROFILE_MISSING" };

  const emailForProfile = row.email || em;
  if (displayName) {
    user = { ...user, displayName: displayName.trim(), email: emailForProfile || user.email };
    ccwebUsers.set(row.id, user);
  } else if (emailForProfile && user.email !== emailForProfile) {
    user = { ...user, email: emailForProfile };
    ccwebUsers.set(row.id, user);
  }
  await persistNewUserProfile(row.id, user);

  try {
    const { applyReferralAttribution } = require("../db/referralAttribution");
    const growthEngine = require("../db/persistenceGrowthEngine");
    await applyReferralAttribution(row.id, { referralCode, acquisitionSource });
    await growthEngine.ensureReferralCode(row.id);
    await growthEngine.onUserLogin(row.id);
  } catch {
    /* non-fatal */
  }

  return await issueTokenPair(row, user);
}

module.exports = {
  registerUser,
  loginPasswordStep,
  verifyTwoFactorLogin,
  setupTwoFactorBegin,
  setupTwoFactorConfirm,
  refreshTokens,
  logoutAccessToken,
  getUserIdFromAccess,
  requestPasswordReset,
  completePasswordReset,
  verifyEmailWithToken,
  walletNonce,
  walletVerify,
  oauthSignIn,
  hashRefreshToken,
  ensureUserProfile,
  persistNewUserProfile,
};
