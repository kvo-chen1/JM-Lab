-- ============================================
-- 实时推荐系统数据库表结构
-- 第二阶段优化：实时推荐管道支持
-- ============================================

-- 1. 用户行为事件表（实时收集）
CREATE TABLE IF NOT EXISTS user_behavior_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click', 'like', 'share', 'comment', 'dwell')),
    item_id UUID NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('post', 'work', 'challenge', 'template')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 索引优化
    CONSTRAINT idx_user_behavior_events_user_id_created_at 
        UNIQUE (user_id, created_at, id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_behavior_events_user_time 
    ON user_behavior_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_events_item 
    ON user_behavior_events(item_id, item_type);
CREATE INDEX IF NOT EXISTS idx_behavior_events_type 
    ON user_behavior_events(event_type);

-- 2. 实时用户特征表（缓存）
CREATE TABLE IF NOT EXISTS user_realtime_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- 实时统计特征
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    avg_dwell_time INTEGER DEFAULT 0, -- 毫秒
    current_session_duration INTEGER DEFAULT 0, -- 毫秒
    
    -- 实时兴趣特征（JSONB存储）
    interest_categories JSONB DEFAULT '{}'::jsonb,
    interest_tags JSONB DEFAULT '{}'::jsonb,
    interest_authors JSONB DEFAULT '{}'::jsonb,
    
    -- 上下文特征
    context_time_of_day INTEGER,
    context_day_of_week INTEGER,
    context_device_type TEXT,
    context_location TEXT,
    
    -- 元数据
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 过期时间（用于自动清理）
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour')
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_realtime_features_user 
    ON user_realtime_features(user_id);
CREATE INDEX IF NOT EXISTS idx_realtime_features_expires 
    ON user_realtime_features(expires_at);

-- 3. 实时推荐结果缓存表
CREATE TABLE IF NOT EXISTS realtime_recommendation_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 推荐结果（JSONB数组）
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- 分数统计
    diversity_score DECIMAL(3,2),
    relevance_score DECIMAL(3,2),
    mmr_score DECIMAL(3,2),
    
    -- 生成上下文
    generated_context JSONB DEFAULT '{}'::jsonb,
    
    -- 时间戳
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes'),
    
    -- 唯一约束：每个用户同一时间只有一个有效推荐
    CONSTRAINT idx_recommendation_cache_user_expires 
        UNIQUE (user_id, expires_at)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_recommendation_cache_user 
    ON realtime_recommendation_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_cache_expires 
    ON realtime_recommendation_cache(expires_at);

-- 4. 内容向量表（用于相似度计算）
CREATE TABLE IF NOT EXISTS content_vectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('post', 'work', 'challenge', 'template')),
    
    -- 特征向量（使用pgvector扩展）
    -- 注意：需要先安装pgvector扩展
    -- embedding vector(128),
    
    -- 特征标签
    category TEXT,
    tags TEXT[],
    author_id UUID,
    theme TEXT,
    
    -- 元数据
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 唯一约束
    CONSTRAINT idx_content_vectors_item UNIQUE (item_id, item_type)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_content_vectors_category 
    ON content_vectors(category);
CREATE INDEX IF NOT EXISTS idx_content_vectors_author 
    ON content_vectors(author_id);
CREATE INDEX IF NOT EXISTS idx_content_vectors_tags 
    ON content_vectors USING GIN(tags);

