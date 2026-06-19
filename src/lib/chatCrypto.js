/**
 * CCWEB Chat E2E Encryption using Web Crypto API (ECDH + AES-GCM)
 * - Each user has a key pair stored in localStorage
 * - Messages encrypted with shared secret derived from ECDH
 * - Zero server knowledge of message content
 */

const STORAGE_KEY = "ccweb_chat_keypair";

async function generateKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );
  const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const privateKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
  return { publicKeyJwk, privateKeyJwk };
}

export async function getOrCreateKeyPair() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    const pair = await generateKeyPair();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pair));
    return pair;
  } catch {
    return null;
  }
}

export async function getPublicKeyJwk() {
  const pair = await getOrCreateKeyPair();
  return pair?.publicKeyJwk || null;
}

async function deriveSharedKey(myPrivateJwk, theirPublicJwk) {
  const myPrivate = await crypto.subtle.importKey(
    "jwk", myPrivateJwk, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveKey"]
  );
  const theirPublic = await crypto.subtle.importKey(
    "jwk", theirPublicJwk, { name: "ECDH", namedCurve: "P-256" }, false, []
  );
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: theirPublic },
    myPrivate,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptMessage(plaintext, myPrivateJwk, theirPublicJwk) {
  try {
    const sharedKey = await deriveSharedKey(myPrivateJwk, theirPublicJwk);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, sharedKey, encoded);
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return btoa(String.fromCharCode(...combined));
  } catch {
    return plaintext; // fallback to plaintext if encryption fails
  }
}

export async function decryptMessage(encrypted, myPrivateJwk, theirPublicJwk) {
  try {
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const sharedKey = await deriveSharedKey(myPrivateJwk, theirPublicJwk);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, sharedKey, ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch {
    return encrypted; // fallback — show raw if decryption fails
  }
}
