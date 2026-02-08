-- Add stats columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS posts_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Add stats columns to communities table if missing
ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS posts_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;
-- Note: 'members_count' might exist as a legacy column, we should check/migrate if needed, but 'member_count' is standard.
