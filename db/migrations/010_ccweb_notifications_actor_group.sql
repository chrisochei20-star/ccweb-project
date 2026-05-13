-- Per-user notification enrichment for grouping and actor attribution.
ALTER TABLE ccweb_notifications ADD COLUMN IF NOT EXISTS actor_user_id TEXT REFERENCES ccweb_users(id) ON DELETE SET NULL;
ALTER TABLE ccweb_notifications ADD COLUMN IF NOT EXISTS group_key TEXT;
CREATE INDEX IF NOT EXISTS ccweb_notifications_user_group ON ccweb_notifications (user_id, group_key, created_at DESC)
  WHERE group_key IS NOT NULL;
