-- Phase 5: payment lookup and community feed indexes

CREATE INDEX IF NOT EXISTS idx_platform_tx_ref_provider_status
  ON platform_transactions (reference_id, provider, status)
  WHERE reference_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_tx_flw_captured_unique
  ON platform_transactions (reference_id, provider)
  WHERE provider = 'flutterwave' AND status = 'captured' AND reference_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_growth_orders_tx_ref
  ON growth_orders (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_growth_orders_buyer_created
  ON growth_orders (buyer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_posts_author_created
  ON community_posts (author_user_id, created_at DESC);
