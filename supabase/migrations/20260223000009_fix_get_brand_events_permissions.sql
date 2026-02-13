-- ============================================
-- 修复 get_brand_events 函数权限问题
-- 问题：之前的版本返回所有已发布活动，没有检查用户权限
-- 修复：添加权限检查，只返回用户有权限管理的活动
-- ============================================

-- 删除旧版本的函数
DROP FUNCTION IF EXISTS public.get_brand_events(UUID);

-- 创建修复版本的函数
-- 注意：events 表使用 start_date/end_date (bigint) 字段，不是 start_time/end_time
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
        to_timestamp(e.start_date) as start_time,
        to_timestamp(e.end_date) as end_time,
        e.status,
        COUNT(es.id) as submission_count
    FROM public.events e
    LEFT JOIN public.event_submissions es ON e.id = es.event_id
    WHERE (
        -- 用户是活动的组织者
        e.organizer_id = p_user_id
        OR 
        -- 某些系统可能使用 user_id 而不是 organizer_id
        (e.user_id IS NOT NULL AND e.user_id = p_user_id)
        OR
        -- 用户有品牌合作关系（通过 brand_partnerships 表）
        EXISTS (
            SELECT 1 FROM public.brand_partnerships bp
            WHERE bp.brand_id = e.brand_id
            AND bp.applicant_id = p_user_id
            AND bp.status = 'approved'
        )
        OR
        -- 用户是管理员
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = p_user_id AND ur.role = 'admin'
        )
        OR
        -- 用户是系统管理员（users 表中的 is_admin）
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = p_user_id AND u.is_admin = true
        )
    )
    GROUP BY e.id, e.title, e.start_date, e.end_date, e.status
    ORDER BY e.created_at DESC;
END;
$$;

-- 添加函数注释
COMMENT ON FUNCTION public.get_brand_events(UUID) IS '获取品牌方有权限管理的活动列表，包含权限检查';
