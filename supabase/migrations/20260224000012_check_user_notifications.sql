-- 检查特定用户的系统通知
-- 替换为当前登录用户的 ID
SELECT 
    n.id,
    n.user_id,
    n.type,
    n.title,
    n.content,
    n.is_read,
    n.created_at
FROM public.notifications n
WHERE n.type = 'system'
AND n.user_id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429'  -- 替换为实际的用户ID
ORDER BY n.created_at DESC
LIMIT 20;

-- 查看所有系统通知的用户分布
SELECT 
    user_id,
    COUNT(*) as count
FROM public.notifications
WHERE type = 'system'
GROUP BY user_id
ORDER BY count DESC;
