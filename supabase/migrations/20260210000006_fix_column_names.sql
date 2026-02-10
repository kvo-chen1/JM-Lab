-- 修复：使用正确的列名 start_date 和 end_date
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
        e.start_date as start_time,
        e.end_date as end_time,
        e.status,
        COUNT(es.id) as submission_count
    FROM public.events e
    LEFT JOIN public.event_submissions es ON e.id = es.event_id
    WHERE (
        -- 用户是活动的组织者
        e.organizer_id = p_user_id
        OR
        -- 用户是管理员
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = p_user_id AND ur.role = 'admin'
        )
    )
    GROUP BY e.id, e.title, e.start_date, e.end_date, e.status
    ORDER BY e.created_at DESC;
END;
$$;
