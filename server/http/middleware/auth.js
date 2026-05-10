/**
 * JWT Bearer auth for Express routes (access token).
 */

const authEngine = require("../../../auth/authEngine");

function requireBearerJwt(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  const userId = authEngine.getUserIdFromAccess(token);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized.", code: "INVALID_TOKEN" });
  }
  req.ccwebUserId = userId;
  next();
}

function optionalBearerJwt(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  req.ccwebUserId = authEngine.getUserIdFromAccess(token) || null;
  next();
}

module.exports = { requireBearerJwt, optionalBearerJwt };
