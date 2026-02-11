-- 搜索功能相关表结构
-- 创建时间: 2026-02-11

-- 1. 用户搜索历史表
CREATE TABLE IF NOT EXISTS user_search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    search_type VARCHAR(50) DEFAULT 'general',
    result_count INTEGER DEFAULT 0,
    clicked_result_id UUID,
    clicked_result_type VARCHAR(50),
    search_filters JSONB DEFAULT '{}',
    search_duration_ms INTEGER,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 搜索历史表索引
CREATE INDEX IF NOT EXISTS idx_user_search_history_user_id ON user_search_history(user_id);
-- 使用 simple 配置创建全文搜索索引（Supabase 默认不支持 chinese 配置）
CREATE INDEX IF NOT EXISTS idx_user_search_history_query ON user_search_history USING gin(to_tsvector('simple', query));
CREATE INDEX IF NOT EXISTS idx_user_search_history_created_at ON user_search_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_search_history_search_type ON user_search_history(search_type);

-- 2. 热门搜索表
CREATE TABLE IF NOT EXISTS hot_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL UNIQUE,
    search_count INTEGER DEFAULT 1,
    unique_searchers INTEGER DEFAULT 1,
    trend_score DECIMAL(10, 4) DEFAULT 0,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    last_searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 热门搜索表索引
CREATE INDEX IF NOT EXISTS idx_hot_searches_search_count ON hot_searches(search_count DESC);
CREATE INDEX IF NOT EXISTS idx_hot_searches_trend_score ON hot_searches(trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_hot_searches_category ON hot_searches(category);
CREATE INDEX IF NOT EXISTS idx_hot_searches_is_active ON hot_searches(is_active);

-- 3. 搜索建议词库表
CREATE TABLE IF NOT EXISTS search_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword TEXT NOT NULL,
    category VARCHAR(50),
    weight INTEGER DEFAULT 1,
    is_hot BOOLEAN DEFAULT false,
    is_recommended BOOLEAN DEFAULT false,
    click_count INTEGER DEFAULT 0,
    search_count INTEGER DEFAULT 0,
    related_keywords TEXT[],
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(keyword, category)
);

-- 搜索建议表索引（使用 simple 配置）
CREATE INDEX IF NOT EXISTS idx_search_suggestions_keyword ON search_suggestions USING gin(to_tsvector('simple', keyword));
CREATE INDEX IF NOT EXISTS idx_search_suggestions_weight ON search_suggestions(weight DESC);
CREATE INDEX IF NOT EXISTS idx_search_suggestions_is_hot ON search_suggestions(is_hot) WHERE is_hot = true;
CREATE INDEX IF NOT EXISTS idx_search_suggestions_category ON search_suggestions(category);

-- 4. 用户搜索偏好表
CREATE TABLE IF NOT EXISTS user_search_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preferred_categories TEXT[] DEFAULT '{}',
    preferred_tags TEXT[] DEFAULT '{}',
    preferred_authors UUID[] DEFAULT '{}',
    search_history_enabled BOOLEAN DEFAULT true,
    personalized_recommendations_enabled BOOLEAN DEFAULT true,
    auto_suggest_enabled BOOLEAN DEFAULT true,
    safe_search_enabled BOOLEAN DEFAULT false,
    results_per_page INTEGER DEFAULT 20,
    default_sort_by VARCHAR(50) DEFAULT 'relevance',
    ui_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 搜索偏好表索引
CREATE INDEX IF NOT EXISTS idx_user_search_preferences_user_id ON user_search_preferences(user_id);

-- 5. 搜索行为跟踪表（用于个性化推荐）
CREATE TABLE IF NOT EXISTS search_behavior_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id UUID,
    search_query TEXT NOT NULL,
    search_results_shown INTEGER DEFAULT 0,
    result_clicked BOOLEAN DEFAULT false,
    clicked_result_id UUID,
    clicked_result_type VARCHAR(50),
    click_position INTEGER,
    time_to_click_ms INTEGER,
    dwell_time_ms INTEGER,
    converted BOOLEAN DEFAULT false,
    conversion_type VARCHAR(50),
    search_context JSONB DEFAULT '{}',
    device_type VARCHAR(50),
    browser_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 行为跟踪表索引
CREATE INDEX IF NOT EXISTS idx_search_behavior_tracking_user_id ON search_behavior_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_search_behavior_tracking_session_id ON search_behavior_tracking(session_id);
CREATE INDEX IF NOT EXISTS idx_search_behavior_tracking_created_at ON search_behavior_tracking(created_at DESC);

-- 设置RLS策略
ALTER TABLE user_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_search_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_behavior_tracking ENABLE ROW LEVEL SECURITY;

-- 搜索历史策略：用户只能看到自己的搜索历史
CREATE POLICY "Users can view own search history" ON user_search_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search history" ON user_search_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own search history" ON user_search_history
    FOR DELETE USING (auth.uid() = user_id);

-- 搜索偏好策略
CREATE POLICY "Users can view own search preferences" ON user_search_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search preferences" ON user_search_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own search preferences" ON user_search_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- 行为跟踪策略
CREATE POLICY "Users can view own behavior tracking" ON search_behavior_tracking
    FOR SELECT USING (auth.uid() = user_id);

-- 热门搜索和建议词库对所有用户可读
ALTER TABLE hot_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view hot searches" ON hot_searches
    FOR SELECT USING (is_active = true);

