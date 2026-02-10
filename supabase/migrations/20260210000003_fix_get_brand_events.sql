-- 修复：获取品牌方的活动列表（支持 organizer_id 和 created_by）
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
    LEFT JOIN public.brand_partnerships bp ON e.brand_id = bp.brand_id AND bp.user_id = p_user_id AND bp.status = 'approved'
    LEFT JOIN public.event_submissions es ON e.id = es.event_id
    WHERE (
        -- 用户是活动的组织者（支持 organizer_id 和 user_id 字段）
        e.organizer_id = p_user_id
        OR 
        -- 某些系统可能使用 user_id 而不是 organizer_id
        (e.user_id IS NOT NULL AND e.user_id = p_user_id)
        OR
        -- 用户有品牌合作关系
        (bp.user_id = p_user_id AND bp.status = 'approved')
        OR
        -- 用户是管理员
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = p_user_id AND ur.role = 'admin'
        )
    )
    GROUP BY e.id, e.title, e.start_time, e.end_time, e.status
    ORDER BY e.created_at DESC;
END;
$$;
