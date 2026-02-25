-- 修复 notifications 表的 RLS 策略
-- 确保用户能查看自己的所有通知（包括系统通知）

-- 先禁用 RLS 然后重新启用
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 删除所有旧策略
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.notifications;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.notifications;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.notifications;

-- 创建新策略
-- 1. 查看策略 - 用户可以查看自己的所有通知
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.id = notifications.user_id
        )
    );

-- 2. 插入策略 - 系统可以插入通知
CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- 3. 更新策略 - 用户可以更新自己的通知（标记已读）
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.id = notifications.user_id
        )
    );

-- 4. 删除策略 - 用户可以删除自己的通知
CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.id = notifications.user_id
        )
    );

-- 验证策略
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'notifications';
