-- Notification preference infrastructure (in-app + future push channels).

ALTER TABLE ccweb_user_profiles ADD COLUMN IF NOT EXISTS notification_prefs JSONB NOT NULL DEFAULT '{}'::jsonb;
