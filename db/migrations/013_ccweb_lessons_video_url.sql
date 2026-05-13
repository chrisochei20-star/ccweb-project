-- Optional hosted video URL per lesson (HLS/MP4 embed or external player).
ALTER TABLE ccweb_lessons ADD COLUMN IF NOT EXISTS video_url TEXT;
