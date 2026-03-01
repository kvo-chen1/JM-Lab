-- Migration: 创建推荐系统基础表
-- Created: 2026-03-04
-- Description: 创建推荐系统所需的核心基础表

-- ============================================
-- 0. 启用必要的扩展
-- ============================================

-- 启用 pgvector 扩展（用于向量相似度计算）
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 1. 用户行为表
-- ============================================
CREATE TABLE IF NOT EXISTS user_behaviors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL,
    behavior_type VARCHAR(50) NOT NULL CHECK (behavior_type IN ('view', 'like', 'collect', 'share', 'comment', 'click', 'dwell')),
    behavior_value NUMERIC DEFAULT 1.0,
    dwell_time INTEGER DEFAULT 0,
    context JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加复合唯一约束，防止重复记录
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_behaviors_unique 
ON user_behaviors(user_id, content_id, behavior_type) 
WHERE behavior_type IN ('like', 'collect');

-- 添加注释
COMMENT ON TABLE user_behaviors IS '用户行为记录表，存储用户对内容的各种交互行为';
COMMENT ON COLUMN user_behaviors.behavior_type IS '行为类型: view(浏览), like(点赞), collect(收藏), share(分享), comment(评论), click(点击), dwell(停留)';
COMMENT ON COLUMN user_behaviors.behavior_value IS '行为权重值，用于计算用户偏好';
COMMENT ON COLUMN user_behaviors.dwell_time IS '停留时间（秒）';
COMMENT ON COLUMN user_behaviors.context IS '行为上下文信息，如页面位置、设备类型等';

-- ============================================
-- 2. works 表扩展字段
-- ============================================
-- 为现有的 works 表添加推荐系统需要的字段

DO $$
BEGIN
    -- 添加热度分数字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'works' AND column_name = 'hot_score') THEN
        ALTER TABLE works ADD COLUMN hot_score NUMERIC DEFAULT 0;
    END IF;
    
    -- 注意：works表已存在 category 字段（VARCHAR类型），不需要添加 category_id
    
    -- 添加标签字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'works' AND column_name = 'tags') THEN
        ALTER TABLE works ADD COLUMN tags JSONB DEFAULT '[]';
    END IF;
    
    -- 添加内容向量字段（用于相似度计算）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'works' AND column_name = 'embedding') THEN
        ALTER TABLE works ADD COLUMN embedding VECTOR(384);
    END IF;
    
    -- 添加状态字段（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'works' AND column_name = 'status') THEN
        ALTER TABLE works ADD COLUMN status VARCHAR(50) DEFAULT 'published';
    END IF;
END $$;

COMMENT ON COLUMN works.hot_score IS '作品热度分数，用于热门推荐';
COMMENT ON COLUMN works.tags IS '作品标签数组';
COMMENT ON COLUMN works.embedding IS '作品向量嵌入，用于相似度计算';
COMMENT ON COLUMN works.status IS '作品状态: draft(草稿), published(已发布), archived(已归档)';

-- ============================================
-- 3. 用户相似度表
-- ============================================
CREATE TABLE IF NOT EXISTS user_similarities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    similar_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    similarity_score NUMERIC NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
    common_interactions INTEGER DEFAULT 0,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, similar_user_id)
);

COMMENT ON TABLE user_similarities IS '用户相似度表，存储用户之间的相似度分数';
COMMENT ON COLUMN user_similarities.similarity_score IS '相似度分数，范围0-1';
COMMENT ON COLUMN user_similarities.common_interactions IS '共同交互的内容数量';

-- ============================================
-- 4. 推荐历史表
-- ============================================
CREATE TABLE IF NOT EXISTS recommendation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL,
    algorithm_type VARCHAR(100) NOT NULL,
    recommendation_score NUMERIC,
    was_clicked BOOLEAN DEFAULT FALSE,
    was_liked BOOLEAN DEFAULT FALSE,
    dwell_time INTEGER DEFAULT 0,
    position INTEGER DEFAULT 0,
    recommended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    context JSONB DEFAULT '{}'
);

COMMENT ON TABLE recommendation_history IS '推荐历史记录表，用于追踪推荐效果';
COMMENT ON COLUMN recommendation_history.algorithm_type IS '使用的推荐算法类型';
COMMENT ON COLUMN recommendation_history.recommendation_score IS '推荐分数';
COMMENT ON COLUMN recommendation_history.was_clicked IS '用户是否点击';
COMMENT ON COLUMN recommendation_history.position IS '推荐内容在列表中的位置';

-- ============================================
-- 5. 用户画像表
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    interests JSONB DEFAULT '{}',
    preference_vector VECTOR(384),
    interaction_count INTEGER DEFAULT 0,
    last_interaction_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE user_profiles IS '用户画像表，存储用户的兴趣偏好';
COMMENT ON COLUMN user_profiles.interests IS '用户兴趣标签及权重，格式: {"tag": weight}';
COMMENT ON COLUMN user_profiles.preference_vector IS '用户偏好向量';
COMMENT ON COLUMN user_profiles.interaction_count IS '用户总交互次数';

-- ============================================
-- 6. 内容统计表
-- ============================================
CREATE TABLE IF NOT EXISTS content_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL UNIQUE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    collect_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    avg_dwell_time NUMERIC DEFAULT 0,
    ctr NUMERIC DEFAULT 0,
    engagement_rate NUMERIC DEFAULT 0,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE content_stats IS '内容统计表，存储内容的互动统计数据';
