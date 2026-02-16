-- 检查活动数据
-- 查看活动 "海河'寻味天津·奶香传承'创意作品大赛" 的作品提交

-- 1. 查看活动信息
SELECT 
    e.id,
    e.title,
    e.organizer_id,
    e.status,
    e.created_at
FROM public.events e
WHERE e.title LIKE '%寻味天津%' OR e.id = 'b85f1aab-a2bc-490b-a691-40134fac9861';

-- 2. 查看该活动的作品提交
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
WHERE es.event_id = 'b85f1aab-a2bc-490b-a691-40134fac9861';

-- 3. 查看所有作品提交（用于对比）
SELECT 
    es.id,
    es.title,
    es.event_id,
    es.user_id,
    es.status,
    es.vote_count,
    es.like_count,
    es.created_at,
    (SELECT title FROM public.events WHERE id = es.event_id) as event_title
FROM public.event_submissions es
ORDER BY es.created_at DESC
LIMIT 20;

-- 4. 查看用户 f3dedf79-5c5e-40fd-9513-d0fb0995d429 参与的活动
SELECT 
    ep.event_id,
    ep.user_id,
    ep.status,
    (SELECT title FROM public.events WHERE id = ep.event_id) as event_title
FROM public.event_participants ep
WHERE ep.user_id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429';

-- 5. 查看用户 f3dedf79-5c5e-40fd-9513-d0fb0995d429 的作品提交
SELECT 
    es.id,
    es.title,
    es.event_id,
    es.status,
    es.vote_count,
    es.like_count,
    (SELECT title FROM public.events WHERE id = es.event_id) as event_title,
    (SELECT organizer_id FROM public.events WHERE id = es.event_id) as event_organizer_id
FROM public.event_submissions es
WHERE es.user_id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429';
