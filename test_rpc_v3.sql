-- 测试 RPC 函数 v3
-- 使用实际的用户ID测试 get_organizer_dashboard_stats 函数

SELECT * FROM public.get_organizer_dashboard_stats(
    'f3dedf79-5c5e-40fd-9513-d0fb0995d429'::UUID,
    NULL,
    NULL
);

-- 检查用户组织的活动
SELECT 
    e.id,
    e.title,
    e.organizer_id,
    e.status
FROM public.events e
WHERE e.organizer_id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429';

-- 检查这些活动的作品提交
SELECT 
    es.id,
    es.title,
    es.event_id,
    es.status,
    es.vote_count,
    es.like_count
FROM public.event_submissions es
WHERE es.event_id IN (
    SELECT id FROM public.events 
    WHERE organizer_id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429'
);
