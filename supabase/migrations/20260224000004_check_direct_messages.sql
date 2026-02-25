-- 检查 direct_messages 表中的数据
SELECT 
    dm.id,
    dm.sender_id,
    dm.receiver_id,
    dm.content,
    dm.is_read,
    dm.created_at,
    s.username as sender_username,
    r.username as receiver_username
FROM public.direct_messages dm
LEFT JOIN public.users s ON s.id = dm.sender_id
LEFT JOIN public.users r ON r.id = dm.receiver_id
ORDER BY dm.created_at DESC
LIMIT 20;

-- 统计每个用户的会话数量
SELECT 
    CASE 
        WHEN sender_id = 'YOUR_USER_ID' THEN receiver_id
        ELSE sender_id
    END as other_user_id,
    COUNT(*) as message_count,
    MAX(created_at) as last_message_time
FROM public.direct_messages
WHERE sender_id = 'YOUR_USER_ID' OR receiver_id = 'YOUR_USER_ID'
GROUP BY other_user_id
ORDER BY last_message_time DESC;
