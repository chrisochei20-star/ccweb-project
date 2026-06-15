-- Add media support to community posts and marketplace listings
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS media_type TEXT;

ALTER TABLE growth_listings ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE growth_listings ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';
