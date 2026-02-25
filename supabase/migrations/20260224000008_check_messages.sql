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
