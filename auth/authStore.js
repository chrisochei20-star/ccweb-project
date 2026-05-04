/**
 * Auth user persistence: MongoDB when MONGODB_URI is set, else in-memory Maps.
 */

const crypto = require("crypto");

/** @type {import('mongodb').MongoClient | null} */
let mongoClient = null;
/** @type {import('mongodb').Collection | null} */
let collection = null;

const memoryById = new Map();
const memoryByEmail = new Map();
const memoryByWalletEvm = new Map();
const memoryByWalletSol = new Map();

const COLLECTION = "ccweb_auth_users";

async function getCollection() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  if (collection) return collection;
  const { MongoClient } = require("mongodb");
  mongoClient = new MongoClient(uri);
  await mongoClient.connect();
  const db = mongoClient.db(process.env.MONGODB_DB || "ccweb");
  collection = db.collection(COLLECTION);
  await collection.createIndex({ email: 1 }, { unique: true, sparse: true });
  await collection.createIndex({ walletEvm: 1 }, { unique: true, sparse: true });
  await collection.createIndex({ walletSol: 1 }, { unique: true, sparse: true });
  await collection.createIndex({ emailVerifyToken: 1 }, { sparse: true });
  return collection;
}

function normalizeEmail(e) {
  return String(e || "")
    .trim()
    .toLowerCase();
}

function toDoc(row) {
  return { ...row, _id: row.id };
}

function fromDoc(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { ...rest, id: _id || rest.id };
}

async function findByEmail(email) {
  const em = normalizeEmail(email);
  const col = await getCollection();
  if (!col) {
    const id = memoryByEmail.get(em);
    return id ? { ...memoryById.get(id) } : null;
  }
  return fromDoc(await col.findOne({ email: em }));
}

async function findByVerifyToken(token) {
  const t = String(token || "").trim();
  if (!t) return null;
  const col = await getCollection();
  if (!col) {
    for (const row of memoryById.values()) {
      if (row.emailVerifyToken === t) return { ...row };
    }
    return null;
  }
  return fromDoc(await col.findOne({ emailVerifyToken: t }));
}

async function findById(id) {
  const col = await getCollection();
  if (!col) return memoryById.get(id) ? { ...memoryById.get(id) } : null;
  return fromDoc(await col.findOne({ _id: id }));
}

async function findByWalletEvm(addr) {
  if (!addr) return null;
  const a = String(addr).toLowerCase();
  const col = await getCollection();
  if (!col) {
    const id = memoryByWalletEvm.get(a);
    return id ? { ...memoryById.get(id) } : null;
  }
  return fromDoc(await col.findOne({ walletEvm: a }));
}

async function findByWalletSol(addr) {
  if (!addr) return null;
  const col = await getCollection();
  if (!col) {
    const id = memoryByWalletSol.get(addr);
    return id ? { ...memoryById.get(id) } : null;
  }
  return fromDoc(await col.findOne({ walletSol: addr }));
}

async function saveUser(row) {
  const u = { ...row, updatedAt: new Date().toISOString() };
  const col = await getCollection();
  if (!col) {
    memoryById.set(u.id, { ...u });
    if (u.email) memoryByEmail.set(normalizeEmail(u.email), u.id);
    if (u.walletEvm) memoryByWalletEvm.set(String(u.walletEvm).toLowerCase(), u.id);
    if (u.walletSol) memoryByWalletSol.set(u.walletSol, u.id);
    return;
  }
  await col.replaceOne({ _id: u.id }, toDoc(u), { upsert: true });
}

async function createUser(row) {
  const id = row.id || `usr-${crypto.randomUUID().slice(0, 12)}`;
  const u = {
    id,
    email: row.email ? normalizeEmail(row.email) : null,
    emailVerified: Boolean(row.emailVerified),
    passwordHash: row.passwordHash || null,
    walletEvm: row.walletEvm ? String(row.walletEvm).toLowerCase() : null,
    walletSol: row.walletSol || null,
    totpSecretEnc: row.totpSecretEnc || null,
    totpEnabled: Boolean(row.totpEnabled),
    backupCodesHashed: Array.isArray(row.backupCodesHashed) ? row.backupCodesHashed : [],
    refreshFamilyId: row.refreshFamilyId || null,
    refreshTokenHash: row.refreshTokenHash || null,
    failedLoginAttempts: row.failedLoginAttempts || 0,
    lockedUntil: row.lockedUntil || null,
    emailVerifyToken: row.emailVerifyToken || null,
    emailVerifyExpires: row.emailVerifyExpires || null,
    passwordResetToken: row.passwordResetToken || null,
    passwordResetExpires: row.passwordResetExpires || null,
    createdAt: row.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const col = await getCollection();
  if (!col) {
    if (u.email && memoryByEmail.has(u.email)) throw new Error("DUPLICATE");
    if (u.walletEvm && memoryByWalletEvm.has(u.walletEvm)) throw new Error("DUPLICATE");
    if (u.walletSol && memoryByWalletSol.has(u.walletSol)) throw new Error("DUPLICATE");
    memoryById.set(u.id, u);
    if (u.email) memoryByEmail.set(u.email, u.id);
    if (u.walletEvm) memoryByWalletEvm.set(u.walletEvm, u.id);
    if (u.walletSol) memoryByWalletSol.set(u.walletSol, u.id);
    return u;
  }
  try {
    await col.insertOne(toDoc(u));
  } catch (e) {
    if (e.code === 11000) throw new Error("DUPLICATE");
    throw e;
  }
  return u;
}

module.exports = {
  findByEmail,
  findById,
  findByWalletEvm,
  findByWalletSol,
  findByVerifyToken,
  saveUser,
  createUser,
  normalizeEmail,
};
