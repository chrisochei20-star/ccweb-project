-- Profile media + course thumbnails (production uploads / Cloudinary URLs).

ALTER TABLE ccweb_user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE ccweb_user_profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;

ALTER TABLE ccweb_courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
