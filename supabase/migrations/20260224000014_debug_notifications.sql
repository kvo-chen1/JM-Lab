-- 调试：检查当前用户的系统通知
-- 当前用户ID: f3dedf79-5c5e-40fd-9513-d0fb0995d429

-- 1. 检查该用户的所有通知
SELECT 
    id,
    user_id,
    type,
    title,
    content,
    is_read,
    created_at
FROM public.notifications
WHERE user_id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429'
ORDER BY created_at DESC
LIMIT 20;

-- 2. 检查该用户的系统通知
SELECT 
    id,
    user_id,
    type,
    title,
    content,
    is_read,
    created_at
FROM public.notifications
WHERE user_id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429'
AND type IN ('system', 'announcement', 'ranking_published', 'feedback_resolved', 
             'invitation_received', 'invitation_accepted', 'application_approved', 
             'application_rejected')
ORDER BY created_at DESC
LIMIT 20;

-- 3. 检查该用户的系统通知数量
SELECT COUNT(*) as system_count
FROM public.notifications
WHERE user_id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429'
AND type = 'system';
