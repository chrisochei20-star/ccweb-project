/**
 * Sliding-window rate limiter for auth endpoints (per IP + optional key).
 */

const buckets = new Map();

function bucketKey(prefix, ip, extra = "") {
  return `${prefix}:${ip || "unknown"}:${extra}`;
}

/**
 * @param {string} prefix
 * @param {string} ip
 * @param {number} maxPerWindow
 * @param {number} windowMs
 * @returns {{ ok: boolean, retryAfterSec?: number }}
 */
function check(prefix, ip, maxPerWindow, windowMs) {
  const key = bucketKey(prefix, ip);
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now - b.start > windowMs) {
    b = { count: 0, start: now };
    buckets.set(key, b);
  }
  b.count += 1;
  if (b.count > maxPerWindow) {
    const retryAfterSec = Math.ceil((windowMs - (now - b.start)) / 1000);
    return { ok: false, retryAfterSec: Math.max(1, retryAfterSec) };
  }
  return { ok: true };
}

module.exports = { check };
