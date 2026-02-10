-- 检查 RLS 策略
-- 在 Supabase SQL Editor 中执行

-- 查看 events 表的 RLS 策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'events';

-- 检查 RLS 是否启用
SELECT 
    relname as table_name,
    relrowsecurity as rls_enabled,
    relforcerowsecurity as rls_forced
FROM pg_class 
WHERE relname = 'events';

-- 临时禁用 RLS 查看所有活动（用于调试）
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- 查看所有活动
SELECT 
    id,
    title,
    organizer_id,
    status,
    created_at
FROM events
ORDER BY created_at DESC;

-- 重新启用 RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
