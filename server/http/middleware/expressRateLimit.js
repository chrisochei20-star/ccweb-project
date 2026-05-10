/**
 * Express adapters for existing sliding-window rate limits (auth/rateLimit.js).
 */

const rateLimitAuth = require("../../../auth/rateLimit");

function getClientIp(req) {
  return (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "";
}

/**
 * @param {string} prefix
 * @param {number} max
 * @param {number} windowMs
 */
function expressIpRateLimit(prefix, max, windowMs) {
  return (req, res, next) => {
    const ip = getClientIp(req);
    const rl = rateLimitAuth.check(prefix, ip, max, windowMs);
    if (!rl.ok) {
      res.setHeader("Retry-After", String(rl.retryAfterSec || 60));
      return res.status(429).json({ error: "Too many requests.", code: "RATE_LIMITED", retryAfterSec: rl.retryAfterSec });
    }
    next();
  };
}

/** Default /api/v1 burst guard (matches prior platformExpress apiRateShort). */
const apiRateLimitV1 = expressIpRateLimit("api_v1", 120, 60 * 1000);

module.exports = { expressIpRateLimit, apiRateLimitV1, getClientIp };
