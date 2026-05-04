-- CCWEB production schema (PostgreSQL 14+)
-- Run via: node db/migrate.js (or CCWEB_RUN_MIGRATIONS=1 on server start)

CREATE TABLE IF NOT EXISTS ccweb_auth_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  password_hash TEXT,
  wallet_evm TEXT UNIQUE,
  wallet_sol TEXT UNIQUE,
  totp_secret_enc TEXT,
  totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  backup_codes_hashed JSONB NOT NULL DEFAULT '[]'::jsonb,
  refresh_family_id TEXT,
  refresh_token_hash TEXT,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  email_verify_token TEXT,
  email_verify_expires TIMESTAMPTZ,
  password_reset_token TEXT,
  password_reset_expires TIMESTAMPTZ,
  oauth_provider TEXT,
  oauth_sub TEXT,
  apple_sub TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ccweb_auth_users_oauth_unique
  ON ccweb_auth_users (oauth_provider, oauth_sub)
  WHERE oauth_provider IS NOT NULL AND oauth_sub IS NOT NULL;

CREATE INDEX IF NOT EXISTS ccweb_auth_users_email_verify ON ccweb_auth_users (email_verify_token) WHERE email_verify_token IS NOT NULL;

CREATE TABLE IF NOT EXISTS growth_listings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'service',
  industry TEXT NOT NULL DEFAULT 'services',
  price_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  seller_id TEXT NOT NULL,
  seller_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS growth_orders (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES growth_listings(id),
  listing_title TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  buyer_id TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  amount_usd NUMERIC(14,2) NOT NULL,
  platform_fee_usd NUMERIC(14,2) NOT NULL,
  seller_pending_usd NUMERIC(14,2) NOT NULL,
  status TEXT NOT NULL,
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  audit JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS growth_leads (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  industry TEXT NOT NULL,
  region TEXT NOT NULL,
  source TEXT NOT NULL,
  score INT NOT NULL,
  engagement_hint TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  compliance_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  converted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS growth_campaigns (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  name TEXT NOT NULL,
  objective TEXT NOT NULL,
  channels JSONB NOT NULL DEFAULT '[]'::jsonb,
  industries JSONB NOT NULL DEFAULT '[]'::jsonb,
  organic_only BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'draft',
  policy_banner TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS growth_metrics (
  id INT PRIMARY KEY DEFAULT 1,
  leads_generated INT NOT NULL DEFAULT 0,
  leads_converted INT NOT NULL DEFAULT 0,
  sales_completed INT NOT NULL DEFAULT 0,
  revenue_gross_usd NUMERIC(18,2) NOT NULL DEFAULT 0,
  revenue_net_business_usd NUMERIC(18,2) NOT NULL DEFAULT 0,
  revenue_platform_usd NUMERIC(18,2) NOT NULL DEFAULT 0,
  campaigns_active INT NOT NULL DEFAULT 0,
  CONSTRAINT growth_metrics_singleton CHECK (id = 1)
);

INSERT INTO growth_metrics (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS community_posts (
  id TEXT PRIMARY KEY,
  author_user_id TEXT NOT NULL,
  author_display_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_post_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_user_id TEXT NOT NULL,
  author_display_name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_chats (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL,
  author_user_id TEXT NOT NULL,
  author_display_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_reactions (
  id TEXT PRIMARY KEY,
  author_user_id TEXT NOT NULL,
  author_display_name TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reaction TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_bug_reports (
  id TEXT PRIMARY KEY,
  reporter_user_id TEXT,
  reporter_display_name TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  path TEXT,
  severity TEXT NOT NULL DEFAULT 'normal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_transactions (
  id BIGSERIAL PRIMARY KEY,
  kind TEXT NOT NULL,
  reference_id TEXT,
  provider TEXT NOT NULL,
  amount_usd NUMERIC(14,2),
  currency TEXT,
  status TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_request_logs (
  id BIGSERIAL PRIMARY KEY,
  path TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INT,
  duration_ms INT,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS api_request_logs_created ON api_request_logs (created_at DESC);
