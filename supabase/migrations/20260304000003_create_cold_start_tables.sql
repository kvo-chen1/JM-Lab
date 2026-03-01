-- ============================================
-- 第三阶段：冷启动优化数据库表结构
-- ============================================

-- 用户人口属性表
CREATE TABLE IF NOT EXISTS user_demographics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    age_group VARCHAR(20),                    -- 年龄段: teen, young_adult, adult, middle_aged, senior
    gender VARCHAR(20),                       -- 性别: male, female, other, prefer_not_to_say
    location VARCHAR(100),                    -- 地理位置
    interests TEXT[],                         -- 兴趣标签数组
    preferred_categories UUID[],              -- 偏好内容分类ID数组
    preferred_content_types VARCHAR(50)[],    -- 偏好内容类型
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_data JSONB,                    -- Onboarding问卷原始数据
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 创建索引
CREATE INDEX idx_user_demographics_user_id ON user_demographics(user_id);
CREATE INDEX idx_user_demographics_age_group ON user_demographics(age_group);
CREATE INDEX idx_user_demographics_interests ON user_demographics USING GIN(interests);

-- 用户探索-利用状态表
CREATE TABLE IF NOT EXISTS user_exploration_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exploration_rate DECIMAL(3,2) DEFAULT 0.30,       -- 当前探索率
    total_interactions INTEGER DEFAULT 0,              -- 总互动数
    exploration_count INTEGER DEFAULT 0,               -- 探索次数
    exploitation_count INTEGER DEFAULT 0,              -- 利用次数
    discovered_categories TEXT[],                      -- 已发现感兴趣的分类
    discovered_tags TEXT[],                            -- 已发现感兴趣的标签
    last_exploration_at TIMESTAMPTZ,                   -- 上次探索时间
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX idx_user_exploration_user_id ON user_exploration_state(user_id);

-- 内容质量评估表
CREATE TABLE IF NOT EXISTS content_quality_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    completeness_score DECIMAL(4,3),          -- 完整度评分 0-1
    visual_quality_score DECIMAL(4,3),        -- 视觉质量评分 0-1
    text_quality_score DECIMAL(4,3),          -- 文本质量评分 0-1
    predicted_engagement DECIMAL(4,3),        -- 预测互动率 0-1
    overall_quality_score DECIMAL(4,3),       -- 综合质量分 0-1
    quality_factors JSONB,                    -- 各维度评分详情
    assessed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(content_id)
);

CREATE INDEX idx_content_quality_score ON content_quality_assessments(overall_quality_score DESC);
CREATE INDEX idx_content_quality_content_id ON content_quality_assessments(content_id);

-- 小流量测试表
CREATE TABLE IF NOT EXISTS small_traffic_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    test_status VARCHAR(20) DEFAULT 'running',     -- running, passed, failed, graduated
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    sample_size INTEGER DEFAULT 0,                  -- 测试样本量
    target_sample_size INTEGER DEFAULT 100,         -- 目标样本量
    exposure_count INTEGER DEFAULT 0,               -- 曝光次数
    click_count INTEGER DEFAULT 0,                  -- 点击次数
    like_count INTEGER DEFAULT 0,                   -- 点赞次数
    ctr DECIMAL(5,4),                               -- 点击率
    engagement_rate DECIMAL(5,4),                   -- 互动率
    quality_threshold DECIMAL(4,3) DEFAULT 0.60,    -- 通过阈值
    graduation_threshold DECIMAL(4,3) DEFAULT 0.75, -- 毕业阈值（进入正常推荐池）
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(content_id)
);

CREATE INDEX idx_small_traffic_test_status ON small_traffic_tests(test_status);
CREATE INDEX idx_small_traffic_content_id ON small_traffic_tests(content_id);
CREATE INDEX idx_small_traffic_start_time ON small_traffic_tests(start_time);

-- 小流量测试用户曝光记录表（用于控制曝光量和去重）
CREATE TABLE IF NOT EXISTS small_traffic_exposures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES small_traffic_tests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    exposed_at TIMESTAMPTZ DEFAULT NOW(),
    clicked BOOLEAN DEFAULT false,
    liked BOOLEAN DEFAULT false,
    dwell_time INTEGER,                         -- 停留时间（秒）
    UNIQUE(test_id, user_id)
);

CREATE INDEX idx_small_traffic_exposures_test_id ON small_traffic_exposures(test_id);
CREATE INDEX idx_small_traffic_exposures_user_id ON small_traffic_exposures(user_id);

