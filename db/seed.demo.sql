-- Optional demo / QA seed — applied only when CCWEB_SEED_DEMO=1 (never overwrites real users).
-- Safe to run multiple times (idempotent).

INSERT INTO growth_metrics (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

INSERT INTO ccweb_beta_invites (code, label, expires_at)
VALUES ('CCWEB-DEMO', 'Optional demo invite (safe seed)', NULL)
ON CONFLICT (code) DO NOTHING;
