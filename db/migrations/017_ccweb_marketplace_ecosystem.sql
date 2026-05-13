-- CCWEB marketplace ecosystem: storefronts, listings, SKUs, purchases, entitlements, AI artifact versioning, reviews.

CREATE TABLE IF NOT EXISTS ccweb_marketplace_stores (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  banner_url TEXT,
  avatar_url TEXT,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_mp_stores_owner ON ccweb_marketplace_stores (owner_user_id);
CREATE INDEX IF NOT EXISTS ccweb_mp_stores_published ON ccweb_marketplace_stores (published, updated_at DESC);

CREATE TABLE IF NOT EXISTS ccweb_marketplace_listings (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES ccweb_marketplace_stores(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL DEFAULT 'tool',
  category_slug TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'draft',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  thumbnail_url TEXT,
  install_hint TEXT NOT NULL DEFAULT '',
  version_published INT NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ccweb_mp_listing_status CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT ccweb_mp_listing_kind CHECK (kind IN ('agent', 'workflow', 'tool', 'prompt_pack', 'bundle', 'digital'))
);

CREATE INDEX IF NOT EXISTS ccweb_mp_listings_store ON ccweb_marketplace_listings (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ccweb_mp_listings_cat ON ccweb_marketplace_listings (category_slug, status);
CREATE INDEX IF NOT EXISTS ccweb_mp_listings_featured ON ccweb_marketplace_listings (featured, status) WHERE featured = TRUE AND status = 'published';

CREATE TABLE IF NOT EXISTS ccweb_marketplace_skus (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES ccweb_marketplace_listings(id) ON DELETE CASCADE,
  code TEXT NOT NULL DEFAULT 'default',
  label TEXT NOT NULL,
  price_usd_cents INT NOT NULL DEFAULT 0,
  price_ngn INT NOT NULL DEFAULT 0,
  billing TEXT NOT NULL DEFAULT 'once',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  entitlement_days INT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (listing_id, code),
  CONSTRAINT ccweb_mp_sku_billing CHECK (billing IN ('once', 'monthly', 'yearly'))
);

CREATE INDEX IF NOT EXISTS ccweb_mp_skus_listing ON ccweb_marketplace_skus (listing_id) WHERE active = TRUE;

CREATE TABLE IF NOT EXISTS ccweb_marketplace_purchases (
  id TEXT PRIMARY KEY,
  flutterwave_tx_id TEXT UNIQUE REFERENCES ccweb_flutterwave_transactions(id) ON DELETE CASCADE,
  buyer_user_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  sku_id TEXT NOT NULL REFERENCES ccweb_marketplace_skus(id) ON DELETE RESTRICT,
  listing_id TEXT NOT NULL REFERENCES ccweb_marketplace_listings(id) ON DELETE CASCADE,
  amount_minor BIGINT NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_mp_purch_buyer ON ccweb_marketplace_purchases (buyer_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ccweb_mp_purch_listing ON ccweb_marketplace_purchases (listing_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ccweb_marketplace_entitlements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL REFERENCES ccweb_marketplace_listings(id) ON DELETE CASCADE,
  sku_id TEXT REFERENCES ccweb_marketplace_skus(id) ON DELETE SET NULL,
  purchase_id TEXT REFERENCES ccweb_marketplace_purchases(id) ON DELETE CASCADE,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_mp_ent_user_listing ON ccweb_marketplace_entitlements (user_id, listing_id);
CREATE INDEX IF NOT EXISTS ccweb_mp_ent_valid ON ccweb_marketplace_entitlements (user_id, valid_until);

CREATE TABLE IF NOT EXISTS ccweb_marketplace_reviews (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES ccweb_marketplace_listings(id) ON DELETE CASCADE,
  author_user_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  rating INT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'visible',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (listing_id, author_user_id),
  CONSTRAINT ccweb_mp_rev_rating CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT ccweb_mp_rev_status CHECK (status IN ('visible', 'hidden'))
);

CREATE INDEX IF NOT EXISTS ccweb_mp_rev_listing ON ccweb_marketplace_reviews (listing_id, created_at DESC) WHERE status = 'visible';

CREATE TABLE IF NOT EXISTS ccweb_marketplace_ai_versions (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES ccweb_marketplace_listings(id) ON DELETE CASCADE,
  version INT NOT NULL,
  agent_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  workflow_graph JSONB NOT NULL DEFAULT '{}'::jsonb,
  prompts JSONB NOT NULL DEFAULT '[]'::jsonb,
  execution_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  tool_manifest JSONB NOT NULL DEFAULT '{}'::jsonb,
  changelog TEXT NOT NULL DEFAULT '',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (listing_id, version)
);

CREATE INDEX IF NOT EXISTS ccweb_mp_ai_listing ON ccweb_marketplace_ai_versions (listing_id, version DESC);
