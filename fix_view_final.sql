-- 修复 submission_with_stats 视图
-- 确保字段名与前端代码期望的字段名匹配

DROP VIEW IF EXISTS public.submission_with_stats;

CREATE OR REPLACE VIEW public.submission_with_stats AS
SELECT 
    es.id,
    es.event_id,
    es.user_id,
    es.participation_id,
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
    COALESCE(es.vote_count, 0) as vote_count,
    COALESCE(es.like_count, 0) as like_count,
    COALESCE(es.avg_rating, 0) as avg_rating,
    COALESCE(es.rating_count, 0) as rating_count,
    COALESCE(es.cover_image, es.work_thumbnail) as cover_image,
    es.work_thumbnail as work_thumbnail,
    COALESCE(es.media_type, 'image') as media_type,
    e.title as event_title,
    e.start_time as event_start_time,
    e.end_time as event_end_time,
    COALESCE(pu.username, u.raw_user_meta_data->>'username') as creator_name,
    COALESCE(pu.avatar_url, u.raw_user_meta_data->>'avatar_url') as creator_avatar,
    u.raw_user_meta_data->>'full_name' as creator_full_name
FROM public.event_submissions es
JOIN public.events e ON es.event_id = e.id
JOIN auth.users u ON es.user_id = u.id
LEFT JOIN public.users pu ON es.user_id = pu.id;

-- 添加注释
COMMENT ON VIEW public.submission_with_stats IS '作品完整信息视图，包含作者信息（优先从 public.users 表获取头像）';

-- 验证视图
SELECT 'submission_with_stats' as view_name, 
       column_name, 
       data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'submission_with_stats' 
ORDER BY column_name;