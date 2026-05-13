-- Community feed: media attachments, quote reposts, bookmarks (PostgreSQL).
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS media_urls JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS repost_of_id TEXT REFERENCES community_posts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS community_posts_repost_of ON community_posts (repost_of_id) WHERE repost_of_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS community_posts_author_created ON community_posts (author_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS community_post_bookmarks (
  user_id TEXT NOT NULL,
  post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS community_post_bookmarks_user_created ON community_post_bookmarks (user_id, created_at DESC);