-- 5. 推荐效果统计表
CREATE TABLE IF NOT EXISTS recommendation_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 推荐标识
    recommendation_id UUID REFERENCES realtime_recommendation_cache(id),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 展示统计
    impression_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    
    -- 互动统计
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    
    -- 停留时长（毫秒）
    total_dwell_time INTEGER DEFAULT 0,
    avg_dwell_time INTEGER DEFAULT 0,
    
    -- 转化率
    conversion_rate DECIMAL(5,4),
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_metrics_user 
    ON recommendation_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_metrics_recommendation 
    ON recommendation_metrics(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_metrics_created 
    ON recommendation_metrics(created_at);

-- ============================================
-- RLS策略
-- ============================================

-- 用户行为事件表RLS
ALTER TABLE user_behavior_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own behavior events"
    ON user_behavior_events FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service can insert behavior events"
    ON user_behavior_events FOR INSERT
    WITH CHECK (true);

-- 实时特征表RLS
ALTER TABLE user_realtime_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own features"
    ON user_realtime_features FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service can manage features"
    ON user_realtime_features FOR ALL
    USING (true);

-- 推荐缓存表RLS
ALTER TABLE realtime_recommendation_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recommendations"
    ON realtime_recommendation_cache FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service can manage recommendations"
    ON realtime_recommendation_cache FOR ALL
    USING (true);

-- ============================================
-- 函数和触发器
-- ============================================

-- 自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为相关表添加触发器
CREATE TRIGGER update_content_vectors_updated_at
    BEFORE UPDATE ON content_vectors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recommendation_metrics_updated_at
    BEFORE UPDATE ON recommendation_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 清理过期推荐缓存的函数
CREATE OR REPLACE FUNCTION cleanup_expired_recommendations()
RETURNS void AS $$
BEGIN
    DELETE FROM realtime_recommendation_cache 
    WHERE expires_at < NOW();
    
    DELETE FROM user_realtime_features 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 聚合用户实时特征的函数
CREATE OR REPLACE FUNCTION aggregate_user_realtime_features(
    p_user_id UUID,
    p_time_window INTERVAL DEFAULT INTERVAL '1 hour'
)
RETURNS TABLE (
    view_count INTEGER,
    click_count INTEGER,
    like_count INTEGER,
    avg_dwell_time INTEGER,
    top_categories JSONB,
    top_tags JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH user_events AS (
        SELECT 
            event_type,
            metadata,
            created_at
        FROM user_behavior_events
        WHERE user_id = p_user_id
            AND created_at >= NOW() - p_time_window
    ),
    event_stats AS (
        SELECT
            COUNT(*) FILTER (WHERE event_type = 'view') as view_count,
            COUNT(*) FILTER (WHERE event_type = 'click') as click_count,
            COUNT(*) FILTER (WHERE event_type = 'like') as like_count,
            AVG((metadata->>'dwellTime')::INTEGER) FILTER (WHERE event_type = 'dwell') as avg_dwell_time
        FROM user_events
    )
    SELECT 
        es.view_count::INTEGER,
        es.click_count::INTEGER,
        es.like_count::INTEGER,
        COALESCE(es.avg_dwell_time, 0)::INTEGER,
        '{}'::JSONB as top_categories,
        '{}'::JSONB as top_tags
    FROM event_stats es;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 注释说明
-- ============================================

COMMENT ON TABLE user_behavior_events IS '用户实时行为事件表，用于收集和存储用户的实时行为数据';
COMMENT ON TABLE user_realtime_features IS '用户实时特征表，缓存用户的实时计算特征';
COMMENT ON TABLE realtime_recommendation_cache IS '实时推荐结果缓存表，存储生成的推荐结果';
COMMENT ON TABLE content_vectors IS '内容向量表，存储内容的特征向量用于相似度计算';
COMMENT ON TABLE recommendation_metrics IS '推荐效果统计表，用于评估推荐质量';

-- ============================================
-- 权限设置
-- ============================================

-- 授予服务角色必要的权限
GRANT ALL ON user_behavior_events TO service_role;
GRANT ALL ON user_realtime_features TO service_role;
GRANT ALL ON realtime_recommendation_cache TO service_role;
GRANT ALL ON content_vectors TO service_role;
GRANT ALL ON recommendation_metrics TO service_role;

-- 授予认证用户查询权限
GRANT SELECT ON user_behavior_events TO authenticated;
GRANT SELECT ON user_realtime_features TO authenticated;
GRANT SELECT ON realtime_recommendation_cache TO authenticated;
