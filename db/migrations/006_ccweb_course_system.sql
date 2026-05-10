-- Dynamic course system: categories, progress, quizzes, certificates, bookmarks

ALTER TABLE ccweb_courses ADD COLUMN IF NOT EXISTS category_slug TEXT NOT NULL DEFAULT 'general';
ALTER TABLE ccweb_courses ADD COLUMN IF NOT EXISTS level TEXT NOT NULL DEFAULT 'beginner';
ALTER TABLE ccweb_courses ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS ccweb_courses_category ON ccweb_courses (category_slug);
CREATE INDEX IF NOT EXISTS ccweb_courses_published ON ccweb_courses (published) WHERE published = TRUE;

CREATE TABLE IF NOT EXISTS ccweb_course_categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ccweb_course_enrollment (
  user_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES ccweb_courses(id) ON DELETE CASCADE,
  progress_pct REAL NOT NULL DEFAULT 0,
  last_lesson_id TEXT REFERENCES ccweb_lessons(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS ccweb_course_enrollment_course ON ccweb_course_enrollment (course_id);

CREATE TABLE IF NOT EXISTS ccweb_lesson_completion (
  user_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES ccweb_lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS ccweb_quizzes (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL REFERENCES ccweb_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Quiz',
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  pass_pct REAL NOT NULL DEFAULT 70,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_quizzes_lesson ON ccweb_quizzes (lesson_id);

CREATE TABLE IF NOT EXISTS ccweb_quiz_attempts (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL REFERENCES ccweb_quizzes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  score_pct REAL NOT NULL,
  passed BOOLEAN NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccweb_quiz_attempts_user ON ccweb_quiz_attempts (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ccweb_certificates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES ccweb_courses(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS ccweb_certificates_user ON ccweb_certificates (user_id);

CREATE TABLE IF NOT EXISTS ccweb_course_bookmarks (
  user_id TEXT NOT NULL REFERENCES ccweb_users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES ccweb_courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id)
);

INSERT INTO ccweb_course_categories (slug, name, sort_order) VALUES
  ('general', 'General', 0),
  ('crypto', 'Crypto', 1),
  ('ai', 'AI', 2),
  ('web3', 'Web3', 3),
  ('trading', 'Trading', 4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO ccweb_courses (id, slug, title, summary, metadata, category_slug, level, published)
VALUES (
  'crs_seed_web3_ai',
  'web3-ai-foundations',
  'Web3 & AI Foundations',
  'On-chain basics, wallets, and how AI fits into modern crypto products.',
  '{"estimatedMinutes":120,"ratingHint":"4.9"}'::jsonb,
  'crypto',
  'beginner',
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO ccweb_lessons (id, course_id, position, title, content, metadata)
VALUES (
  'les_seed_intro',
  'crs_seed_web3_ai',
  0,
  'Introduction & wallets',
  E'# Welcome\n\nThis lesson covers non-custodial wallets and why key custody matters.\n\n## Goals\n- Understand public vs private keys\n- Compare hot vs cold storage\n',
  '{}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ccweb_lessons (id, course_id, position, title, content, metadata)
VALUES (
  'les_seed_smart',
  'crs_seed_web3_ai',
  1,
  'Smart contracts overview',
  E'# Smart contracts\n\nPrograms that run on-chain with deterministic execution.\n\nFocus on auditability and upgrade patterns.\n',
  '{}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ccweb_quizzes (id, lesson_id, title, questions, pass_pct)
VALUES (
  'qz_seed_1',
  'les_seed_smart',
  'Basics check',
  '[{"prompt":"What best describes a non-custodial wallet?","choices":["Bank holds keys","You hold keys","Cloud GPU","Mining pool"],"correctIndex":1},{"prompt":"A smart contract is primarily:","choices":["A legal PDF","On-chain code","A Discord bot","An NFT image"],"correctIndex":1}]'::jsonb,
  70
)
ON CONFLICT (id) DO NOTHING;
