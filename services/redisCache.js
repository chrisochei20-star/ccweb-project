/**
 * Optional Redis cache (ioredis). Falls back to in-memory LRU when REDIS_URL unset.
 */
const crypto = require("crypto");

let RedisCtor = null;
try {
  RedisCtor = require("ioredis");
} catch {
  /* optional dependency */
}

const memory = new Map();
const MAX_MEM = 5000;

function memKey(key) {
  return key;
}

function memGet(key) {
  const k = memKey(key);
  const row = memory.get(k);
  if (!row) return null;
  if (row.exp && row.exp < Date.now()) {
    memory.delete(k);
    return null;
  }
  return row.val;
}

function memSet(key, val, ttlSec) {
  const k = memKey(key);
  while (memory.size > MAX_MEM) {
    const first = memory.keys().next().value;
    memory.delete(first);
  }
  memory.set(k, { val, exp: ttlSec ? Date.now() + ttlSec * 1000 : 0 });
}

let client = null;

function getRedis() {
  const url = (process.env.REDIS_URL || "").trim();
  if (!url || !RedisCtor) return null;
  if (!client) {
    client = new RedisCtor(url, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: true,
    });
    client.on("error", (err) => {
      console.warn("[redis]", err.message);
    });
  }
  return client;
}

async function cacheGetJson(key) {
  const r = getRedis();
  if (r) {
    try {
      await r.connect?.();
      const raw = await r.get(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      /* fall through */
    }
  }
  return memGet(key);
}

async function cacheSetJson(key, value, ttlSec = 60) {
  const r = getRedis();
  const payload = JSON.stringify(value);
  if (r) {
    try {
      await r.connect?.();
      await r.set(key, payload, "EX", ttlSec);
      return;
    } catch {
      /* fallback */
    }
  }
  memSet(key, value, ttlSec);
}

function cacheKey(prefix, parts) {
  const h = crypto.createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 32);
  return `${prefix}:${h}`;
}

module.exports = { getRedis, cacheGetJson, cacheSetJson, cacheKey };
