/**
 * Google Authenticator–compatible TOTP via otplib v13.
 */

const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { generateSecret: otplibGenerateSecret, generateURI, verifySync } = require("otplib");

function generateSecret() {
  return otplibGenerateSecret();
}

function otpauthUrl({ email, issuer, secret }) {
  return generateURI({ issuer: issuer || "CCWEB", label: email || "user", secret });
}

function verifyTotp(secret, token) {
  if (!secret || !token) return false;
  try {
    return verifySync({ secret, token: String(token).replace(/\s/g, "") });
  } catch {
    return false;
  }
}

async function hashBackupCodes(codes) {
  const hashed = [];
  for (const c of codes) {
    hashed.push(await bcrypt.hash(c, 10));
  }
  return hashed;
}

function generateBackupCodes(count = 10) {
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(crypto.randomBytes(5).toString("hex").toUpperCase());
  }
  return out;
}

async function consumeBackupCode(code, hashedCodes) {
  const plain = String(code || "").replace(/\s/g, "").toUpperCase();
  if (!plain || !hashedCodes?.length) return { ok: false, remaining: hashedCodes || [] };
  const remaining = [];
  let matched = false;
  for (const h of hashedCodes) {
    if (!matched && (await bcrypt.compare(plain, h))) {
      matched = true;
      continue;
    }
    remaining.push(h);
  }
  return { ok: matched, remaining };
}

module.exports = {
  generateSecret,
  otpauthUrl,
  verifyTotp,
  hashBackupCodes,
  generateBackupCodes,
  consumeBackupCode,
};
