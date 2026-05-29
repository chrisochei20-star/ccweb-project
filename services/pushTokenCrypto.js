/**
 * Encrypt FCM device tokens at rest when PUSH_TOKEN_ENCRYPTION_KEY is set (32-byte hex or base64).
 */

"use strict";

const crypto = require("crypto");

const ALGO = "aes-256-gcm";

function getKey() {
  const raw = (process.env.PUSH_TOKEN_ENCRYPTION_KEY || "").trim();
  if (!raw) return null;
  let buf;
  if (/^[0-9a-f]{64}$/i.test(raw)) buf = Buffer.from(raw, "hex");
  else buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) return null;
  return buf;
}

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function encryptToken(token) {
  const key = getKey();
  const plain = String(token);
  if (!key) {
    return { ciphertext: plain, encrypted: false };
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: Buffer.concat([iv, tag, enc]).toString("base64"),
    encrypted: true,
  };
}

function decryptToken(ciphertext, encrypted) {
  if (!encrypted) return String(ciphertext);
  const key = getKey();
  if (!key) {
    throw new Error("PUSH_TOKEN_ENCRYPTION_KEY required to decrypt stored device tokens.");
  }
  const buf = Buffer.from(String(ciphertext), "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

module.exports = {
  hashToken,
  encryptToken,
  decryptToken,
  encryptionConfigured: () => Boolean(getKey()),
};
