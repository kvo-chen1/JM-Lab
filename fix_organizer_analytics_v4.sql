-- 修复主办方中心数据分析问题 - 版本4
-- 修复 aggregate function calls cannot be nested 错误

-- 删除旧函数
DROP FUNCTION IF EXISTS public.get_organizer_dashboard_stats(UUID, DATE, DATE);

-- 创建新函数
CREATE OR REPLACE FUNCTION public.get_organizer_dashboard_stats(
    p_organizer_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    total_events BIGINT,
    total_submissions BIGINT,
    total_votes BIGINT,
    total_likes BIGINT,
    avg_score DECIMAL(5,2),
    pending_review BIGINT,
    daily_submissions JSONB,
    top_works JSONB
) AS $$
BEGIN
    -- 设置默认日期范围（最近30天）
    IF p_start_date IS NULL THEN
        p_start_date := CURRENT_DATE - INTERVAL '30 days';
    END IF;
    IF p_end_date IS NULL THEN
        p_end_date := CURRENT_DATE;
    END IF;

    RETURN QUERY
    WITH organizer_events AS (
        SELECT e.id as event_id
        FROM public.events e
        WHERE e.organizer_id = p_organizer_id
    ),
    stats AS (
        SELECT 
            COUNT(DISTINCT oe.event_id) as total_events,
            COUNT(DISTINCT es.id) as total_submissions,
            COALESCE(SUM(es.vote_count), 0) as total_votes,
            COALESCE(SUM(es.like_count), 0) as total_likes,
            AVG(es.avg_rating)::DECIMAL(5,2) as avg_score,
            COUNT(DISTINCT CASE WHEN es.status = 'draft' OR es.status = 'under_review' THEN es.id END) as pending_review
        FROM organizer_events oe
        LEFT JOIN public.event_submissions es ON oe.event_id = es.event_id
    ),
    daily_stats_raw AS (
        SELECT 
            to_timestamp(es.created_at / 1000)::DATE as stat_date,
            COUNT(*) as count
        FROM public.event_submissions es
        JOIN organizer_events oe ON es.event_id = oe.event_id
        WHERE to_timestamp(es.created_at / 1000)::DATE BETWEEN p_start_date AND p_end_date
        GROUP BY to_timestamp(es.created_at / 1000)::DATE
    ),
    daily_stats AS (
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'date', stat_date,
                'count', count
            ) ORDER BY stat_date
        ), '[]'::jsonb) as daily_data
        FROM daily_stats_raw
    ),
    top_works_raw AS (
        SELECT 
            es.id,
            es.title,
            es.vote_count,
            es.like_count,
            es.avg_rating
        FROM public.event_submissions es
        JOIN organizer_events oe ON es.event_id = oe.event_id
        ORDER BY es.vote_count DESC
        LIMIT 5
    ),
    top_works AS (
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', id,
                'title', title,
                'views', vote_count,
                'likes', like_count,
                'score', avg_rating
            )
        ), '[]'::jsonb) as works_data
        FROM top_works_raw
    )
    SELECT 
        s.total_events,
        s.total_submissions,
        s.total_votes,
        s.total_likes,
        s.avg_score,
        s.pending_review,
        ds.daily_data as daily_submissions,
        tw.works_data as top_works
    FROM stats s
    CROSS JOIN daily_stats ds
    CROSS JOIN top_works tw;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授予权限
GRANT EXECUTE ON FUNCTION public.get_organizer_dashboard_stats(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organizer_dashboard_stats(UUID, DATE, DATE) TO anon;

-- 验证函数
SELECT 'get_organizer_dashboard_stats function updated (v4)' as status;
