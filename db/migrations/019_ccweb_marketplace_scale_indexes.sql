-- Marketplace and library read-path indexes for catalog, storefronts, and scale.

CREATE INDEX IF NOT EXISTS ccweb_mp_listings_pub_catalog
  ON ccweb_marketplace_listings (featured DESC, updated_at DESC)
  WHERE status = 'published' AND moderation_status = 'visible';

CREATE INDEX IF NOT EXISTS ccweb_mp_listings_store_pub
  ON ccweb_marketplace_listings (store_id, updated_at DESC)
  WHERE status = 'published' AND moderation_status = 'visible';

CREATE INDEX IF NOT EXISTS ccweb_mp_lib_listing ON ccweb_marketplace_library (listing_id);
