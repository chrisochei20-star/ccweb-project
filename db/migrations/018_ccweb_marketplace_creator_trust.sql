-- Marketplace creator experience, discovery tags, library, moderation, store verification.

ALTER TABLE ccweb_marketplace_stores
  ADD COLUMN IF NOT EXISTS creator_verified BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE ccweb_marketplace_listings
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'visible';

ALTER TABLE ccweb_marketplace_listings
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS ccweb_mp_listings_moderation ON ccweb_marketplace_listings (moderation_status, status)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS ccweb_mp_listings_tags ON ccweb_marketplace_listings USING gin (tags);

CREATE TABLE IF NOT EXISTS ccweb_marketplace_library (
  user_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL REFERENCES ccweb_marketplace_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS ccweb_mp_lib_user ON ccweb_marketplace_library (user_id, created_at DESC);
