-- ==========================================================================
-- USER_STATS TABLE
-- ==========================================================================
-- This table stores user statistics data
-- Used by userStatsService.ts to track user activity metrics

CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  works_count INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,
  is_initialized BOOLEAN DEFAULT true,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_followers_count ON user_stats(followers_count);
CREATE INDEX IF NOT EXISTS idx_user_stats_works_count ON user_stats(works_count);

-- Enable RLS for security
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view all stats
CREATE POLICY "Allow public read access" ON user_stats
  FOR SELECT USING (true);

-- Users can only update their own stats
CREATE POLICY "Allow users to update own stats" ON user_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only insert their own stats
CREATE POLICY "Allow users to insert own stats" ON user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE user_stats IS '用户统计数据表，存储用户的作品数、关注数、粉丝数、收藏数等统计信息';
