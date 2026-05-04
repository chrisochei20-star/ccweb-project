/**
 * Wallet authentication: nonce + signed message. EVM via ethers; Solana via tweetnacl (optional).
 * Never accepts or stores private keys.
 */

const crypto = require("crypto");
const { verifyMessage, getAddress } = require("ethers");
const nacl = require("tweetnacl");

function normalizeEvmAddress(addr) {
  try {
    return getAddress(String(addr).trim());
  } catch {
    return null;
  }
}

function buildSignInMessage({ nonce, domain, uri }) {
  const d = domain || "CCWEB";
  const u = uri || "https://ccweb.app";
  return `${d} wants you to sign in with your Ethereum account.\n\nNonce: ${nonce}\nURI: ${u}\nVersion: 1\nChain ID: 1\nIssued At: ${new Date().toISOString()}`;
}

function verifyEvmWallet({ address, message, signature }) {
  const addr = normalizeEvmAddress(address);
  if (!addr || !message || !signature) return { ok: false, error: "Missing address, message, or signature." };
  try {
    const recovered = verifyMessage(String(message), String(signature));
    if (getAddress(recovered) !== addr) {
      return { ok: false, error: "Signature does not match address." };
    }
    return { ok: true, address: addr };
  } catch (e) {
    return { ok: false, error: e.message || "Invalid signature." };
  }
}

/**
 * Solana: message UTF-8 bytes, signature base64 (64 bytes), publicKey base58 string.
 * Uses detached signature verification when publicKey is provided.
 */
function verifySolanaWallet({ publicKeyBase58, message, signatureBase64 }) {
  if (!publicKeyBase58 || !message || !signatureBase64) {
    return { ok: false, error: "Missing Solana public key, message, or signature." };
  }
  try {
    const bs58 = require("bs58");
    const pub = bs58.decode(publicKeyBase58);
    const sig = Buffer.from(String(signatureBase64), "base64");
    const msg = Buffer.from(String(message), "utf8");
    if (pub.length !== 32 || sig.length !== 64) {
      return { ok: false, error: "Invalid key or signature length." };
    }
    const ok = nacl.sign.detached.verify(msg, sig, pub);
    if (!ok) return { ok: false, error: "Invalid Solana signature." };
    return { ok: true, address: publicKeyBase58 };
  } catch (e) {
    return { ok: false, error: e.message || "Solana verify failed." };
  }
}

function randomNonce() {
  return crypto.randomBytes(16).toString("hex");
}

module.exports = {
  buildSignInMessage,
  verifyEvmWallet,
  verifySolanaWallet,
  randomNonce,
  normalizeEvmAddress,
};
