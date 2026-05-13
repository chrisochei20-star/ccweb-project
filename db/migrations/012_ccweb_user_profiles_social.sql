-- Extended public profile fields (LinkedIn-style) on existing auth-linked profiles.
ALTER TABLE ccweb_user_profiles ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '';
ALTER TABLE ccweb_user_profiles ADD COLUMN IF NOT EXISTS headline TEXT NOT NULL DEFAULT '';
ALTER TABLE ccweb_user_profiles ADD COLUMN IF NOT EXISTS website_url TEXT NOT NULL DEFAULT '';
ALTER TABLE ccweb_user_profiles ADD COLUMN IF NOT EXISTS twitter_handle TEXT NOT NULL DEFAULT '';
