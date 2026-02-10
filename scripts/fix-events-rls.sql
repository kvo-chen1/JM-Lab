-- 修复 events 表的 RLS 策略，允许管理员查看所有活动
-- 执行此脚本前请确保已登录到 Supabase

-- 1. 首先检查当前 RLS 策略
SELECT * FROM pg_policies WHERE tablename = 'events';

-- 2. 添加一个允许所有已登录用户查看所有活动的策略（用于管理员）
-- 或者使用更严格的策略：只允许特定角色查看
DO $$
BEGIN
  -- 删除可能存在的旧策略
  DROP POLICY IF EXISTS "Allow admin to view all events" ON public.events;
  DROP POLICY IF EXISTS "Allow authenticated to view all events" ON public.events;
  
  -- 创建新策略：允许所有已登录用户查看所有活动
  -- 注意：在生产环境中，应该使用更严格的策略，只允许管理员查看所有活动
  CREATE POLICY "Allow authenticated to view all events"
    ON public.events
    FOR SELECT
    TO authenticated
    USING (true);
    
  RAISE NOTICE '已创建策略: Allow authenticated to view all events';
END
$$;

-- 3. 验证策略是否创建成功
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'events';

-- 4. 测试查询（可选）
-- SELECT COUNT(*) FROM public.events;
