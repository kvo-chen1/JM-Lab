-- 创建剩余的 4 个 RPC 函数

-- 1. 获取收入统计
CREATE OR REPLACE FUNCTION get_revenue_stats(p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    date DATE,
    total_revenue DECIMAL,
    order_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        created_at::DATE as date,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COUNT(*) as order_count
    FROM orders
    WHERE created_at > NOW() - INTERVAL '1 day' * p_days
        AND status = 'completed'
    GROUP BY created_at::DATE
    ORDER BY date;
END;
$$ LANGUAGE plpgsql;

-- 2. 获取审核统计
CREATE OR REPLACE FUNCTION get_moderation_stats(p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    date DATE,
    pending BIGINT,
    approved BIGINT,
    rejected BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        created_at::DATE as date,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected
    FROM moderation_logs
    WHERE created_at > NOW() - INTERVAL '1 day' * p_days
    GROUP BY created_at::DATE
    ORDER BY date;
END;
$$ LANGUAGE plpgsql;

-- 3. 获取系统健康状态
CREATE OR REPLACE FUNCTION get_system_health()
RETURNS TABLE (
    metric TEXT,
    value DECIMAL,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'database_connections'::TEXT as metric,
        (SELECT count(*) FROM pg_stat_activity)::DECIMAL as value,
        'healthy'::TEXT as status
    UNION ALL
    SELECT 
        'active_users_today'::TEXT,
        (SELECT COUNT(DISTINCT user_id) FROM page_views WHERE created_at::DATE = CURRENT_DATE)::DECIMAL,
        'healthy'
    UNION ALL
    SELECT 
        'total_users'::TEXT,
        (SELECT COUNT(*) FROM users)::DECIMAL,
        'healthy'
    UNION ALL
    SELECT 
        'total_works'::TEXT,
        (SELECT COUNT(*) FROM works)::DECIMAL,
        'healthy';
END;
$$ LANGUAGE plpgsql;

-- 4. 发布活动排名
CREATE OR REPLACE FUNCTION publish_event_ranking(p_event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- 更新活动状态为已完成
    UPDATE events 
    SET 
        status = 'completed',
        ranking_published_at = NOW(),
        updated_at = NOW()
    WHERE id = p_event_id;
    
    -- 记录排名发布历史
    INSERT INTO final_ranking_publishes (event_id, published_at, created_at)
    VALUES (p_event_id, NOW(), NOW())
    ON CONFLICT (event_id) DO UPDATE 
    SET published_at = NOW(), updated_at = NOW();
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

SELECT '剩余函数创建完成!' as result;
