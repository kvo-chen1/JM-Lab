-- ============================================
-- 简化版 get_brand_events 函数 - 用于调试
-- ============================================

-- 删除旧版本的函数
DROP FUNCTION IF EXISTS public.get_brand_events(UUID);

-- 创建简化版本的函数
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
        0::BIGINT as submission_count
    FROM public.events e
    WHERE e.organizer_id = p_user_id
    ORDER BY e.created_at DESC;
END;
$$;

-- 添加函数注释
COMMENT ON FUNCTION public.get_brand_events(UUID) IS '获取品牌方有权限管理的活动列表（简化版）';
