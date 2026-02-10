-- 创建函数：获取用户活动（绕过 RLS）
CREATE OR REPLACE FUNCTION public.get_user_events(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    content TEXT,
    start_date BIGINT,
    end_date BIGINT,
    location TEXT,
    type TEXT,
    tags TEXT[],
    media JSONB,
    is_public BOOLEAN,
    max_participants INTEGER,
    status TEXT,
    organizer_id UUID,
    brand_id UUID,
    brand_name TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.description,
        e.content,
        e.start_date,
        e.end_date,
        e.location,
        e.type,
        e.tags,
        e.media,
        e.is_public,
        e.max_participants,
        e.status,
        e.organizer_id,
        e.brand_id,
        e.brand_name,
        e.created_at,
        e.updated_at
    FROM public.events e
    WHERE e.organizer_id = p_user_id
    ORDER BY e.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加注释
COMMENT ON FUNCTION public.get_user_events IS '获取指定用户的所有活动，绕过 RLS';

-- 验证函数是否创建成功
SELECT 
    'get_user_events' as function_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_events') 
        THEN '✅ 创建成功' 
        ELSE '❌ 创建失败' 
    END as status;

-- 测试函数
SELECT * FROM get_user_events('f3dedf79-5c5e-40fd-9513-d0fb0995d429'::UUID);
