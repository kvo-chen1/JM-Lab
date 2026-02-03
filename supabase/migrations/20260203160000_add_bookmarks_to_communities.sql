ALTER TABLE communities
ADD COLUMN IF NOT EXISTS bookmarks jsonb DEFAULT '[]'::jsonb;
