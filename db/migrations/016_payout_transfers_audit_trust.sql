-- Production payout automation, audit trail, trust & safety, push prep, moderation visibility.

-- Payout requests: review + transfer lifecycle, encrypted bank payload, Flutterwave recipient/transfer refs.
-- status values: pending_review | approved | rejected | transfer_submitted | paid | failed
ALTER TABLE ccweb_payout_requests ADD COLUMN IF NOT EXISTS risk_flags JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE ccweb_payout_requests ADD COLUMN IF NOT EXISTS encrypted_bank TEXT;
ALTER TABLE ccweb_payout_requests ADD COLUMN IF NOT EXISTS bank_hint TEXT;
ALTER TABLE ccweb_payout_requests ADD COLUMN IF NOT EXISTS flw_recipient_id TEXT;
ALTER TABLE ccweb_payout_requests ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE ccweb_payout_requests ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE ccweb_payout_requests ADD COLUMN IF NOT EXISTS reject_reason TEXT;
ALTER TABLE ccweb_payout_requests ADD COLUMN IF NOT EXISTS transfer_ref TEXT;
ALTER TABLE ccweb_payout_requests ADD COLUMN IF NOT EXISTS transfer_meta JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE ccweb_payout_requests SET status = 'pending_review' WHERE status = 'pending';

ALTER TABLE ccweb_payout_requests ALTER COLUMN status SET DEFAULT 'pending_review';

CREATE UNIQUE INDEX IF NOT EXISTS ccweb_payout_transfer_ref_uq
  ON ccweb_payout_requests (transfer_ref) WHERE transfer_ref IS NOT NULL;

-- Append-only admin / system audit log (PII-safe payloads only).
CREATE TABLE IF NOT EXISTS ccweb_admin_audit_logs (
  id TEXT PRIMARY KEY,
  actor_kind TEXT NOT NULL DEFAULT 'admin',
  actor_label TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  ip_hash TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_admin_audit_created ON ccweb_admin_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS ccweb_admin_audit_action ON ccweb_admin_audit_logs (action, created_at DESC);

-- User reports (posts, comments, DMs, profiles).
CREATE TABLE IF NOT EXISTS ccweb_trust_reports (
  id TEXT PRIMARY KEY,
  reporter_user_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason_code TEXT NOT NULL DEFAULT 'other',
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  moderator_note TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_trust_reports_status_created ON ccweb_trust_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS ccweb_trust_reports_target ON ccweb_trust_reports (target_type, target_id);

-- Moderation actions (creator enforcement / audit).
CREATE TABLE IF NOT EXISTS ccweb_moderation_actions (
  id TEXT PRIMARY KEY,
  actor_label TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_mod_actions_created ON ccweb_moderation_actions (created_at DESC);

-- Push notification device registration (stub for FCM/APNs wiring).
CREATE TABLE IF NOT EXISTS ccweb_push_device_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'web',
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, platform, token)
);

CREATE INDEX IF NOT EXISTS ccweb_push_tokens_user ON ccweb_push_device_tokens (user_id, updated_at DESC);

-- Community feed: hide moderated posts/comments from public queries.
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'visible';
ALTER TABLE community_post_comments ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'visible';

-- Direct messages (ccweb_chat_messages): soft-hide without scanning JSON in every query.
ALTER TABLE ccweb_chat_messages ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'visible';
