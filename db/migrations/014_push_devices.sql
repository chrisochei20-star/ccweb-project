-- FCM device tokens + delivery diagnostics (Capacitor Android native push).

CREATE TABLE IF NOT EXISTS ccweb_push_devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  token_ciphertext TEXT NOT NULL,
  token_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
  platform TEXT NOT NULL DEFAULT 'android',
  provider TEXT NOT NULL DEFAULT 'fcm',
  device_label TEXT,
  app_version TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS ccweb_push_devices_token_hash_active
  ON ccweb_push_devices (token_hash)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS ccweb_push_devices_user_active
  ON ccweb_push_devices (user_id)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS ccweb_push_delivery_log (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  device_id TEXT,
  notification_kind TEXT,
  push_category TEXT,
  fcm_message_id TEXT,
  status TEXT NOT NULL,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_push_delivery_log_user_created
  ON ccweb_push_delivery_log (user_id, created_at DESC);
