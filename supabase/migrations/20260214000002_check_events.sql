-- 检查活动数据
-- 在 Supabase SQL Editor 中执行

-- 查看所有活动
SELECT 
    id,
    title,
    organizer_id,
    status,
    created_at
FROM events
ORDER BY created_at DESC
LIMIT 10;

-- 查看特定ID的活动
SELECT * FROM events 
WHERE id = '9339b572-5c65-453c-9a18-8409cc00148e';

-- 查看组织者ID匹配的活动
SELECT * FROM events 
WHERE organizer_id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429';
