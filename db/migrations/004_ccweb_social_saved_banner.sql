-- Saved posts + profile banner (social layer extensions)

ALTER TABLE ccweb_profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;

CREATE TABLE IF NOT EXISTS ccweb_saved_posts (
  user_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  post_id TEXT NOT NULL REFERENCES ccweb_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS ccweb_saved_posts_user_created ON ccweb_saved_posts (user_id, created_at DESC);
