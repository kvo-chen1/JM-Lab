-- 检查作品的评分数据
SELECT 
    es.id,
    es.title,
    es.avg_rating,
    es.score,
    es.rating_count
FROM public.event_submissions es
WHERE es.event_id IN (
    SELECT id FROM public.events 
    WHERE organizer_id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429'
);

-- 检查 avg_rating 为 0 或 NULL 的情况
SELECT 
    COUNT(*) as total_submissions,
    COUNT(CASE WHEN avg_rating > 0 THEN 1 END) as has_rating,
    COUNT(CASE WHEN avg_rating = 0 OR avg_rating IS NULL THEN 1 END) as no_rating,
    AVG(CASE WHEN avg_rating > 0 THEN avg_rating END) as avg_of_rated
FROM public.event_submissions
WHERE event_id IN (
    SELECT id FROM public.events 
    WHERE organizer_id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429'
);
