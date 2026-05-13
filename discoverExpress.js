/**
 * Unified discovery: courses + community (PostgreSQL).
 */

const express = require("express");
const { getPool } = require("./db/pool");
const coursesPg = require("./db/persistenceCourses");
const communityPg = require("./db/persistenceCommunity");
const mp = require("./db/persistenceMarketplace");

function createDiscoverRouter({ optionalJwt }) {
  const router = express.Router();

  router.get("/", optionalJwt, async (req, res, next) => {
    try {
      if (!getPool()) {
        return res.status(503).json({ error: "Discovery requires PostgreSQL.", code: "NO_DATABASE" });
      }
      const q = (req.query.q || "").toString().trim().slice(0, 160);
      const limit = Math.min(40, Math.max(4, Number(req.query.limit) || 20));
      const courses = await coursesPg.listCourses({ publishedOnly: true, q: q || undefined });
      let posts = [];
      if (q) {
        posts = await communityPg.searchPosts(q, limit);
      } else {
        const trending = await communityPg.listTrendingPosts(Math.min(20, limit));
        posts = trending.map(({ reactionCount, trendingScore, ...rest }) => rest);
      }
      let marketplace = [];
      if (q && mp.usePostgres()) {
        try {
          marketplace = await mp.listListingsPublic({ q, limit: Math.min(15, limit) });
        } catch {
          marketplace = [];
        }
      }
      res.json({
        query: q || null,
        courses: courses.slice(0, limit),
        posts: posts.slice(0, limit),
        marketplace: marketplace.slice(0, limit),
      });
    } catch (e) {
      next(e);
    }
  });

  return router;
}

module.exports = { createDiscoverRouter };
