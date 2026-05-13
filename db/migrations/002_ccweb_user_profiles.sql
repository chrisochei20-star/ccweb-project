-- Profile rows for stable display name / prefs across API restarts (pairs with ccweb_auth_users).

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
