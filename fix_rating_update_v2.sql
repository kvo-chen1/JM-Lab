-- 修复评分数据更新 - 版本2
-- 先删除依赖的视图，修改字段类型，然后重新创建视图

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

-- 2. 删除依赖的视图
DROP VIEW IF EXISTS public.submission_full_details;
DROP VIEW IF EXISTS public.submission_with_stats;

-- 3. 修改 avg_rating 字段类型以支持更大的值
ALTER TABLE public.event_submissions 
ALTER COLUMN avg_rating TYPE DECIMAL(5,2);

-- 4. 更新 event_submissions 的 avg_rating 字段（从 submission_scores 计算）
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

-- 5. 重新创建视图
CREATE OR REPLACE VIEW public.submission_with_stats AS
SELECT 
    es.id,
    es.event_id,
    es.user_id,
    es.title,
    es.description,
    es.files,
    es.status,
    es.submitted_at,
    es.reviewed_at,
    es.review_notes,
    es.score,
    es.metadata,
    es.created_at,
    es.updated_at,
    es.vote_count,
    es.like_count,
    es.avg_rating,
    es.rating_count,
    es.cover_image,
    es.media_type,
    e.title as event_title,
    e.start_time as event_start_time,
    e.end_time as event_end_time,
    u.raw_user_meta_data->>'username' as creator_name,
    u.raw_user_meta_data->>'avatar_url' as creator_avatar,
    u.raw_user_meta_data->>'full_name' as creator_full_name
FROM public.event_submissions es
JOIN public.events e ON es.event_id = e.id
JOIN auth.users u ON es.user_id = u.id;

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
