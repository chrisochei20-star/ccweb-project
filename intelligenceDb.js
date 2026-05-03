/**
 * Optional MongoDB persistence for tracked wallets (Early Signals).
 * When MONGODB_URI is unset, all functions no-op and return empty arrays.
 */

const { MongoClient } = require("mongodb");

const DB_NAME = process.env.MONGODB_DB || "ccweb";
const COLLECTION = "tracked_wallets";
const TOKEN_COLLECTION = "tracked_tokens";

let client;
let connecting;

async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  if (client) return client.db(DB_NAME);
  if (!connecting) {
    connecting = MongoClient.connect(uri, { maxPoolSize: 5 }).then((c) => {
      client = c;
      return client.db(DB_NAME);
    });
  }
  return connecting;
}

async function listTrackedWallets() {
  try {
    const db = await getDb();
    if (!db) return [];
    const col = db.collection(COLLECTION);
    const rows = await col.find({}).sort({ addedAt: -1 }).limit(50).toArray();
    return rows.map((r) => ({
      address: r.address,
      label: r.label || "Tracked wallet",
      addedAt: r.addedAt,
      alertsEnabled: !!r.alertsEnabled,
    }));
  } catch {
    return [];
  }
}

async function addTrackedWallet(address, label, alertsEnabled) {
  try {
    const db = await getDb();
    if (!db) return { persisted: false, reason: "MONGODB_URI not configured" };
    const col = db.collection(COLLECTION);
    const now = new Date().toISOString();
    await col.updateOne(
      { address },
      {
        $set: {
          address,
          label: label || "Tracked wallet",
          alertsEnabled: !!alertsEnabled,
          updatedAt: now,
        },
        $setOnInsert: { addedAt: now },
      },
      { upsert: true }
    );
    return { persisted: true };
  } catch (e) {
    return { persisted: false, reason: e.message || "MongoDB error" };
  }
}

async function removeTrackedWallet(address) {
  try {
    const db = await getDb();
    if (!db) return { removed: false };
    const col = db.collection(COLLECTION);
    await col.deleteOne({ address });
    return { removed: true };
  } catch {
    return { removed: false };
  }
}

function tokenKey(symbol, chain, contractAddress) {
  const c = (contractAddress || "").trim().toLowerCase();
  if (c.startsWith("0x") && c.length === 42) return c;
  return `${(symbol || "").toUpperCase()}|${(chain || "").toLowerCase()}`;
}

async function listTrackedTokens() {
  try {
    const db = await getDb();
    if (!db) return [];
    const col = db.collection(TOKEN_COLLECTION);
    const rows = await col.find({}).sort({ addedAt: -1 }).limit(100).toArray();
    return rows.map((r) => ({
      key: r.key,
      symbol: r.symbol,
      chain: r.chain,
      contractAddress: r.contractAddress || null,
      addedAt: r.addedAt,
      alertsEnabled: !!r.alertsEnabled,
    }));
  } catch {
    return [];
  }
}

async function isTokenTracked(key) {
  try {
    const db = await getDb();
    if (!db) return false;
    const col = db.collection(TOKEN_COLLECTION);
    const doc = await col.findOne({ key }, { projection: { _id: 1 } });
    return !!doc;
  } catch {
    return false;
  }
}

async function addTrackedToken({ symbol, chain, contractAddress, alertsEnabled }) {
  try {
    const db = await getDb();
    if (!db) return { persisted: false, reason: "MONGODB_URI not configured" };
    const key = tokenKey(symbol, chain, contractAddress);
    const col = db.collection(TOKEN_COLLECTION);
    const now = new Date().toISOString();
    await col.updateOne(
      { key },
      {
        $set: {
          key,
          symbol: (symbol || "").toUpperCase(),
          chain: (chain || "").toLowerCase(),
          contractAddress: contractAddress || null,
          alertsEnabled: !!alertsEnabled,
          updatedAt: now,
        },
        $setOnInsert: { addedAt: now },
      },
      { upsert: true }
    );
    return { persisted: true, key };
  } catch (e) {
    return { persisted: false, reason: e.message || "MongoDB error" };
  }
}

async function removeTrackedToken(key) {
  try {
    const db = await getDb();
    if (!db) return { removed: false };
    const col = db.collection(TOKEN_COLLECTION);
    await col.deleteOne({ key });
    return { removed: true };
  } catch {
    return { removed: false };
  }
}

module.exports = {
  listTrackedWallets,
  addTrackedWallet,
  removeTrackedWallet,
  listTrackedTokens,
  addTrackedToken,
  removeTrackedToken,
  isTokenTracked,
  tokenKey,
};