-- 新内容推荐池表（已通过小流量测试的内容）
CREATE TABLE IF NOT EXISTS new_content_boost_pool (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    quality_score DECIMAL(4,3),                 -- 质量评分
    test_performance DECIMAL(5,4),              -- 测试期表现
    boost_factor DECIMAL(3,2) DEFAULT 1.5,      -- 提升倍数
    boost_start_time TIMESTAMPTZ DEFAULT NOW(),
    boost_end_time TIMESTAMPTZ,                 -- 提升结束时间（通常72小时）
    current_status VARCHAR(20) DEFAULT 'boosting', -- boosting, normal, expired
    total_exposure INTEGER DEFAULT 0,           -- 总曝光量
    total_clicks INTEGER DEFAULT 0,             -- 总点击量
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(content_id)
);

CREATE INDEX idx_new_content_boost_status ON new_content_boost_pool(current_status);
CREATE INDEX idx_new_content_boost_end_time ON new_content_boost_pool(boost_end_time);

-- 冷启动推荐日志表（用于分析冷启动效果）
CREATE TABLE IF NOT EXISTS cold_start_recommendation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50),            -- onboarding, demographic, exploration, trending
    content_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    position INTEGER,                           -- 推荐位置
    was_clicked BOOLEAN DEFAULT false,
    was_liked BOOLEAN DEFAULT false,
    dwell_time INTEGER,
    recommended_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cold_start_logs_user_id ON cold_start_recommendation_logs(user_id);
CREATE INDEX idx_cold_start_logs_type ON cold_start_recommendation_logs(recommendation_type);
CREATE INDEX idx_cold_start_logs_time ON cold_start_recommendation_logs(recommended_at);

-- 更新时间戳触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为相关表添加更新时间戳触发器
DROP TRIGGER IF EXISTS update_user_demographics_updated_at ON user_demographics;
CREATE TRIGGER update_user_demographics_updated_at
    BEFORE UPDATE ON user_demographics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_exploration_state_updated_at ON user_exploration_state;
CREATE TRIGGER update_user_exploration_state_updated_at
    BEFORE UPDATE ON user_exploration_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_small_traffic_tests_updated_at ON small_traffic_tests;
CREATE TRIGGER update_small_traffic_tests_updated_at
    BEFORE UPDATE ON small_traffic_tests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_new_content_boost_pool_updated_at ON new_content_boost_pool;
CREATE TRIGGER update_new_content_boost_pool_updated_at
    BEFORE UPDATE ON new_content_boost_pool
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 小流量测试状态更新函数
CREATE OR REPLACE FUNCTION update_small_traffic_test_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新测试统计
    UPDATE small_traffic_tests
    SET 
        exposure_count = exposure_count + 1,
        click_count = click_count + CASE WHEN NEW.clicked THEN 1 ELSE 0 END,
        like_count = like_count + CASE WHEN NEW.liked THEN 1 ELSE 0 END,
        sample_size = sample_size + 1,
        ctr = CASE 
            WHEN exposure_count + 1 > 0 
            THEN (click_count + CASE WHEN NEW.clicked THEN 1 ELSE 0 END)::DECIMAL / (exposure_count + 1)
            ELSE 0 
        END,
        engagement_rate = CASE 
            WHEN exposure_count + 1 > 0 
            THEN (like_count + CASE WHEN NEW.liked THEN 1 ELSE 0 END)::DECIMAL / (exposure_count + 1)
            ELSE 0 
        END,
        updated_at = NOW()
    WHERE id = NEW.test_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_test_metrics ON small_traffic_exposures;
CREATE TRIGGER trigger_update_test_metrics
    AFTER INSERT ON small_traffic_exposures
    FOR EACH ROW EXECUTE FUNCTION update_small_traffic_test_metrics();

-- 自动评估测试状态函数
CREATE OR REPLACE FUNCTION evaluate_small_traffic_test()
RETURNS TRIGGER AS $$
BEGIN
    -- 检查是否达到目标样本量
    IF NEW.sample_size >= NEW.target_sample_size THEN
        -- 评估是否通过
        IF NEW.engagement_rate >= NEW.quality_threshold THEN
            IF NEW.engagement_rate >= NEW.graduation_threshold THEN
                NEW.test_status := 'graduated';
                NEW.end_time := NOW();
                
                -- 自动加入新内容推荐池
                INSERT INTO new_content_boost_pool (content_id, quality_score, test_performance)
                VALUES (NEW.content_id, 
                        (SELECT overall_quality_score FROM content_quality_assessments WHERE content_id = NEW.content_id),
                        NEW.engagement_rate)
                ON CONFLICT (content_id) DO UPDATE SET
                    test_performance = EXCLUDED.test_performance,
                    updated_at = NOW();
            ELSE
                NEW.test_status := 'passed';
                NEW.end_time := NOW();
            END IF;
        ELSE
            NEW.test_status := 'failed';
            NEW.end_time := NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_evaluate_test ON small_traffic_tests;
