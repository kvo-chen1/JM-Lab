-- 我的收藏页面重构 - 创建社区帖子和活动收藏相关表

-- ============================================
-- 1. 社区帖子收藏表
-- ============================================
CREATE TABLE IF NOT EXISTS community_post_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- 社区帖子点赞表
CREATE TABLE IF NOT EXISTS community_post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- ============================================
-- 2. 活动收藏表
-- ============================================
CREATE TABLE IF NOT EXISTS event_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- ============================================
-- 3. 创建索引优化查询性能
-- ============================================
CREATE INDEX IF NOT EXISTS idx_community_post_favorites_user_id ON community_post_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_community_post_favorites_post_id ON community_post_favorites(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_favorites_created_at ON community_post_favorites(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_post_likes_user_id ON community_post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_post_likes_post_id ON community_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_likes_created_at ON community_post_likes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_favorites_user_id ON event_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_event_favorites_event_id ON event_favorites(event_id);
CREATE INDEX IF NOT EXISTS idx_event_favorites_created_at ON event_favorites(created_at DESC);

-- ============================================
-- 4. 启用行级安全 (RLS)
-- ============================================
ALTER TABLE community_post_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_favorites ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. 创建RLS策略
-- ============================================

-- 社区帖子收藏策略
CREATE POLICY "Users can view own community post favorites" ON community_post_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own community post favorites" ON community_post_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own community post favorites" ON community_post_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- 社区帖子点赞策略
CREATE POLICY "Users can view own community post likes" ON community_post_likes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own community post likes" ON community_post_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own community post likes" ON community_post_likes
    FOR DELETE USING (auth.uid() = user_id);

-- 活动收藏策略
CREATE POLICY "Users can view own event favorites" ON event_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own event favorites" ON event_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own event favorites" ON event_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 6. 创建统计函数
-- ============================================

-- 获取社区帖子收藏数
CREATE OR REPLACE FUNCTION get_community_post_favorite_count(post_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM community_post_favorites WHERE community_post_favorites.post_id = $1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取社区帖子点赞数
CREATE OR REPLACE FUNCTION get_community_post_like_count(post_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM community_post_likes WHERE community_post_likes.post_id = $1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取活动收藏数
CREATE OR REPLACE FUNCTION get_event_favorite_count(event_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM event_favorites WHERE event_favorites.event_id = $1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. 创建用户收藏统计视图
-- ============================================
CREATE OR REPLACE VIEW user_collection_stats AS
SELECT 
    user_id,
    COUNT(DISTINCT CASE WHEN 'square_work' = type THEN id END) as square_work_count,
    COUNT(DISTINCT CASE WHEN 'community_post' = type THEN id END) as community_post_count,
    COUNT(DISTINCT CASE WHEN 'activity' = type THEN id END) as activity_count,
    COUNT(DISTINCT CASE WHEN 'template' = type THEN id END) as template_count,
    COUNT(*) as total_count
FROM (
    SELECT user_id, work_id::text as id, 'square_work' as type FROM works_bookmarks
    UNION ALL
    SELECT user_id, template_id::text, 'template' FROM template_favorites
    UNION ALL
    SELECT user_id, post_id::text, 'community_post' FROM community_post_favorites
    UNION ALL
    SELECT user_id, event_id::text, 'activity' FROM event_favorites
) combined
GROUP BY user_id;

-- ============================================
-- 8. 添加注释
-- ============================================
COMMENT ON TABLE community_post_favorites IS '用户社区帖子收藏表';
COMMENT ON TABLE community_post_likes IS '用户社区帖子点赞表';
COMMENT ON TABLE event_favorites IS '用户活动收藏表';
COMMENT ON VIEW user_collection_stats IS '用户收藏统计视图';
