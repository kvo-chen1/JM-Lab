-- 创建定时任务函数，实现数据归档、缓存清理和物化视图刷新

-- 1. 自动创建未来登录日志分区的函数
CREATE OR REPLACE FUNCTION create_future_login_logs_partitions()
RETURNS VOID AS $$
DECLARE
    start_month TIMESTAMP;
    end_month TIMESTAMP;
    partition_name TEXT;
    i INTEGER;
BEGIN
    -- 从当前月份开始，创建未来12个月的分区
    FOR i IN 0..11 LOOP
        start_month := date_trunc('month', CURRENT_TIMESTAMP) + (i || ' months')::interval;
        end_month := start_month + '1 month'::interval;
        partition_name := 'login_logs_' || to_char(start_month, 'YYYY_MM');
        
        -- 检查分区是否已存在，如果不存在则创建
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_inherits 
            WHERE inhrelid = partition_name::regclass
        ) THEN
            EXECUTE format(
                'CREATE TABLE IF NOT EXISTS %I PARTITION OF login_logs_partitioned FOR VALUES FROM (%L) TO (%L)',
                partition_name, 
                start_month, 
                end_month
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 2. 综合定时任务执行函数
CREATE OR REPLACE FUNCTION execute_scheduled_tasks()
RETURNS VOID AS $$
BEGIN
    -- 执行数据归档
    PERFORM archive_old_data();
    
    -- 清理过期缓存
    PERFORM clean_expired_cache();
    
    -- 刷新物化视图
    PERFORM refresh_materialized_views();
    
    -- 创建未来登录日志分区
    PERFORM create_future_login_logs_partitions();
END;
$$ LANGUAGE plpgsql;

-- 3. 为登录日志表添加触发器，自动迁移数据到分区表
CREATE OR REPLACE FUNCTION trigger_login_logs_partition()
RETURNS TRIGGER AS $$
BEGIN
    -- 插入数据到分区表，PostgreSQL会自动路由到正确的分区
    INSERT INTO login_logs_partitioned VALUES (NEW.*);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 如果原始login_logs表存在，创建触发器将数据自动迁移到分区表
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'login_logs') THEN
        -- 创建触发器，将新数据插入到分区表
        CREATE TRIGGER trigger_login_logs_to_partition
        INSTEAD OF INSERT ON login_logs
        FOR EACH ROW
        EXECUTE FUNCTION trigger_login_logs_partition();
    END IF;
END;
$$;

-- 4. 优化物化视图刷新函数，增加更多视图支持
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS VOID AS $$
BEGIN
    -- 刷新热门作品物化视图
    REFRESH MATERIALIZED VIEW mv_trending_works;
    
    -- 刷新用户公开作品物化视图
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_user_public_works') THEN
        REFRESH MATERIALIZED VIEW mv_user_public_works;
    END IF;
    
    -- 刷新其他可能存在的物化视图
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_latest_works') THEN
        REFRESH MATERIALIZED VIEW mv_latest_works;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_user_activity') THEN
        REFRESH MATERIALIZED VIEW mv_user_activity;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. 增强数据归档函数，支持更多表类型
CREATE OR REPLACE FUNCTION archive_old_data()
RETURNS VOID AS $$
BEGIN
    -- 归档超过1年的作品
    INSERT INTO works_archive
    SELECT * FROM works WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 year' AND deleted_at IS NOT NULL;
    
    DELETE FROM works WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 year' AND deleted_at IS NOT NULL;
    
    -- 归档超过1年的帖子
    INSERT INTO posts_archive
    SELECT * FROM posts WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 year' AND deleted_at IS NOT NULL;
    
    DELETE FROM posts WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 year' AND deleted_at IS NOT NULL;
    
    -- 归档超过1年的评论
    INSERT INTO comments_archive
    SELECT * FROM comments WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 year' AND deleted_at IS NOT NULL;
    
    DELETE FROM comments WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 year' AND deleted_at IS NOT NULL;
    
    -- 归档超过3个月的点赞
    INSERT INTO likes_archive
    SELECT * FROM likes WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '3 months' AND deleted_at IS NOT NULL;
    
    DELETE FROM likes WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '3 months' AND deleted_at IS NOT NULL;
    
    -- 归档超过1年的登录日志（从分区表归档到历史表）
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'login_logs_history') THEN
        INSERT INTO login_logs_history
        SELECT * FROM login_logs_partitioned WHERE login_time < CURRENT_TIMESTAMP - INTERVAL '1 year';
        
        DELETE FROM login_logs_partitioned WHERE login_time < CURRENT_TIMESTAMP - INTERVAL '1 year';
    END IF;
END;
$$ LANGUAGE plpgsql;