COMMENT ON COLUMN content_stats.ctr IS '点击率 (Click Through Rate)';
COMMENT ON COLUMN content_stats.engagement_rate IS '互动率';

-- ============================================
-- 7. 推荐配置表
-- ============================================
CREATE TABLE IF NOT EXISTS recommendation_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入默认配置
INSERT INTO recommendation_configs (config_key, config_value, description) VALUES
('collaborative_filtering', '{"enabled": true, "min_similarity": 0.3, "max_neighbors": 50, "time_decay_days": 30}'::jsonb, '协同过滤算法配置'),
('content_based', '{"enabled": true, "tag_weight": 0.4, "category_weight": 0.3, "time_weight": 0.3}'::jsonb, '基于内容的推荐配置'),
('hot_recommendation', '{"enabled": true, "time_window_hours": 72, "min_interactions": 10}'::jsonb, '热门推荐配置'),
('diversity', '{"enabled": true, "lambda": 0.5, "max_same_author": 3, "max_same_category": 5}'::jsonb, '多样性重排序配置'),
('cold_start', '{"enabled": true, "exploration_rate": 0.2, "onboarding_questions": true}'::jsonb, '冷启动策略配置')
ON CONFLICT (config_key) DO NOTHING;

COMMENT ON TABLE recommendation_configs IS '推荐系统配置表';

-- ============================================
-- 8. 启用 RLS 并创建策略
-- ============================================

-- 用户行为表 RLS
ALTER TABLE user_behaviors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own behaviors" ON user_behaviors
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own behaviors" ON user_behaviors
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户相似度表 RLS
ALTER TABLE user_similarities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own similarities" ON user_similarities
    FOR SELECT USING (auth.uid() = user_id);

-- 推荐历史表 RLS
ALTER TABLE recommendation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendation history" ON recommendation_history
    FOR SELECT USING (auth.uid() = user_id);

-- 用户画像表 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- 内容统计表 RLS（公开可读）
ALTER TABLE content_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Content stats are publicly viewable" ON content_stats
    FOR SELECT USING (TRUE);

-- 推荐配置表 RLS（仅管理员可修改，所有人可读）
ALTER TABLE recommendation_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recommendation configs are publicly viewable" ON recommendation_configs
    FOR SELECT USING (TRUE);

-- ============================================
-- 9. 创建触发器函数
-- ============================================

-- 自动更新 updated_at 的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为用户行为表添加触发器
CREATE TRIGGER update_user_behaviors_updated_at
    BEFORE UPDATE ON user_behaviors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 为用户相似度表添加触发器
CREATE TRIGGER update_user_similarities_updated_at
    BEFORE UPDATE ON user_similarities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 为用户画像表添加触发器
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 为内容统计表添加触发器
CREATE TRIGGER update_content_stats_updated_at
    BEFORE UPDATE ON content_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 为推荐配置表添加触发器
CREATE TRIGGER update_recommendation_configs_updated_at
    BEFORE UPDATE ON recommendation_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. 创建辅助函数
-- ============================================

-- 计算内容热度的函数
CREATE OR REPLACE FUNCTION calculate_content_hot_score(
    p_view_count INTEGER,
    p_like_count INTEGER,
    p_collect_count INTEGER,
    p_share_count INTEGER,
    p_comment_count INTEGER,
    p_created_at TIMESTAMP WITH TIME ZONE
)
RETURNS NUMERIC AS $$
DECLARE
    v_score NUMERIC;
    v_hours_since_created NUMERIC;
BEGIN
    -- 基础分数计算
    v_score := (p_view_count * 1.0) + 
               (p_like_count * 3.0) + 
               (p_collect_count * 5.0) + 
               (p_share_count * 8.0) + 
               (p_comment_count * 4.0);
    
    -- 时间衰减因子
    v_hours_since_created := EXTRACT(EPOCH FROM (NOW() - p_created_at)) / 3600;
    
    -- 应用时间衰减 (Hacker News 算法风格)
    v_score := v_score / POWER((v_hours_since_created + 2), 1.5);
    
    RETURN ROUND(v_score, 4);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 获取用户偏好的函数
CREATE OR REPLACE FUNCTION get_user_preferences(p_user_id UUID)
RETURNS TABLE (tag TEXT, weight NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        jsonb_object_keys(up.interests) as tag,
        (up.interests ->> jsonb_object_keys(up.interests))::NUMERIC as weight
    FROM user_profiles up
    WHERE up.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- 输出创建结果
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '推荐系统基础表创建完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '创建的表：';
    RAISE NOTICE '  - user_behaviors: 用户行为表';
    RAISE NOTICE '  - works: 扩展现有works表（添加hot_score, category_id, tags, embedding等字段）';
    RAISE NOTICE '  - user_similarities: 用户相似度表';
    RAISE NOTICE '  - recommendation_history: 推荐历史表';
    RAISE NOTICE '  - user_profiles: 用户画像表';
    RAISE NOTICE '  - content_stats: 内容统计表';
    RAISE NOTICE '  - recommendation_configs: 推荐配置表';
    RAISE NOTICE '========================================';
END $$;
