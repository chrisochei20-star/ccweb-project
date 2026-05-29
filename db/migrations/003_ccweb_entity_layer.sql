-- Incremental migration: production entity layer (idempotent with schema.sql).
-- Logical mapping: users→ccweb_users, profiles→ccweb_profiles, posts→ccweb_posts, comments→ccweb_comments,
-- chats→ccweb_chats, messages→ccweb_chat_messages, notifications→ccweb_notifications,
-- courses→ccweb_courses, lessons→ccweb_lessons, ai_conversations→ccweb_ai_conversations,
-- ai message rows→ccweb_ai_messages, wallets→ccweb_wallets, earnings→ccweb_earnings,
-- communities→ccweb_communities, follows→ccweb_follows, likes→ccweb_likes.

CREATE TABLE IF NOT EXISTS ccweb_users (
  id TEXT PRIMARY KEY REFERENCES ccweb_auth_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_users_status ON ccweb_users (status);

CREATE TABLE IF NOT EXISTS ccweb_profiles (
  user_id TEXT PRIMARY KEY REFERENCES ccweb_users(id) ON DELETE CASCADE,
  bio TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  headline TEXT,
  website_url TEXT,
  twitter_handle TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ccweb_posts (
  id TEXT PRIMARY KEY,
  author_user_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL DEFAULT 'public',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_posts_author_created ON ccweb_posts (author_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ccweb_posts_created ON ccweb_posts (created_at DESC);

CREATE TABLE IF NOT EXISTS ccweb_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES ccweb_posts(id) ON DELETE CASCADE,
  author_user_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_comments_post_created ON ccweb_comments (post_id, created_at);

CREATE TABLE IF NOT EXISTS ccweb_chats (
  id TEXT PRIMARY KEY,
  title TEXT,
  kind TEXT NOT NULL DEFAULT 'direct',
  created_by TEXT REFERENCES ccweb_users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_chats_created ON ccweb_chats (created_at DESC);

CREATE TABLE IF NOT EXISTS ccweb_chat_messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL REFERENCES ccweb_chats(id) ON DELETE CASCADE,
  author_user_id TEXT REFERENCES ccweb_users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_chat_messages_chat_created ON ccweb_chat_messages (chat_id, created_at);

CREATE TABLE IF NOT EXISTS ccweb_notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_notifications_user_created ON ccweb_notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ccweb_notifications_user_unread ON ccweb_notifications (user_id) WHERE read_at IS NULL;

CREATE TABLE IF NOT EXISTS ccweb_courses (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_courses_slug_lower ON ccweb_courses (lower(slug));

CREATE TABLE IF NOT EXISTS ccweb_lessons (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES ccweb_courses(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_lessons_course_pos ON ccweb_lessons (course_id, position);

CREATE TABLE IF NOT EXISTS ccweb_ai_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  model TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_ai_conversations_user_updated ON ccweb_ai_conversations (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS ccweb_ai_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES ccweb_ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_ai_messages_conv_created ON ccweb_ai_messages (conversation_id, created_at);

CREATE TABLE IF NOT EXISTS ccweb_wallets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  chain TEXT NOT NULL,
  address TEXT NOT NULL,
  label TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ccweb_wallets_user_chain_address_lower ON ccweb_wallets (user_id, lower(chain), lower(address));
CREATE INDEX IF NOT EXISTS ccweb_wallets_user ON ccweb_wallets (user_id);

CREATE TABLE IF NOT EXISTS ccweb_earnings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  amount_usd NUMERIC(14,4) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  reference_type TEXT,
  reference_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_earnings_user_created ON ccweb_earnings (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ccweb_earnings_source ON ccweb_earnings (source, created_at DESC);

CREATE TABLE IF NOT EXISTS ccweb_communities (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_by TEXT REFERENCES ccweb_users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_communities_slug_lower ON ccweb_communities (lower(slug));

CREATE TABLE IF NOT EXISTS ccweb_follows (
  follower_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT ccweb_follows_no_self CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS ccweb_follows_following ON ccweb_follows (following_id);

CREATE TABLE IF NOT EXISTS ccweb_likes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS ccweb_likes_target ON ccweb_likes (target_type, target_id);

INSERT INTO ccweb_users (id)
SELECT id FROM ccweb_auth_users
ON CONFLICT (id) DO NOTHING;

INSERT INTO ccweb_profiles (user_id)
SELECT id FROM ccweb_users
ON CONFLICT (user_id) DO NOTHING;
