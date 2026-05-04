/**
 * CCWEB Auth HTTP — serves /auth/* and /api/auth/*
 */

const express = require("express");
const authEngine = require("./authEngine");
const rateLimit = require("./rateLimit");
const authStore = require("./authStore");
const { decryptSecret } = require("./cryptoSecret");
const totpLib = require("./totp");

function getClientIp(req) {
  return (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "";
}

function cookieOpts() {
  const secure = process.env.NODE_ENV === "production" || process.env.AUTH_COOKIE_SECURE === "1";
  return {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 14 * 24 * 60 * 60 * 1000,
  };
}

function sendTokens(res, status, body, refreshToken) {
  if (refreshToken) {
    res.cookie("ccweb_refresh", refreshToken, cookieOpts());
  }
  const payload = { ...body };
  if (refreshToken && process.env.AUTH_REFRESH_IN_BODY === "1") {
    payload.refreshToken = refreshToken;
  }
  res.status(status).json(payload);
}

function getDeps(req) {
  return req.app.locals.ccwebAuth;
}

function mountAt(app, basePath) {
  const p = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;

  app.post(`${p}/register`, async (req, res) => {
    try {
      const { ccwebUsers, buildUserProfile, sanitizeUser } = getDeps(req);
      const out = await authEngine.registerUser(ccwebUsers, buildUserProfile, req.body || {});
      if (out.error) return res.status(400).json({ error: out.error });
      res.status(201).json({
        user: sanitizeUser(out.user),
        message: "Registered. Verify email for full account trust.",
        verifyEmailHint: out.verifyEmailHint,
      });
    } catch (e) {
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  app.post(`${p}/login`, async (req, res) => {
    try {
      const { ccwebUsers, sanitizeUser } = getDeps(req);
      const ip = getClientIp(req);
      const out = await authEngine.loginPasswordStep(ccwebUsers, { ...req.body, ip });
      if (out.status === 429) {
        res.setHeader("Retry-After", String(out.retryAfterSec || 60));
        return res.status(429).json({ error: out.error });
      }
      if (out.status === 423) return res.status(423).json({ error: out.error });
      if (out.error) return res.status(401).json({ error: out.error });
      if (out.needsTwoFactor) {
        return res.status(200).json({
          needsTwoFactor: true,
          twoFactorToken: out.twoFactorToken,
          message: "Enter your authenticator code.",
        });
      }
      sendTokens(
        res,
        200,
        {
          user: sanitizeUser(out.user),
          accessToken: out.accessToken,
          token: out.accessToken,
          expiresIn: out.expiresIn,
          tokenType: out.tokenType,
        },
        out.refreshToken
      );
    } catch (e) {
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  app.post(`${p}/login/2fa`, async (req, res) => {
    try {
      const { ccwebUsers, sanitizeUser } = getDeps(req);
      const ip = getClientIp(req);
      const out = await authEngine.verifyTwoFactorLogin(ccwebUsers, { ...req.body, ip });
      if (out.status === 429) {
        res.setHeader("Retry-After", String(out.retryAfterSec || 60));
        return res.status(429).json({ error: out.error });
      }
      if (out.error) return res.status(401).json({ error: out.error });
      sendTokens(
        res,
        200,
        {
          user: sanitizeUser(out.user),
          accessToken: out.accessToken,
          token: out.accessToken,
          expiresIn: out.expiresIn,
          tokenType: out.tokenType,
        },
        out.refreshToken
      );
    } catch (e) {
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  app.post(`${p}/refresh`, async (req, res) => {
    try {
      const { ccwebUsers, sanitizeUser } = getDeps(req);
      const refresh = req.body?.refreshToken || req.cookies?.ccweb_refresh;
      if (!refresh) return res.status(400).json({ error: "refreshToken required (body or ccweb_refresh cookie)." });
      const out = await authEngine.refreshTokens(ccwebUsers, refresh);
      if (out.error) return res.status(401).json({ error: out.error });
      sendTokens(
        res,
        200,
        {
          accessToken: out.accessToken,
          token: out.accessToken,
          expiresIn: out.expiresIn,
          tokenType: out.tokenType,
          user: sanitizeUser(out.user),
        },
        out.refreshToken
      );
    } catch (e) {
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  app.post(`${p}/logout`, async (req, res) => {
    const auth = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
    const refresh = req.body?.refreshToken || req.cookies?.ccweb_refresh;
    await authEngine.logoutAccessToken(auth, refresh);
    res.clearCookie("ccweb_refresh", { path: "/" });
    res.json({ ok: true });
  });

  app.get(`${p}/me`, (req, res) => {
    const { ccwebUsers, sanitizeUser } = getDeps(req);
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
    const userId = authEngine.getUserIdFromAccess(token);
    if (!userId) return res.status(401).json({ error: "Unauthorized." });
    const user = ccwebUsers.get(userId);
    if (!user) return res.status(401).json({ error: "Session invalid." });
    res.json({ user: sanitizeUser(user) });
  });

  app.get(`${p}/verify-email`, async (req, res) => {
    const token = req.query?.token || req.query?.t;
    const out = await authEngine.verifyEmailWithToken(token);
    if (out.error) return res.status(400).json({ error: out.error });
    res.json({ ok: true, userId: out.userId });
  });

  app.post(`${p}/2fa/setup`, async (req, res) => {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
    const userId = authEngine.getUserIdFromAccess(token);
    if (!userId) return res.status(401).json({ error: "Unauthorized." });
    const step = (req.body && req.body.step) || "begin";
    if (step === "begin") {
      const out = await authEngine.setupTwoFactorBegin(userId);
      if (out.error) return res.status(400).json(out);
      return res.json({ secret: out.secret, otpauthUrl: out.otpauthUrl });
    }
    if (step === "confirm") {
      const out = await authEngine.setupTwoFactorConfirm(userId, req.body?.code);
      if (out.error) return res.status(400).json(out);
      return res.json({ ok: true, backupCodes: out.backupCodes, warning: "Store backup codes securely; shown once." });
    }
    return res.status(400).json({ error: "Invalid step. Use begin or confirm." });
  });

  app.post(`${p}/2fa/verify`, async (req, res) => {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
    const userId = authEngine.getUserIdFromAccess(token);
    if (!userId) return res.status(401).json({ error: "Unauthorized." });
    const row = await authStore.findById(userId);
    if (!row) return res.status(404).json({ error: "Not found" });
    const sec = decryptSecret(row.totpSecretEnc);
    if (!sec || !totpLib.verifyTotp(sec, req.body?.code)) {
      return res.status(400).json({ error: "Invalid code." });
    }
    res.json({ ok: true });
  });

  app.post(`${p}/wallet/nonce`, async (req, res) => {
    const out = await authEngine.walletNonce(req.body || {});
    if (out.error) return res.status(400).json(out);
    res.json(out);
  });

  app.post(`${p}/wallet/connect`, async (req, res) => {
    try {
      const { ccwebUsers, buildUserProfile, sanitizeUser } = getDeps(req);
      const ip = getClientIp(req);
      const rl = rateLimit.check("wallet", ip, 40, 15 * 60 * 1000);
      if (!rl.ok) {
        res.setHeader("Retry-After", String(rl.retryAfterSec || 60));
        return res.status(429).json({ error: "Too many wallet attempts." });
      }
      const out = await authEngine.walletVerify(ccwebUsers, buildUserProfile, req.body || {});
      if (out.error) return res.status(400).json({ error: out.error });
      sendTokens(
        res,
        200,
        {
          user: sanitizeUser(out.user),
          accessToken: out.accessToken,
          token: out.accessToken,
          expiresIn: out.expiresIn,
          tokenType: out.tokenType,
        },
        out.refreshToken
      );
    } catch (e) {
      res.status(500).json({ error: e.message || "Server error" });
    }
  });

  app.post(`${p}/password/request`, async (req, res) => {
    const ip = getClientIp(req);
    const rl = rateLimit.check("pwreq", ip, 10, 60 * 60 * 1000);
    if (!rl.ok) return res.status(429).json({ error: "Too many requests." });
    const out = await authEngine.requestPasswordReset(req.body?.email);
    res.json(out);
  });

  app.post(`${p}/password/reset`, async (req, res) => {
    const out = await authEngine.completePasswordReset(req.body || {});
    if (out.error) return res.status(400).json(out);
    res.json({ ok: true });
  });
}

function createAuthApp(deps) {
  const app = express();
  app.locals.ccwebAuth = deps;
  app.use(express.json({ limit: "256kb" }));

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });

  const cookieParser = require("cookie-parser");
  app.use(cookieParser());

  mountAt(app, "/auth");
  mountAt(app, "/api/auth");

  app.use((req, res) => {
    res.status(404).json({ error: "Auth route not found", path: req.originalUrl || req.url });
  });

  return app;
}

module.exports = { createAuthApp };
