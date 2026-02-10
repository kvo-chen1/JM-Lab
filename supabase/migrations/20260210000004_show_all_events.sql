-- 临时方案：显示所有已发布的活动（用于测试）
CREATE OR REPLACE FUNCTION public.get_brand_events(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    status TEXT,
    submission_count BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.start_time,
        e.end_time,
        e.status,
        COUNT(es.id) as submission_count
    FROM public.events e
    LEFT JOIN public.event_submissions es ON e.id = es.event_id
    WHERE e.status = 'published'  -- 只显示已发布的活动
    GROUP BY e.id, e.title, e.start_time, e.end_time, e.status
    ORDER BY e.created_at DESC;
END;
$$;
