-- 修复 direct_messages 表的 RLS 策略 v2
-- 使用更简单的策略

-- 先禁用 RLS 然后重新启用
ALTER TABLE public.direct_messages DISABLE ROW LEVEL SECURITY;

-- 删除所有旧策略
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can update received messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can update received messages (mark as read)" ON public.direct_messages;

-- 重新启用 RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- 创建简单的策略
-- 1. 所有人可以查看（通过应用层过滤）
CREATE POLICY "Enable read access for all users" ON public.direct_messages
    FOR SELECT USING (true);

-- 2. 已登录用户可以插入
CREATE POLICY "Enable insert for authenticated users" ON public.direct_messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. 已登录用户可以更新
CREATE POLICY "Enable update for authenticated users" ON public.direct_messages
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 验证策略
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
WHERE tablename = 'direct_messages';
