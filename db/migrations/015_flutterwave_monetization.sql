-- Flutterwave payments, internal wallets, paid courses, payouts queue.

CREATE TABLE IF NOT EXISTS ccweb_internal_wallets (
  user_id TEXT PRIMARY KEY REFERENCES ccweb_users(id) ON DELETE CASCADE,
  balance_usd_cents BIGINT NOT NULL DEFAULT 0,
  balance_ngn BIGINT NOT NULL DEFAULT 0,
  ai_credits_cents BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ccweb_flutterwave_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  tx_ref TEXT NOT NULL UNIQUE,
  amount_minor BIGINT NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  kind TEXT NOT NULL,
  flw_tx_id TEXT,
  creator_user_id TEXT REFERENCES ccweb_users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_flw_tx_user_created ON ccweb_flutterwave_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ccweb_flw_tx_creator ON ccweb_flutterwave_transactions (creator_user_id, created_at DESC)
  WHERE creator_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ccweb_flw_tx_status ON ccweb_flutterwave_transactions (status, created_at DESC);

CREATE TABLE IF NOT EXISTS ccweb_course_purchases (
  user_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES ccweb_courses(id) ON DELETE CASCADE,
  tx_id TEXT NOT NULL REFERENCES ccweb_flutterwave_transactions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS ccweb_course_purchases_course ON ccweb_course_purchases (course_id);

CREATE TABLE IF NOT EXISTS ccweb_payout_requests (
  id TEXT PRIMARY KEY,
  creator_user_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  amount_minor BIGINT NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  bank_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  flw_transfer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_payout_creator ON ccweb_payout_requests (creator_user_id, created_at DESC);

ALTER TABLE ccweb_courses ADD COLUMN IF NOT EXISTS price_usd_cents INT NOT NULL DEFAULT 0;
ALTER TABLE ccweb_courses ADD COLUMN IF NOT EXISTS price_ngn INT NOT NULL DEFAULT 0;
ALTER TABLE ccweb_courses ADD COLUMN IF NOT EXISTS creator_user_id TEXT REFERENCES ccweb_users(id) ON DELETE SET NULL;
