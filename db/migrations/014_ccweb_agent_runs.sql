-- Persisted AI agent execution history (Build / marketplace runs).
CREATE TABLE IF NOT EXISTS ccweb_agent_runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  input_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_preview TEXT NOT NULL DEFAULT '',
  provider TEXT,
  model TEXT,
  usage_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  mock BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_agent_runs_user_created ON ccweb_agent_runs (user_id, created_at DESC);
