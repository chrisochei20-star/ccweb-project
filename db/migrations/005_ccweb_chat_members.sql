-- DM membership + read state for unread counts

CREATE TABLE IF NOT EXISTS ccweb_chat_members (
  chat_id TEXT NOT NULL REFERENCES ccweb_chats(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY (chat_id, user_id)
);

CREATE INDEX IF NOT EXISTS ccweb_chat_members_user ON ccweb_chat_members (user_id);
