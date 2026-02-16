-- 修复评分数据更新
-- 1. 查看 submission_scores 表中的评分数据
SELECT 
    ss.id,
    ss.submission_id,
    ss.score,
    ss.judge_id,
    ss.comment,
    ss.created_at
FROM public.submission_scores ss
WHERE ss.submission_id IN (
    SELECT id FROM public.event_submissions
    WHERE event_id IN (
        SELECT id FROM public.events 
        WHERE organizer_id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429'
    )
);

-- 2. 查看所有评分相关的表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%score%' OR table_name LIKE '%rating%');

-- 3. 先检查 event_submissions 表的 avg_rating 字段类型
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_name = 'event_submissions' AND column_name = 'avg_rating';

-- 4. 修改 avg_rating 字段类型以支持更大的值
ALTER TABLE public.event_submissions 
ALTER COLUMN avg_rating TYPE DECIMAL(5,2);

-- 5. 更新 event_submissions 的 avg_rating 字段（从 submission_scores 计算）
UPDATE public.event_submissions es
SET 
    avg_rating = (SELECT AVG(score)::DECIMAL(5,2) FROM public.submission_scores WHERE submission_id = es.id),
    rating_count = (SELECT COUNT(*) FROM public.submission_scores WHERE submission_id = es.id)
WHERE es.id IN (
    SELECT id FROM public.event_submissions
    WHERE event_id IN (
        SELECT id FROM public.events 
        WHERE organizer_id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429'
    )
);

-- 6. 验证更新后的数据
SELECT 
    es.id,
    es.title,
    es.avg_rating,
    es.rating_count
FROM public.event_submissions es
WHERE es.event_id IN (
    SELECT id FROM public.events 
    WHERE organizer_id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429'
);
