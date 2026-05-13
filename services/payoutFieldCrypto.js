/**
 * AES-256-GCM encryption for payout bank payloads at rest.
 * Set CCWEB_PAYOUT_ENCRYPTION_KEY to 64 hex chars (32 bytes).
 */

const crypto = require("crypto");

function deriveKey() {
  const hex = (process.env.CCWEB_PAYOUT_ENCRYPTION_KEY || "").trim();
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) return null;
  return Buffer.from(hex, "hex");
}

function isConfigured() {
  return Boolean(deriveKey());
}

/**
 * @param {Record<string, unknown>} obj
 * @returns {string|null} base64url blob or null if key missing
 */
function encryptJson(obj) {
  const key = deriveKey();
  if (!key) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const pt = Buffer.from(JSON.stringify(obj), "utf8");
  const enc = Buffer.concat([cipher.update(pt), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

/**
 * @param {string} blob
 * @returns {Record<string, unknown>|null}
 */
function decryptJson(blob) {
  const key = deriveKey();
  if (!key || !blob) return null;
  try {
    const buf = Buffer.from(blob, "base64url");
    if (buf.length < 28) return null;
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const out = Buffer.concat([decipher.update(data), decipher.final()]);
    return JSON.parse(out.toString("utf8"));
  } catch {
    return null;
  }
}

function bankHintFromPayload(payload) {
  const acct = String(payload?.account_number || payload?.accountNumber || "").replace(/\D/g, "");
  if (acct.length >= 4) return `···${acct.slice(-4)}`;
  return null;
}

module.exports = {
  isConfigured,
  encryptJson,
  decryptJson,
  bankHintFromPayload,
};
