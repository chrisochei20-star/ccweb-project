/**
 * JWT access + refresh tokens. HS256. Never log token bodies in production.
 */

const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const ACCESS_EXPIRES = process.env.AUTH_ACCESS_EXPIRES || "15m";
const REFRESH_EXPIRES = process.env.AUTH_REFRESH_EXPIRES || "14d";

function getSecret() {
  const s = process.env.AUTH_JWT_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_JWT_SECRET must be set to a random string of at least 32 characters in production.");
    }
    return "dev-only-ccweb-jwt-secret-min-32-chars!!";
  }
  return s;
}

function signAccessToken(userId, extra = {}) {
  return jwt.sign({ sub: userId, typ: "access", ...extra }, getSecret(), {
    expiresIn: ACCESS_EXPIRES,
    jwtid: crypto.randomBytes(16).toString("hex"),
  });
}

function signRefreshToken(userId, familyId) {
  return jwt.sign(
    { sub: userId, typ: "refresh", fid: familyId },
    getSecret(),
    { expiresIn: REFRESH_EXPIRES, jwtid: crypto.randomBytes(16).toString("hex") }
  );
}

function verifyToken(token, expectedTyp) {
  try {
    const payload = jwt.verify(String(token || "").trim(), getSecret(), { algorithms: ["HS256"] });
    if (expectedTyp && payload.typ !== expectedTyp) return null;
    return payload;
  } catch {
    return null;
  }
}

function newFamilyId() {
  return crypto.randomBytes(12).toString("hex");
}

function signTwoFactorPending(userId) {
  return jwt.sign({ sub: userId, typ: "2fa_pending" }, getSecret(), {
    expiresIn: "5m",
    jwtid: crypto.randomBytes(12).toString("hex"),
  });
}

function verifyTwoFactorPending(token) {
  try {
    const payload = jwt.verify(String(token || "").trim(), getSecret(), { algorithms: ["HS256"] });
    if (payload.typ !== "2fa_pending") return null;
    return payload;
  } catch {
    return null;
  }
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  signTwoFactorPending,
  verifyTwoFactorPending,
  verifyToken,
  newFamilyId,
  getSecret,
  ACCESS_EXPIRES,
  REFRESH_EXPIRES,
};
