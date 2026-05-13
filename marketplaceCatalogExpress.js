/**
 * Marketplace catalog API — storefronts, listings, SKUs, reviews, AI versions, entitlements,
 * creator studio data, library, discovery helpers.
 * Mounted at /api/v1/marketplace/catalog (PostgreSQL required).
 */

const express = require("express");
const mp = require("./db/persistenceMarketplace");

function requireDb(req, res, next) {
  if (!mp.usePostgres()) {
    return res.status(503).json({ error: "Marketplace catalog requires PostgreSQL.", code: "NO_DATABASE" });
  }
  next();
}

function createMarketplaceCatalogRouter({ authJwtMiddleware, optionalJwt }) {
  const opt = typeof optionalJwt === "function" ? optionalJwt : (req, res, next) => next();
  const router = express.Router();
  router.use(requireDb);

  router.get("/featured", async (req, res, next) => {
    try {
      const listings = await mp.listFeaturedListings(Number(req.query.limit) || 12);
      res.json({ listings });
    } catch (e) {
      next(e);
    }
  });

  router.get("/trending", async (req, res, next) => {
    try {
      const listings = await mp.listTrendingListings(Number(req.query.limit) || 12);
      res.json({ listings });
    } catch (e) {
      next(e);
    }
  });

  router.get("/categories", async (req, res, next) => {
    try {
      const categories = await mp.listDistinctCategoriesPublic(Number(req.query.limit) || 40);
      res.json({ categories });
    } catch (e) {
      next(e);
    }
  });

  router.get("/recommendations", opt, async (req, res, next) => {
    try {
      const uid = req.ccwebUserId || null;
      const listings = await mp.listRecommendations({ userId: uid, limit: Number(req.query.limit) || 12 });
      res.json({ listings });
    } catch (e) {
      next(e);
    }
  });

  router.get("/stores/trending", async (req, res, next) => {
    try {
      const stores = await mp.listTrendingStores(Number(req.query.limit) || 12);
      res.json({ stores });
    } catch (e) {
      next(e);
    }
  });

  router.get("/search", async (req, res, next) => {
    try {
      const listings = await mp.listListingsPublic({
        q: req.query.q,
        categorySlug: req.query.category,
        tag: req.query.tag,
        featuredOnly: req.query.featured === "1",
        limit: Number(req.query.limit) || 30,
        offset: Number(req.query.offset) || 0,
      });
      res.json({ listings });
    } catch (e) {
      next(e);
    }
  });

  router.get("/stores/:slug", async (req, res, next) => {
    try {
      const store = await mp.getStoreBySlug(req.params.slug);
      if (!store) return res.status(404).json({ error: "Store not found." });
      const listings = await mp.listPublishedListingsForStore(store.id, Number(req.query.limit) || 40);
      res.json({ store, listings });
    } catch (e) {
      next(e);
    }
  });

  router.get("/listings/:slug", async (req, res, next) => {
    try {
      const bundle = await mp.getListingPublicBundle(req.params.slug);
      if (!bundle) return res.status(404).json({ error: "Listing not found." });
      res.json(bundle);
    } catch (e) {
      next(e);
    }
  });

  router.post("/stores/me", authJwtMiddleware, async (req, res, next) => {
    try {
      const store = await mp.getOrCreateStoreForUser(req.ccwebUserId, req.body || {});
      res.status(201).json({ store });
    } catch (e) {
      next(e);
    }
  });

  router.post("/listings", authJwtMiddleware, async (req, res, next) => {
    try {
      const out = await mp.createListing(req.ccwebUserId, req.body || {});
      if (!out.ok) return res.status(400).json({ error: out.error || "create_failed" });
      res.status(201).json(out);
    } catch (e) {
      next(e);
    }
  });

  router.put("/listings/:id", authJwtMiddleware, async (req, res, next) => {
    try {
      const out = await mp.updateListing(req.params.id, req.ccwebUserId, req.body || {});
      if (!out.ok) return res.status(404).json({ error: out.error || "not_found" });
      res.json(out);
    } catch (e) {
      next(e);
    }
  });

  router.post("/listings/:id/skus", authJwtMiddleware, async (req, res, next) => {
    try {
      const out = await mp.addSku(req.params.id, req.ccwebUserId, req.body || {});
      if (!out.ok) return res.status(400).json({ error: out.error || "sku_failed" });
      res.status(201).json(out);
    } catch (e) {
      next(e);
    }
  });

  router.post("/listings/:id/ai-versions", authJwtMiddleware, async (req, res, next) => {
    try {
      const out = await mp.upsertAiVersion(req.params.id, req.ccwebUserId, req.body || {});
      if (!out.ok) return res.status(404).json({ error: out.error || "not_found" });
      res.status(201).json(out);
    } catch (e) {
      next(e);
    }
  });

  router.get("/listings/:id/ai-versions", authJwtMiddleware, async (req, res, next) => {
    try {
      const ok = await mp.assertUserOwnsListing(req.params.id, req.ccwebUserId);
      if (!ok) return res.status(404).json({ error: "Not found." });
      const versions = await mp.listAiVersions(req.params.id, Number(req.query.limit) || 30);
      res.json({ versions });
    } catch (e) {
      next(e);
    }
  });

  router.get("/listings/:id/private", authJwtMiddleware, async (req, res, next) => {
    try {
      const bundle = await mp.getListingPrivateBundle(req.params.id, req.ccwebUserId);
      if (!bundle) return res.status(404).json({ error: "Not found." });
      res.json(bundle);
    } catch (e) {
      next(e);
    }
  });

  router.post("/listings/:slug/reviews", authJwtMiddleware, async (req, res, next) => {
    try {
      const listing = await mp.getListingBySlug(req.params.slug);
      if (!listing) return res.status(404).json({ error: "Listing not found." });
      const out = await mp.createReview(listing.id, req.ccwebUserId, {
        rating: req.body?.rating,
        title: req.body?.title,
        body: req.body?.body,
      });
      if (!out.ok) return res.status(400).json({ error: out.error || "review_failed" });
      res.status(201).json(out);
    } catch (e) {
      next(e);
    }
  });

  router.get("/me/entitlements", authJwtMiddleware, async (req, res, next) => {
    try {
      const entitlements = await mp.listEntitlementsForUser(req.ccwebUserId, Number(req.query.limit) || 40);
      res.json({ entitlements });
    } catch (e) {
      next(e);
    }
  });

  router.get("/me/library", authJwtMiddleware, async (req, res, next) => {
    try {
      const listings = await mp.listLibraryForUser(req.ccwebUserId, Number(req.query.limit) || 40);
      res.json({ listings });
    } catch (e) {
      next(e);
    }
  });

  router.post("/me/library/:slug", authJwtMiddleware, async (req, res, next) => {
    try {
      const out = await mp.saveLibraryEntry(req.ccwebUserId, req.params.slug);
      if (!out.ok) return res.status(404).json({ error: out.error || "not_found" });
      res.status(201).json(out);
    } catch (e) {
      next(e);
    }
  });

  router.delete("/me/library/:slug", authJwtMiddleware, async (req, res, next) => {
    try {
      const out = await mp.removeLibraryEntry(req.ccwebUserId, req.params.slug);
      if (!out.ok) return res.status(404).json({ error: out.error || "not_found" });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  router.get("/creator/me/summary", authJwtMiddleware, async (req, res, next) => {
    try {
      const summary = await mp.creatorMarketplaceSummary(req.ccwebUserId);
      res.json({ summary });
    } catch (e) {
      next(e);
    }
  });

  router.get("/creator/me/listings", authJwtMiddleware, async (req, res, next) => {
    try {
      const listings = await mp.listCreatorListings(req.ccwebUserId, Number(req.query.limit) || 80);
      res.json({ listings });
    } catch (e) {
      next(e);
    }
  });

  router.get("/creator/me/sales", authJwtMiddleware, async (req, res, next) => {
    try {
      const sales = await mp.listCreatorMarketplaceSales(req.ccwebUserId, Number(req.query.limit) || 50);
      res.json({ sales });
    } catch (e) {
      next(e);
    }
  });

  router.get("/creator/me/reviews", authJwtMiddleware, async (req, res, next) => {
    try {
      const reviews = await mp.listCreatorIncomingReviews(req.ccwebUserId, Number(req.query.limit) || 40);
      res.json({ reviews });
    } catch (e) {
      next(e);
    }
  });

  router.get("/creator/me/performance", authJwtMiddleware, async (req, res, next) => {
    try {
      const listings = await mp.listListingPerformance(req.ccwebUserId, Number(req.query.limit) || 40);
      res.json({ listings });
    } catch (e) {
      next(e);
    }
  });

  return router;
}

module.exports = { createMarketplaceCatalogRouter };
