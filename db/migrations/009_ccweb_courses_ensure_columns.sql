-- Repair ccweb_courses columns on legacy databases where an earlier migration
-- transaction rolled back after ALTER TABLE (e.g. seed INSERT failed later in the same file).
-- Safe on PostgreSQL 11+; idempotent.

ALTER TABLE IF EXISTS ccweb_courses ADD COLUMN IF NOT EXISTS category_slug TEXT NOT NULL DEFAULT 'general';
ALTER TABLE IF EXISTS ccweb_courses ADD COLUMN IF NOT EXISTS level TEXT NOT NULL DEFAULT 'beginner';
ALTER TABLE IF EXISTS ccweb_courses ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE IF EXISTS ccweb_courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

CREATE INDEX IF NOT EXISTS ccweb_courses_category ON ccweb_courses (category_slug);
CREATE INDEX IF NOT EXISTS ccweb_courses_published ON ccweb_courses (published) WHERE published = TRUE;