CREATE TRIGGER trigger_evaluate_test
    BEFORE UPDATE ON small_traffic_tests
    FOR EACH ROW EXECUTE FUNCTION evaluate_small_traffic_test();

-- 启用RLS
ALTER TABLE user_demographics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exploration_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_quality_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE small_traffic_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE small_traffic_exposures ENABLE ROW LEVEL SECURITY;
ALTER TABLE new_content_boost_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE cold_start_recommendation_logs ENABLE ROW LEVEL SECURITY;

-- 创建访问策略
-- 用户只能查看和修改自己的人口属性
CREATE POLICY user_demographics_owner_policy ON user_demographics
    FOR ALL USING (auth.uid() = user_id);

-- 用户只能查看自己的探索状态
CREATE POLICY user_exploration_state_owner_policy ON user_exploration_state
    FOR SELECT USING (auth.uid() = user_id);

-- 内容质量评估公开可读
CREATE POLICY content_quality_public_policy ON content_quality_assessments
    FOR SELECT USING (true);

-- 小流量测试数据服务层可管理
CREATE POLICY small_traffic_tests_service_policy ON small_traffic_tests
    FOR ALL USING (true);

CREATE POLICY small_traffic_exposures_service_policy ON small_traffic_exposures
    FOR ALL USING (true);

-- 新内容推荐池公开可读
CREATE POLICY new_content_boost_pool_public_policy ON new_content_boost_pool
    FOR SELECT USING (true);

-- 冷启动日志服务层可管理
CREATE POLICY cold_start_logs_service_policy ON cold_start_recommendation_logs
    FOR ALL USING (true);

-- ============================================
-- 冷启动统计视图
-- ============================================

-- 冷启动效果统计视图
CREATE OR REPLACE VIEW cold_start_analytics AS
SELECT 
    recommendation_type,
    COUNT(*) as total_recommendations,
    COUNT(CASE WHEN was_clicked THEN 1 END) as clicks,
    COUNT(CASE WHEN was_liked THEN 1 END) as likes,
    ROUND(COUNT(CASE WHEN was_clicked THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2) as ctr_percent,
    ROUND(COUNT(CASE WHEN was_liked THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2) as like_rate_percent,
    ROUND(AVG(COALESCE(dwell_time, 0))::DECIMAL, 2) as avg_dwell_time_seconds,
    DATE_TRUNC('day', recommended_at) as date
FROM cold_start_recommendation_logs
GROUP BY recommendation_type, DATE_TRUNC('day', recommended_at)
ORDER BY date DESC, total_recommendations DESC;

-- 小流量测试效果视图
CREATE OR REPLACE VIEW small_traffic_test_analytics AS
SELECT 
    stt.test_status,
    COUNT(*) as test_count,
    ROUND(AVG(stt.ctr)::DECIMAL * 100, 2) as avg_ctr_percent,
    ROUND(AVG(stt.engagement_rate)::DECIMAL * 100, 2) as avg_engagement_rate_percent,
    ROUND(AVG(stt.sample_size), 0) as avg_sample_size,
    ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(stt.end_time, NOW()) - stt.start_time)) / 3600)::DECIMAL, 2) as avg_test_duration_hours
FROM small_traffic_tests stt
GROUP BY stt.test_status;

-- 新内容表现视图
CREATE OR REPLACE VIEW new_content_performance AS
SELECT 
    ncbp.content_id,
    p.title,
    ncbp.quality_score,
    ncbp.test_performance,
    ncbp.boost_factor,
    ncbp.total_exposure,
    ncbp.total_clicks,
    ROUND(ncbp.total_clicks::DECIMAL / NULLIF(ncbp.total_exposure, 0) * 100, 2) as actual_ctr_percent,
    ncbp.current_status,
    ncbp.boost_start_time,
    ncbp.boost_end_time
FROM new_content_boost_pool ncbp
JOIN posts p ON ncbp.content_id = p.id
ORDER BY ncbp.test_performance DESC;

COMMENT ON TABLE user_demographics IS '用户人口属性信息，用于冷启动推荐';
COMMENT ON TABLE user_exploration_state IS '用户探索-利用状态，记录探索偏好发现过程';
COMMENT ON TABLE content_quality_assessments IS '内容质量预评估结果';
COMMENT ON TABLE small_traffic_tests IS '小流量测试记录，用于新内容冷启动';
COMMENT ON TABLE small_traffic_exposures IS '小流量测试用户曝光记录';
COMMENT ON TABLE new_content_boost_pool IS '新内容推荐池，已通过测试的内容获得流量提升';
COMMENT ON TABLE cold_start_recommendation_logs IS '冷启动推荐效果日志';
