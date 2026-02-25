-- 临时禁用 direct_messages 表的 RLS 用于测试
-- 生产环境不应该这样做！

-- 禁用 RLS
ALTER TABLE public.direct_messages DISABLE ROW LEVEL SECURITY;

-- 验证 RLS 状态
SELECT 
    relname as table_name,
    relrowsecurity as rls_enabled,
    relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname = 'direct_messages';
