-- Profile social identity fields (Phase 5).

ALTER TABLE ccweb_user_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE ccweb_user_profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE ccweb_user_profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE ccweb_user_profiles ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE ccweb_user_profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
