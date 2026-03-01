-- Migration: 添加推荐系统优化索引
-- Created: 2026-03-04
-- Description: 为推荐系统核心表添加性能优化索引
-- 注意：此迁移应在 20260304000000_create_recommendation_base_tables.sql 之后执行

-- ============================================
-- 0. 确保扩展已启用
-- ============================================

-- 确保 pgvector 扩展已启用（用于向量索引）
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 1. 用户行为表索引优化
-- ============================================

-- 用户行为查询索引：支持按用户和时间范围查询
CREATE INDEX IF NOT EXISTS idx_user_behaviors_user_id_created_at 
ON user_behaviors(user_id, created_at DESC);

-- 行为类型索引：支持按行为类型统计
CREATE INDEX IF NOT EXISTS idx_user_behaviors_behavior_type 
ON user_behaviors(behavior_type) 
WHERE behavior_type IN ('like', 'collect', 'share', 'comment');

-- 内容行为索引：支持查找内容的互动用户
CREATE INDEX IF NOT EXISTS idx_user_behaviors_content_id_behavior 
ON user_behaviors(content_id, behavior_type, created_at DESC);

-- 复合索引：支持用户-内容-行为的唯一性检查和快速查询
CREATE INDEX IF NOT EXISTS idx_user_behaviors_user_content_behavior 
ON user_behaviors(user_id, content_id, behavior_type);

-- ============================================
-- 2. works 表索引优化
-- ============================================

DO $$
BEGIN
    -- 作品热度索引：支持按热度排序
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'works' AND column_name = 'hot_score') THEN
        CREATE INDEX IF NOT EXISTS idx_works_hot_score 
        ON works(hot_score DESC) 
        WHERE hot_score > 0;
    END IF;
    
    -- 作品创建时间索引：支持时间线查询
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'works' AND column_name = 'created_at') THEN
        CREATE INDEX IF NOT EXISTS idx_works_created_at 
        ON works(created_at DESC);
    END IF;
    
    -- 作者作品索引：支持查找作者的所有作品（使用 creator_id 字段）
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'works' AND column_name = 'creator_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'works' AND column_name = 'created_at') THEN
            CREATE INDEX IF NOT EXISTS idx_works_creator_id_created_at 
            ON works(creator_id, created_at DESC);
        END IF;
    END IF;
    
    -- 作品分类索引：支持按分类筛选（使用 category 字段）
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'works' AND column_name = 'category') THEN
        CREATE INDEX IF NOT EXISTS idx_works_category 
        ON works(category) 
        WHERE category IS NOT NULL;
    END IF;
    
    -- 作品状态索引：支持只查询已发布作品
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'works' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_works_status 
        ON works(status) 
        WHERE status = 'published';
    END IF;
    
    -- 作品标签GIN索引：支持标签搜索
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'works' AND column_name = 'tags') THEN
        CREATE INDEX IF NOT EXISTS idx_works_tags 
        ON works USING GIN(tags);
    END IF;
    
    -- 作品向量相似度索引（使用 pgvector 的 HNSW 索引）
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'works' AND column_name = 'embedding') THEN
        CREATE INDEX IF NOT EXISTS idx_works_embedding_hnsw 
        ON works 
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64);
    END IF;
END $$;

-- ============================================
-- 3. 用户相似度表索引优化
-- ============================================

-- 用户相似度查询索引
CREATE INDEX IF NOT EXISTS idx_user_similarities_user_id 
ON user_similarities(user_id, similarity_score DESC);

-- 相似用户反向索引：支持查找谁与某用户相似
CREATE INDEX IF NOT EXISTS idx_user_similarities_similar_user_id 
ON user_similarities(similar_user_id, similarity_score DESC);

-- 相似度分数索引：支持查找高相似度用户对
CREATE INDEX IF NOT EXISTS idx_user_similarities_score 
ON user_similarities(similarity_score DESC) 
WHERE similarity_score >= 0.5;

-- ============================================
-- 4. 推荐历史表索引优化
-- ============================================

-- 用户推荐历史索引
CREATE INDEX IF NOT EXISTS idx_recommendation_history_user_id 
ON recommendation_history(user_id, recommended_at DESC);

-- 推荐内容索引：支持内容推荐效果分析
CREATE INDEX IF NOT EXISTS idx_recommendation_history_content_id 
ON recommendation_history(content_id, recommended_at DESC);

-- 推荐算法索引：支持算法效果对比
CREATE INDEX IF NOT EXISTS idx_recommendation_history_algorithm 
ON recommendation_history(algorithm_type, recommended_at DESC);

-- 用户-内容唯一推荐索引：避免重复推荐
CREATE INDEX IF NOT EXISTS idx_recommendation_history_user_content 
ON recommendation_history(user_id, content_id);

-- ============================================
-- 5. 用户画像表索引优化
-- ============================================

-- 用户画像查询索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id 
ON user_profiles(user_id);

-- 兴趣标签GIN索引：支持基于兴趣的查询
CREATE INDEX IF NOT EXISTS idx_user_profiles_interests 
ON user_profiles USING GIN(interests);

