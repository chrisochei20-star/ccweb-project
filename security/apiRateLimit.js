/**
 * Sliding-window rate limit for raw Node http.IncomingMessage.
 */

const buckets = new Map();

function prune(bucket, now, windowMs) {
  while (bucket.length && now - bucket[0] > windowMs) bucket.shift();
}

function clientIp(req) {
  return (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
}

function checkApiRateLimit(req, options = {}) {
  const windowMs = Number(options.windowMs || 60_000);
  const max = Number(options.max || Number(process.env.API_RATE_LIMIT_MAX || 400));
  const key = `${clientIp(req)}:${req.method}:${(req.url || "").split("?")[0]}`;
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = [];
    buckets.set(key, bucket);
  }
  prune(bucket, now, windowMs);
  if (bucket.length >= max) {
    return { ok: false, retryAfterSec: Math.ceil(windowMs / 1000) };
  }
  bucket.push(now);
  return { ok: true };
}

module.exports = { checkApiRateLimit, clientIp };
