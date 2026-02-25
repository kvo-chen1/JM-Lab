-- 修复 direct_messages 表的 RLS 策略
-- 使用更宽松的策略允许用户发送消息

-- 先删除旧策略
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can update received messages (mark as read)" ON public.direct_messages;

-- 创建新策略
-- 1. 查看策略 - 用户可以查看自己发送或接收的消息
CREATE POLICY "Users can view messages they sent or received" ON public.direct_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND (u.id = direct_messages.sender_id OR u.id = direct_messages.receiver_id)
        )
    );

-- 2. 插入策略 - 用户可以发送消息（sender_id 必须匹配当前用户）
CREATE POLICY "Users can send messages" ON public.direct_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.id = direct_messages.sender_id
        )
    );

-- 3. 更新策略 - 接收者可以标记消息为已读
CREATE POLICY "Users can update received messages" ON public.direct_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.id = direct_messages.receiver_id
        )
    );

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
