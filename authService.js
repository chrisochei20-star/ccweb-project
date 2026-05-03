/**
 * Session-based auth (demo-grade for CCWEB prototype).
 * Passwords hashed with scrypt; sessions are opaque tokens stored in memory.
 * Replace with OAuth2 / managed identity before production.
 */

const crypto = require("crypto");

const SESSION_MS = 1000 * 60 * 60 * 24 * 14; // 14 days
const RESET_MS = 1000 * 60 * 30;

/** @type {Map<string, { userId: string, expiresAt: number }>} */
const sessions = new Map();
/** @type {Map<string, { userId: string, passwordHash: string, salt: string }>} */
const credentials = new Map();
/** @type {Map<string, { token: string, expiresAt: number }>} */
const passwordResets = new Map();

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function hashPassword(password, salt) {
  const s = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), s, 64).toString("hex");
  return { hash, salt: s };
}

function verifyPassword(password, salt, expectedHash) {
  const { hash } = hashPassword(password, salt);
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expectedHash, "hex"));
  } catch {
    return false;
  }
}

function newSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

function pruneSessions() {
  const now = Date.now();
  for (const [k, v] of sessions) {
    if (v.expiresAt < now) sessions.delete(k);
  }
}

function registerUser(ccwebUsers, buildUserProfile, { email, password, displayName }) {
  const em = normalizeEmail(email);
  if (!em || !em.includes("@")) {
    return { error: "Valid email is required." };
  }
  if (!password || String(password).length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (credentials.has(em)) {
    return { error: "An account with this email already exists." };
  }
  const userId = `usr-${crypto.randomUUID().slice(0, 10)}`;
  const { hash, salt } = hashPassword(password);
  credentials.set(em, { userId, passwordHash: hash, salt });
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
  return { user: profile };
}

function loginUser(ccwebUsers, { email, password }) {
  const em = normalizeEmail(email);
  const row = credentials.get(em);
  if (!row || !verifyPassword(password, row.salt, row.passwordHash)) {
    return { error: "Invalid email or password." };
  }
  const user = ccwebUsers.get(row.userId);
  if (!user) {
    return { error: "Account data is inconsistent. Please contact support." };
  }
  pruneSessions();
  const token = newSessionToken();
  const expiresAt = Date.now() + SESSION_MS;
  sessions.set(token, { userId: row.userId, expiresAt });
  return { token, expiresAt, userId: row.userId };
}

function logoutToken(token) {
  sessions.delete(String(token || "").trim());
}

function getSessionUserId(token) {
  if (!token) return null;
  pruneSessions();
  const row = sessions.get(String(token).trim());
  if (!row || row.expiresAt < Date.now()) {
    if (row) sessions.delete(String(token).trim());
    return null;
  }
  return row.userId;
}

function requestPasswordReset(email) {
  const em = normalizeEmail(email);
  const row = credentials.get(em);
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = Date.now() + RESET_MS;
  if (row) {
    passwordResets.set(em, { token, expiresAt });
  }
  return {
    ok: true,
    message: "If an account exists for this email, reset instructions have been recorded.",
    debugToken: process.env.AUTH_DEBUG === "1" && row ? token : undefined,
  };
}

function completePasswordReset({ email, token, newPassword }) {
  const em = normalizeEmail(email);
  const row = passwordResets.get(em);
  if (!row || row.token !== String(token || "").trim() || row.expiresAt < Date.now()) {
    return { error: "Invalid or expired reset token." };
  }
  if (!newPassword || String(newPassword).length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  const cred = credentials.get(em);
  if (!cred) {
    return { error: "No account for this email." };
  }
  const { hash, salt } = hashPassword(newPassword);
  credentials.set(em, { ...cred, passwordHash: hash, salt });
  passwordResets.delete(em);
  return { ok: true };
}

module.exports = {
  registerUser,
  loginUser,
  logoutToken,
  getSessionUserId,
  requestPasswordReset,
  completePasswordReset,
};
