-- Long-term CCWEB AI tutor memory (per user, optional summary + facts)

CREATE TABLE IF NOT EXISTS ccweb_user_ai_memory (
  user_id TEXT PRIMARY KEY REFERENCES ccweb_users(id) ON DELETE CASCADE,
  summary TEXT NOT NULL DEFAULT '',
  facts JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_user_ai_memory_updated ON ccweb_user_ai_memory (updated_at DESC);
