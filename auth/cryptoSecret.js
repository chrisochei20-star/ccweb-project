/**
 * Encrypt TOTP secrets at rest (AES-256-GCM). Key derived from AUTH_JWT_SECRET.
 */

const crypto = require("crypto");

const SALT = Buffer.from("ccweb-auth-totp-v1", "utf8");

function deriveKey() {
  const secret = process.env.AUTH_JWT_SECRET || "dev-only-ccweb-jwt-secret-min-32-chars!!";
  return crypto.scryptSync(secret, SALT, 32);
}

function encryptSecret(plain) {
  if (!plain) return null;
  const iv = crypto.randomBytes(12);
  const key = deriveKey();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

function decryptSecret(blob) {
  if (!blob) return null;
  try {
    const raw = Buffer.from(String(blob), "base64");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const data = raw.subarray(28);
    const key = deriveKey();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

module.exports = { encryptSecret, decryptSecret };
