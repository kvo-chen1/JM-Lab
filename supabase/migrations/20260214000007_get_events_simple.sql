-- 创建简化版函数：获取用户活动（绕过 RLS）
-- 只返回基本字段，避免字段不存在的问题

CREATE OR REPLACE FUNCTION public.get_user_events_simple(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    organizer_id UUID,
    status TEXT,
    created_at BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.description,
        e.organizer_id,
        e.status,
        e.created_at
    FROM public.events e
    WHERE e.organizer_id = p_user_id
    ORDER BY e.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加注释
COMMENT ON FUNCTION public.get_user_events_simple IS '获取指定用户的基本活动信息，绕过 RLS';

-- 验证函数是否创建成功
SELECT 
    'get_user_events_simple' as function_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_events_simple') 
        THEN '✅ 创建成功' 
        ELSE '❌ 创建失败' 
    END as status;

-- 测试函数
SELECT * FROM get_user_events_simple('f3dedf79-5c5e-40fd-9513-d0fb0995d429'::UUID);
