/**
 * Optional narrative keywords from X (Twitter API v2) and Reddit public JSON.
 */

const { cacheGetJson, cacheSetJson, cacheKey } = require("../services/redisCache");

function tokenize(text) {
  const words = String(text || "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\w\s#]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && w.length < 40);
  const counts = new Map();
  for (const w of words) {
    if (w.startsWith("#")) continue;
    counts.set(w, (counts.get(w) || 0) + 1);
  }
  return counts;
}

async function fetchTwitterRecentKeywords() {
  const bearer = (process.env.TWITTER_BEARER_TOKEN || "").trim();
  if (!bearer) return [];

  const query =
    (process.env.CCWEB_TWITTER_SEARCH_QUERY || "(crypto OR solana OR ethereum OR defi) -is:retweet lang:en").trim();

  const ck = cacheKey("tw", ["recent", query.slice(0, 80)]);
  const cached = await cacheGetJson(ck);
  if (cached) return cached;

  const url = new URL("https://api.twitter.com/2/tweets/search/recent");
  url.searchParams.set("query", query);
  url.searchParams.set("max_results", "100");
  url.searchParams.set("tweet.fields", "created_at");

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 12000);
  try {
    const res = await fetch(url.toString(), {
      signal: ac.signal,
      headers: { Authorization: `Bearer ${bearer}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.title || data.detail || res.statusText);
    }
    const tweets = data.data || [];
    const merged = new Map();
    for (const tw of tweets) {
      const counts = tokenize(tw.text || "");
      for (const [w, c] of counts) {
        merged.set(w, (merged.get(w) || 0) + c);
      }
    }
    const sorted = [...merged.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
    const max = sorted[0]?.[1] || 1;
    const keywords = sorted.map(([term, n]) => ({
      term,
      momentum: Math.min(100, Math.round((n / max) * 85 + 10)),
      sources: { twitter: 1, reddit: 0, telegram: 0 },
    }));

    await cacheSetJson(ck, keywords, 120);
    return keywords;
  } finally {
    clearTimeout(t);
  }
}

async function fetchRedditHotKeywords() {
  const subs = (process.env.CCWEB_REDDIT_SUBS || "cryptocurrency,ethereum,solana").split(",").map((s) => s.trim()).filter(Boolean);
  if (!subs.length) return [];

  const ck = cacheKey("reddit", subs);
  const cached = await cacheGetJson(ck);
  if (cached) return cached;

  const merged = new Map();
  for (const sub of subs.slice(0, 4)) {
    const url = `https://www.reddit.com/r/${encodeURIComponent(sub)}/hot.json?limit=25`;
    try {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), 8000);
      const res = await fetch(url, {
        signal: ac.signal,
        headers: { "User-Agent": "CCWEB-Narratives/1.0" },
      });
      clearTimeout(t);
      const data = await res.json().catch(() => ({}));
      const posts = data?.data?.children || [];
      for (const p of posts) {
        const title = p?.data?.title || "";
        const self = p?.data?.selftext || "";
        const counts = tokenize(`${title} ${self}`);
        for (const [w, c] of counts) {
          merged.set(w, (merged.get(w) || 0) + c);
        }
      }
    } catch {
      /* skip subreddit */
    }
  }

  const sorted = [...merged.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  const max = sorted[0]?.[1] || 1;
  const keywords = sorted.map(([term, n]) => ({
    term,
    momentum: Math.min(100, Math.round((n / max) * 85 + 10)),
    sources: { twitter: 0, reddit: 1, telegram: 0 },
  }));

  await cacheSetJson(ck, keywords, 180);
  return keywords;
}

async function buildNarrativeKeywords() {
  const [tw, rd] = await Promise.all([fetchTwitterRecentKeywords(), fetchRedditHotKeywords()]);
  const byTerm = new Map();
  for (const k of [...tw, ...rd]) {
    const prev = byTerm.get(k.term);
    if (!prev) {
      byTerm.set(k.term, { ...k });
    } else {
      prev.momentum = Math.round((prev.momentum + k.momentum) / 2);
      prev.sources = {
        twitter: (prev.sources.twitter || 0) + (k.sources.twitter || 0),
        reddit: (prev.sources.reddit || 0) + (k.sources.reddit || 0),
        telegram: 0,
      };
    }
  }
  return [...byTerm.values()]
    .sort((a, b) => b.momentum - a.momentum)
    .slice(0, 15);
}

module.exports = { buildNarrativeKeywords, fetchTwitterRecentKeywords, fetchRedditHotKeywords };
