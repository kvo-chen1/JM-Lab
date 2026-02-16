-- 检查作品的评分数据
-- 1. 查看 submission_ratings 表中的评分记录
SELECT 
    sr.id,
    sr.submission_id,
    sr.rating,
    sr.user_id,
    sr.created_at
FROM public.submission_ratings sr
WHERE sr.submission_id IN (
    SELECT id FROM public.event_submissions
    WHERE event_id IN (
        SELECT id FROM public.events 
        WHERE organizer_id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429'
    )
);

-- 2. 查看 event_submissions 表的评分字段
SELECT 
    es.id,
    es.title,
    es.avg_rating,
    es.rating_count,
    (SELECT AVG(rating) FROM public.submission_ratings WHERE submission_id = es.id) as actual_avg_rating,
    (SELECT COUNT(*) FROM public.submission_ratings WHERE submission_id = es.id) as actual_rating_count
FROM public.event_submissions es
WHERE es.event_id IN (
    SELECT id FROM public.events 
    WHERE organizer_id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429'
);
