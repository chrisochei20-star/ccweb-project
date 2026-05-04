const express = require("express");
const { applyExpressSecurity } = require("../security/expressHardDefaults");
const { logger } = require("../logging/logger");

const MAX_MESSAGE_LEN = 2000;

function trimMessage(text) {
  const s = (text || "").toString().trim();
  if (!s) return "";
  return s.length > MAX_MESSAGE_LEN ? s.slice(0, MAX_MESSAGE_LEN) : s;
}

async function postTwitter(text) {
  const userToken = (process.env.TWITTER_ACCESS_TOKEN || process.env.TWITTER_USER_ACCESS_TOKEN || "").trim();
  const appBearer = (process.env.TWITTER_BEARER_TOKEN || "").trim();
  const token = userToken || appBearer;
  if (!token) return { ok: false, skipped: true, reason: "no_token" };
  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const hint =
      !userToken && appBearer
        ? "App-only Bearer tokens cannot post tweets. Set TWITTER_ACCESS_TOKEN from OAuth 2.0 user auth with tweet.write scope."
        : undefined;
    return { ok: false, status: res.status, error: data, hint };
  }
  return { ok: true, id: data?.data?.id };
}

async function postFacebook(text) {
  const pageToken = (process.env.FACEBOOK_PAGE_ACCESS_TOKEN || "").trim();
  const pageId = (process.env.FACEBOOK_PAGE_ID || "me").trim();
  if (!pageToken) return { ok: false, skipped: true, reason: "no_token" };
  const url = new URL(`https://graph.facebook.com/v21.0/${encodeURIComponent(pageId)}/feed`);
  url.searchParams.set("access_token", pageToken);
  url.searchParams.set("message", text);
  const res = await fetch(url.toString(), { method: "POST" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    return { ok: false, status: res.status, error: data.error || data };
  }
  return { ok: true, id: data.id };
}

async function postLinkedIn(text) {
  const accessToken = (process.env.LINKEDIN_ACCESS_TOKEN || "").trim();
  const authorUrn = (process.env.LINKEDIN_AUTHOR_URN || "").trim();
  if (!accessToken || !authorUrn) return { ok: false, skipped: true, reason: "missing_token_or_author_urn" };
  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  const raw = await res.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    data = { raw };
  }
  if (!res.ok) {
    return { ok: false, status: res.status, error: data };
  }
  return { ok: true, id: res.headers.get("x-restli-id") || data?.id };
}

function createSocialApp() {
  const app = express();
  applyExpressSecurity(app);
  app.use(express.json({ limit: "128kb" }));

  app.post("/publish", async (req, res) => {
    const body = req.body || {};
    const message = trimMessage(body.message || body.text);
    if (!message) {
      return res.status(400).json({ error: "message (or text) required." });
    }
    if (body.approved !== true) {
      return res.status(403).json({
        error: "Human approval required.",
        hint: "Send { approved: true } only after a human confirms the post complies with platform rules and your own policies.",
      });
    }
    const platforms = Array.isArray(body.platforms) ? body.platforms.map((p) => String(p).toLowerCase()) : ["x"];
    const hasAny =
      process.env.TWITTER_BEARER_TOKEN ||
      process.env.TWITTER_ACCESS_TOKEN ||
      process.env.TWITTER_USER_ACCESS_TOKEN ||
      process.env.FACEBOOK_PAGE_ACCESS_TOKEN ||
      process.env.LINKEDIN_ACCESS_TOKEN;
    if (!hasAny) {
      return res.status(503).json({
        error: "Social APIs not configured.",
        hint: "Set TWITTER_ACCESS_TOKEN (OAuth2 user, tweet.write) for posting; FACEBOOK_PAGE_ACCESS_TOKEN (+ FACEBOOK_PAGE_ID); LINKEDIN_ACCESS_TOKEN (+ LINKEDIN_AUTHOR_URN).",
      });
    }

    if (body.dryRun === true) {
      return res.status(200).json({
        ok: true,
        dryRun: true,
        platforms,
        messagePreview: message.slice(0, 280),
      });
    }

    const results = {};
    try {
      if (platforms.includes("x") || platforms.includes("twitter")) {
        results.x = await postTwitter(message);
      }
      if (platforms.includes("facebook") || platforms.includes("fb")) {
        results.facebook = await postFacebook(message);
      }
      if (platforms.includes("linkedin")) {
        results.linkedin = await postLinkedIn(message);
      }
    } catch (e) {
      logger.error({ msg: "social_publish_error", err: e.message });
      return res.status(502).json({ error: e.message || "Upstream social API error", results });
    }

    const attempted = Object.keys(results).length;
    const okCount = Object.values(results).filter((r) => r && r.ok).length;
    logger.info({ msg: "social_publish", attempted, okCount, platforms });
    const status = okCount > 0 ? 200 : 502;
    return res.status(status).json({ ok: okCount > 0, results });
  });

  app.use((req, res) => {
    res.status(404).json({ error: "Social route not found" });
  });

  return app;
}

const socialRouter = createSocialApp();

module.exports = { socialRouter, createSocialApp };
