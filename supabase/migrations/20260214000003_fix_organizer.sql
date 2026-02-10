-- 修复活动组织者ID
-- 在 Supabase SQL Editor 中执行

-- 查看当前活动的组织者ID
SELECT 
    id,
    title,
    organizer_id,
    status,
    created_at
FROM events
WHERE title = '测试活动11';

-- 更新组织者ID为当前用户ID
-- 注意：请确保这个用户ID是正确的
UPDATE events 
SET organizer_id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429'
WHERE title = '测试活动11';

-- 验证更新结果
SELECT 
    id,
    title,
    organizer_id,
    status,
    created_at
FROM events
WHERE title = '测试活动11';