-- 用户偏好向量索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_preference_vector 
ON user_profiles 
USING hnsw (preference_vector vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ============================================
-- 6. 内容统计表索引优化
-- ============================================

-- 内容统计查询索引
CREATE INDEX IF NOT EXISTS idx_content_stats_content_id 
ON content_stats(content_id);

-- 高互动内容索引
CREATE INDEX IF NOT EXISTS idx_content_stats_engagement 
ON content_stats(engagement_rate DESC) 
WHERE engagement_rate > 0;

-- ============================================
-- 7. 实时推荐相关索引（如果表存在）
-- ============================================

DO $$
BEGIN
    -- 用户实时特征索引（只在表存在且索引不存在时创建）
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'user_realtime_features') THEN
        -- 检查字段是否存在
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_realtime_features' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_user_realtime_features_user_id 
            ON user_realtime_features(user_id);
        END IF;
    END IF;
    
    -- 实时推荐缓存索引（使用 generated_at 而不是 created_at）
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'realtime_recommendation_cache') THEN
        -- 检查字段是否存在
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'realtime_recommendation_cache' AND column_name = 'user_id') THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'realtime_recommendation_cache' AND column_name = 'generated_at') THEN
                CREATE INDEX IF NOT EXISTS idx_realtime_recommendation_cache_user_generated 
                ON realtime_recommendation_cache(user_id, generated_at DESC);
            END IF;
        END IF;
    END IF;
    
    -- 用户行为事件时间索引
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'user_behavior_events') THEN
        -- 检查字段是否存在
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_behavior_events' AND column_name = 'user_id') THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'user_behavior_events' AND column_name = 'created_at') THEN
                CREATE INDEX IF NOT EXISTS idx_user_behavior_events_user_created 
                ON user_behavior_events(user_id, created_at DESC);
            END IF;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_behavior_events' AND column_name = 'event_type') THEN
            CREATE INDEX IF NOT EXISTS idx_user_behavior_events_event_type 
            ON user_behavior_events(event_type);
        END IF;
    END IF;
END $$;

-- ============================================
-- 8. A/B测试相关索引（如果表存在）
-- ============================================

DO $$
BEGIN
    -- 实验用户分配索引
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'ab_user_assignments') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ab_user_assignments' AND column_name = 'user_id') THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'ab_user_assignments' AND column_name = 'experiment_id') THEN
                CREATE INDEX IF NOT EXISTS idx_ab_user_assignments_user_experiment 
                ON ab_user_assignments(user_id, experiment_id);
            END IF;
        END IF;
    END IF;
    
    -- 实验指标数据索引
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'ab_metric_data') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ab_metric_data' AND column_name = 'experiment_id') THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'ab_metric_data' AND column_name = 'variant_id') THEN
                IF EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'ab_metric_data' AND column_name = 'recorded_at') THEN
                    CREATE INDEX IF NOT EXISTS idx_ab_metric_data_experiment_variant 
                    ON ab_metric_data(experiment_id, variant_id, recorded_at DESC);
                END IF;
            END IF;
        END IF;
    END IF;
END $$;

-- ============================================
-- 9. 冷启动相关索引（如果表存在）
-- ============================================

DO $$
BEGIN
    -- 用户人口属性索引
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'user_demographics') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_demographics' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_user_demographics_user_id 
            ON user_demographics(user_id);
        END IF;
    END IF;
    
    -- 内容质量评估索引
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'content_quality_assessments') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'content_quality_assessments' AND column_name = 'content_id') THEN
            CREATE INDEX IF NOT EXISTS idx_content_quality_assessments_content_id 
            ON content_quality_assessments(content_id);
        END IF;
    END IF;
    
    -- 小流量测试索引
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'small_traffic_tests') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'small_traffic_tests' AND column_name = 'content_id') THEN
            CREATE INDEX IF NOT EXISTS idx_small_traffic_tests_content_id 
            ON small_traffic_tests(content_id);
        END IF;
    END IF;
END $$;

-- ============================================
-- 10. 统计和监控索引（如果表存在）
-- ============================================

DO $$
BEGIN
    -- 推荐指标监控索引
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'recommendation_metrics') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'recommendation_metrics' AND column_name = 'user_id') THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'recommendation_metrics' AND column_name = 'algorithm_type') THEN
                IF EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'recommendation_metrics' AND column_name = 'created_at') THEN
                    CREATE INDEX IF NOT EXISTS idx_recommendation_metrics_user_algorithm 
                    ON recommendation_metrics(user_id, algorithm_type, created_at DESC);
                END IF;
            END IF;
        END IF;
    END IF;
END $$;

-- ============================================
-- 11. 添加注释说明
-- ============================================

COMMENT ON INDEX idx_user_behaviors_user_id_created_at IS '支持按用户查询行为历史，按时间倒序';
COMMENT ON INDEX idx_user_behaviors_behavior_type IS '支持按行为类型筛选高价值行为';
COMMENT ON INDEX idx_works_hot_score IS '支持按热度排序获取热门作品';
COMMENT ON INDEX idx_works_creator_id_created_at IS '支持按作者查询其作品';
COMMENT ON INDEX idx_works_category IS '支持按分类筛选作品';
COMMENT ON INDEX idx_user_similarities_user_id IS '支持查找与指定用户相似的用户';
COMMENT ON INDEX idx_recommendation_history_user_id IS '支持查询用户的推荐历史';

-- 输出创建结果
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '推荐系统索引创建完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '核心索引类别：';
    RAISE NOTICE '  - 用户行为表: 4个索引';
    RAISE NOTICE '  - works表: 7个索引（含向量索引）';
    RAISE NOTICE '  - 用户相似度表: 3个索引';
    RAISE NOTICE '  - 推荐历史表: 4个索引';
    RAISE NOTICE '  - 用户画像表: 3个索引（含向量索引）';
    RAISE NOTICE '  - 内容统计表: 2个索引';
    RAISE NOTICE '核心表总计: 23个优化索引';
    RAISE NOTICE '';
    RAISE NOTICE '其他表索引（如果存在）：';
    RAISE NOTICE '  - 实时推荐表: 4个索引';
    RAISE NOTICE '  - A/B测试表: 2个索引';
    RAISE NOTICE '  - 冷启动表: 3个索引';
    RAISE NOTICE '  - 监控指标表: 1个索引';
    RAISE NOTICE '========================================';
END $$;
