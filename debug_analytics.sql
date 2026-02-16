-- 诊断主办方中心数据分析问题

-- 1. 查看当前用户（假设用户ID从截图中获取）
-- 请替换为实际的用户ID
-- SET app.current_user_id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429';

-- 2. 查看用户作为组织者的活动
SELECT 
    e.id,
    e.title,
    e.organizer_id,
    e.status,
    e.created_at
FROM public.events e
WHERE e.organizer_id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429';

-- 3. 查看这些活动的作品提交
SELECT 
    es.id,
    es.title,
    es.event_id,
    es.user_id,
    es.status,
    es.vote_count,
    es.like_count,
    es.rating_count,
    es.avg_rating,
    es.created_at
FROM public.event_submissions es
WHERE es.event_id IN (
    SELECT id FROM public.events 
    WHERE organizer_id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429'
);

-- 4. 查看所有活动（用于调试）
SELECT 
    e.id,
    e.title,
    e.organizer_id,
    e.status,
    e.created_at,
    (SELECT COUNT(*) FROM public.event_submissions WHERE event_id = e.id) as submission_count
FROM public.events e
ORDER BY e.created_at DESC
LIMIT 10;

-- 5. 查看所有作品提交（用于调试）
SELECT 
    es.id,
    es.title,
    es.event_id,
    es.user_id,
    es.status,
    es.vote_count,
    es.like_count,
    es.created_at
FROM public.event_submissions es
ORDER BY es.created_at DESC
LIMIT 10;
