-- 检查 Supabase 中的活动数据
-- 1. 检查 events 表中的活动
SELECT 
    e.id,
    e.title,
    e.organizer_id,
    e.status,
    e.created_at
FROM public.events e
WHERE e.organizer_id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429';

-- 2. 检查 event_submissions 表中的作品提交
SELECT 
    es.id,
    es.title,
    es.event_id,
    es.user_id,
    es.status,
    es.vote_count,
    es.like_count,
    es.created_at,
    (SELECT title FROM public.events WHERE id = es.event_id) as event_title,
    (SELECT organizer_id FROM public.events WHERE id = es.event_id) as event_organizer_id
FROM public.event_submissions es
WHERE es.event_id IN (
    SELECT id FROM public.events 
    WHERE organizer_id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429'
);

-- 3. 检查特定活动 b85f1aab-a2bc-490b-a691-40134fac9861 的数据
SELECT 
    e.id,
    e.title,
    e.organizer_id,
    e.status,
    e.created_at
FROM public.events e
WHERE e.id = 'b85f1aab-a2bc-490b-a691-40134fac9861';

-- 4. 检查该活动下的作品提交
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
