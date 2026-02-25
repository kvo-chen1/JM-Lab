-- 测试查询：使用 IN 子句查询 system 类型的通知
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

-- 直接查询 type = 'system'
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
AND type = 'system'
ORDER BY created_at DESC
LIMIT 20;
