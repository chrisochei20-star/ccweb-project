/**
 * Optional MongoDB persistence for tracked wallets (Early Signals).
 * When MONGODB_URI is unset, all functions no-op and return empty arrays.
 */

const { MongoClient } = require("mongodb");

const DB_NAME = process.env.MONGODB_DB || "ccweb";
const COLLECTION = "tracked_wallets";

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

module.exports = {
  listTrackedWallets,
  addTrackedWallet,
  removeTrackedWallet,
};