CREATE POLICY "Everyone can view search suggestions" ON search_suggestions
    FOR SELECT USING (is_active = true);

-- 创建更新热门搜索趋势分数的函数
CREATE OR REPLACE FUNCTION update_hot_search_trend_score()
RETURNS TRIGGER AS $$
BEGIN
    -- 计算趋势分数：基于搜索次数、时间衰减（最近7天权重更高）
    NEW.trend_score := (
        NEW.search_count * 1.0 +
        (CASE 
            WHEN NEW.last_searched_at > NOW() - INTERVAL '1 day' THEN 50
            WHEN NEW.last_searched_at > NOW() - INTERVAL '7 days' THEN 20
            ELSE 0
        END)
    ) / (
        EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) / 86400.0 + 1
    );
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trigger_update_hot_search_trend_score
    BEFORE UPDATE ON hot_searches
    FOR EACH ROW
    EXECUTE FUNCTION update_hot_search_trend_score();

-- 创建记录搜索历史的函数
CREATE OR REPLACE FUNCTION record_search_history(
    p_user_id UUID,
    p_query TEXT,
    p_search_type VARCHAR DEFAULT 'general',
    p_result_count INTEGER DEFAULT 0,
    p_filters JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_history_id UUID;
BEGIN
    INSERT INTO user_search_history (
        user_id, query, search_type, result_count, search_filters
    ) VALUES (
        p_user_id, p_query, p_search_type, p_result_count, p_filters
    )
    RETURNING id INTO v_history_id;
    
    -- 更新或插入热门搜索
    INSERT INTO hot_searches (query, search_count, last_searched_at)
    VALUES (p_query, 1, NOW())
    ON CONFLICT (query) DO UPDATE SET
        search_count = hot_searches.search_count + 1,
        last_searched_at = NOW();
    
    RETURN v_history_id;
END;
$$ LANGUAGE plpgsql;

-- 创建清理旧搜索历史的函数（保留最近100条）
CREATE OR REPLACE FUNCTION cleanup_old_search_history(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM user_search_history
    WHERE user_id = p_user_id
    AND id NOT IN (
        SELECT id FROM user_search_history
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT 100
    );
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 创建获取个性化搜索建议的函数
CREATE OR REPLACE FUNCTION get_personalized_suggestions(
    p_user_id UUID,
    p_query TEXT,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    keyword TEXT,
    category VARCHAR,
    weight INTEGER,
    is_hot BOOLEAN,
    relevance_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH user_preferences AS (
        SELECT preferred_categories, preferred_tags
        FROM user_search_preferences
        WHERE user_id = p_user_id
    ),
    user_history AS (
        SELECT query, COUNT(*) as search_count
        FROM user_search_history
        WHERE user_id = p_user_id
        AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY query
    )
    SELECT 
        s.id,
        s.keyword,
        s.category,
        s.weight,
        s.is_hot,
        (
            s.weight * 1.0 +
            (CASE WHEN s.is_hot THEN 50 ELSE 0 END) +
            (CASE 
                WHEN s.category = ANY(SELECT preferred_categories FROM user_preferences) THEN 30
                ELSE 0
            END) +
            (CASE 
                WHEN s.keyword ILIKE '%' || p_query || '%' THEN 100
                ELSE 0
            END) +
            COALESCE((SELECT search_count FROM user_history WHERE query = s.keyword), 0) * 5
        )::DECIMAL as relevance_score
    FROM search_suggestions s
    WHERE s.is_active = true
    AND (s.keyword ILIKE '%' || p_query || '%' OR p_query = '')
    ORDER BY relevance_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 插入默认搜索建议数据
INSERT INTO search_suggestions (keyword, category, weight, is_hot, is_recommended) VALUES
('国潮设计', 'design', 100, true, true),
('纹样设计', 'design', 95, true, true),
('品牌设计', 'design', 90, true, true),
('非遗传承', 'culture', 85, true, true),
('插画设计', 'design', 80, true, true),
('工艺创新', 'design', 75, true, false),
('老字号品牌', 'brand', 70, true, false),
('IP设计', 'design', 65, true, true),
('包装设计', 'design', 60, true, false),
('海报设计', 'design', 55, false, true),
('字体设计', 'design', 50, false, false),
('标志设计', 'design', 45, false, false),
('VI设计', 'design', 40, false, false),
('UI设计', 'design', 35, false, true),
('平面设计', 'design', 30, false, false),
('文创产品', 'product', 85, true, true),
('天津文化', 'culture', 80, true, true),
('民俗艺术', 'culture', 75, false, false),
('传统手工艺', 'culture', 70, false, false),
('现代设计', 'design', 65, false, true)
ON CONFLICT (keyword, category) DO UPDATE SET
    weight = EXCLUDED.weight,
    is_hot = EXCLUDED.is_hot,
    is_recommended = EXCLUDED.is_recommended,
    updated_at = NOW();

-- 添加注释
COMMENT ON TABLE user_search_history IS '用户搜索历史表';
COMMENT ON TABLE hot_searches IS '热门搜索表';
COMMENT ON TABLE search_suggestions IS '搜索建议词库表';
COMMENT ON TABLE user_search_preferences IS '用户搜索偏好表';
COMMENT ON TABLE search_behavior_tracking IS '搜索行为跟踪表';
