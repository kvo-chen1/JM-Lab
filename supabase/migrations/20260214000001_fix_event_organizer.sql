-- 修复活动组织者权限问题
-- 使用 SECURITY DEFINER 绕过 RLS

-- 创建函数：更新活动组织者（仅管理员使用）
CREATE OR REPLACE FUNCTION public.update_event_organizer(
    p_event_id UUID,
    p_new_organizer_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.events
    SET organizer_id = p_new_organizer_id,
        updated_at = NOW()
    WHERE id = p_event_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加注释
COMMENT ON FUNCTION public.update_event_organizer IS '更新活动组织者，绕过 RLS 限制';

-- 验证函数是否创建成功
SELECT 
    'update_event_organizer' as function_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_event_organizer') 
        THEN '✅ 创建成功' 
        ELSE '❌ 创建失败' 
    END as status;
