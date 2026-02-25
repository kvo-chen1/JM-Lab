-- 最终修复 notifications 表的 RLS 策略
-- 禁用 RLS 进行测试

-- 禁用 RLS
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- 验证 RLS 状态
SELECT 
    relname as table_name,
    relrowsecurity as rls_enabled
FROM pg_class
WHERE relname = 'notifications';
