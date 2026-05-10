-- CCWEB production schema (PostgreSQL 14+)
-- Order: ccweb_auth_users first, then self-FK via ALTER on referred_by_user_id (not inline CREATE).
-- Applied via `npm run migrate` / `npm run db:migrate` → db/schema.sql then db/migrations/*.sql (see db/migrations/README.md)

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
  referred_by_user_id TEXT,
  acquisition_source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ccweb_auth_users_oauth_unique
  ON ccweb_auth_users (oauth_provider, oauth_sub)
  WHERE oauth_provider IS NOT NULL AND oauth_sub IS NOT NULL;

CREATE INDEX IF NOT EXISTS ccweb_auth_users_email_verify ON ccweb_auth_users (email_verify_token) WHERE email_verify_token IS NOT NULL;

-- Legacy rows may lack referral columns — safe no-op when already present.
ALTER TABLE ccweb_auth_users ADD COLUMN IF NOT EXISTS referred_by_user_id TEXT;
ALTER TABLE ccweb_auth_users ADD COLUMN IF NOT EXISTS acquisition_source TEXT;

-- Self-FK: add after table exists (avoid inline REFERENCES during CREATE on strict hosts).
ALTER TABLE ccweb_auth_users DROP CONSTRAINT IF EXISTS ccweb_auth_users_referred_by_user_id_fkey;
ALTER TABLE ccweb_auth_users DROP CONSTRAINT IF EXISTS ccweb_auth_users_referred_by_fk;
ALTER TABLE ccweb_auth_users ADD CONSTRAINT ccweb_auth_users_referred_by_fk FOREIGN KEY (referred_by_user_id) REFERENCES ccweb_auth_users(id) ON DELETE SET NULL NOT VALID;

CREATE INDEX IF NOT EXISTS ccweb_auth_users_referred_by ON ccweb_auth_users (referred_by_user_id) WHERE referred_by_user_id IS NOT NULL;

-- Display name & UI prefs (synced with in-memory ccwebUsers on each request via ensureUserProfile).
CREATE TABLE IF NOT EXISTS ccweb_user_profiles (
  user_id TEXT PRIMARY KEY REFERENCES ccweb_auth_users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Member',
  roles JSONB NOT NULL DEFAULT '["member"]'::jsonb,
  is_organic BOOLEAN NOT NULL DEFAULT TRUE,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_user_profiles_display_lower ON ccweb_user_profiles (lower(display_name));

INSERT INTO ccweb_user_profiles (user_id, display_name, roles, is_organic, push_enabled)
SELECT
  id,
  COALESCE(NULLIF(trim(split_part(email, '@', 1)), ''), 'Member'),
  '["member"]'::jsonb,
  TRUE,
  TRUE
FROM ccweb_auth_users
ON CONFLICT (user_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS ccweb_referral_codes (
  user_id TEXT PRIMARY KEY REFERENCES ccweb_auth_users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_referral_codes_lower ON ccweb_referral_codes (lower(code));

CREATE TABLE IF NOT EXISTS ccweb_growth_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ccweb_auth_users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_growth_events_user ON ccweb_growth_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ccweb_growth_events_type ON ccweb_growth_events (event_type);

CREATE TABLE IF NOT EXISTS ccweb_user_badges (
  user_id TEXT NOT NULL REFERENCES ccweb_auth_users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS ccweb_login_streaks (
  user_id TEXT PRIMARY KEY REFERENCES ccweb_auth_users(id) ON DELETE CASCADE,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_login_date DATE,
  streak_bonus_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- AI Streaming / Tutor monetization (Stripe-backed when configured)
CREATE TABLE IF NOT EXISTS learning_sessions (
  id TEXT PRIMARY KEY,
  stream_room_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'live',
  hourly_rate_usd NUMERIC(12,2) NOT NULL DEFAULT 4.99,
  platform_fee_percent NUMERIC(6,2) NOT NULL DEFAULT 25,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_gross_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_platform_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_creator_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
  revenue_closed BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS learning_access (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  hours_purchased NUMERIC(10,4) NOT NULL DEFAULT 1,
  hours_consumed NUMERIC(10,4) NOT NULL DEFAULT 0,
  amount_usd NUMERIC(14,2) NOT NULL,
  platform_fee_usd NUMERIC(14,2) NOT NULL,
  creator_share_usd NUMERIC(14,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS learning_access_session_user ON learning_access (session_id, user_id);

CREATE TABLE IF NOT EXISTS learning_participation (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
  stream_room_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  watch_minutes INT NOT NULL DEFAULT 0,
  interaction_score INT NOT NULL DEFAULT 0,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, user_id)
);

CREATE TABLE IF NOT EXISTS learning_revenue_ledger (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  watch_minutes INT NOT NULL DEFAULT 0,
  gross_usd NUMERIC(14,2) NOT NULL,
  platform_usd NUMERIC(14,2) NOT NULL,
  creator_usd NUMERIC(14,2) NOT NULL,
  source TEXT NOT NULL DEFAULT 'session_close',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learning_user_wallet (
  user_id TEXT PRIMARY KEY,
  credits_cents INT NOT NULL DEFAULT 0,
  xp INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learning_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learning_tutor_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Monetization: monthly usage counters + metering audit (pay-per-use, upsell, admin analytics)
CREATE TABLE IF NOT EXISTS ccweb_monetization_usage_monthly (
  user_id TEXT NOT NULL REFERENCES ccweb_auth_users(id) ON DELETE CASCADE,
  period_month DATE NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free',
  scan_count INT NOT NULL DEFAULT 0,
  intelligence_calls INT NOT NULL DEFAULT 0,
  ai_platform_runs INT NOT NULL DEFAULT 0,
  hub_agent_runs INT NOT NULL DEFAULT 0,
  hub_workflow_runs INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, period_month)
);

CREATE INDEX IF NOT EXISTS ccweb_mon_usage_period ON ccweb_monetization_usage_monthly (period_month DESC);

CREATE TABLE IF NOT EXISTS ccweb_metering_events (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES ccweb_auth_users(id) ON DELETE SET NULL,
  project_id TEXT,
  kind TEXT NOT NULL,
  amount_usd NUMERIC(14,4) NOT NULL DEFAULT 0,
  platform_share_usd NUMERIC(14,4) NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_metering_kind ON ccweb_metering_events (kind, created_at DESC);
CREATE INDEX IF NOT EXISTS ccweb_metering_user ON ccweb_metering_events (user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- Beta testing: vanity URLs /invite/{code}, /u/{slug}, analytics
CREATE TABLE IF NOT EXISTS ccweb_profile_slugs (
  user_id TEXT PRIMARY KEY REFERENCES ccweb_auth_users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_profile_slugs_slug_lower ON ccweb_profile_slugs (lower(slug));

CREATE TABLE IF NOT EXISTS ccweb_beta_invites (
  code TEXT PRIMARY KEY,
  label TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ccweb_beta_events (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES ccweb_auth_users(id) ON DELETE SET NULL,
  invite_code TEXT,
  slug TEXT,
  event_type TEXT NOT NULL DEFAULT 'page_view',
  path TEXT,
  feature_key TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_beta_events_created ON ccweb_beta_events (created_at DESC);
CREATE INDEX IF NOT EXISTS ccweb_beta_events_invite ON ccweb_beta_events (invite_code) WHERE invite_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS ccweb_beta_events_user ON ccweb_beta_events (user_id, created_at DESC) WHERE user_id IS NOT NULL;
