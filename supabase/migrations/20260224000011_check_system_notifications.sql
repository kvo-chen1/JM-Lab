-- 检查 notifications 表中的系统通知
SELECT 
    n.id,
    n.user_id,
    n.type,
    n.title,
    n.content,
    n.is_read,
    n.created_at,
    u.username as user_username
FROM public.notifications n
LEFT JOIN public.users u ON u.id = n.user_id
WHERE n.type = 'system'
ORDER BY n.created_at DESC
LIMIT 20;

-- 统计各类型通知数量
SELECT 
    type,
    COUNT(*) as count
FROM public.notifications
GROUP BY type
ORDER BY count DESC;
