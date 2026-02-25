-- 修复 notifications 和 direct_messages 表的外键关系
-- 将外键从 auth.users 改为 public.users

-- ============================================
-- 1. 修复 notifications 表外键
-- ============================================

-- 先删除旧的外键约束（如果存在）
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_sender_id_fkey,
DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- 添加新的外键约束指向 public.users
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- ============================================
-- 2. 修复 direct_messages 表外键
-- ============================================

-- 先删除旧的外键约束（如果存在）
ALTER TABLE public.direct_messages 
DROP CONSTRAINT IF EXISTS direct_messages_sender_id_fkey,
DROP CONSTRAINT IF EXISTS direct_messages_receiver_id_fkey;

-- 添加新的外键约束指向 public.users
ALTER TABLE public.direct_messages 
ADD CONSTRAINT direct_messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.direct_messages 
ADD CONSTRAINT direct_messages_receiver_id_fkey 
FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- ============================================
-- 3. 修复 friend_requests 表外键
-- ============================================

-- 先删除旧的外键约束（如果存在）
ALTER TABLE public.friend_requests 
DROP CONSTRAINT IF EXISTS friend_requests_sender_id_fkey,
DROP CONSTRAINT IF EXISTS friend_requests_receiver_id_fkey;

-- 添加新的外键约束指向 public.users
ALTER TABLE public.friend_requests 
ADD CONSTRAINT friend_requests_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.friend_requests 
ADD CONSTRAINT friend_requests_receiver_id_fkey 
FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- ============================================
-- 4. 验证外键关系
-- ============================================

-- 检查外键是否正确创建
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('notifications', 'direct_messages', 'friend_requests');
