-- 修复所有 submission 视图中的 creator_avatar 字段
-- 问题：avatar_url 存储在 public.users 表中，而不是 auth.users.raw_user_meta_data

-- 1. 修复 submission_with_stats 视图
DROP VIEW IF EXISTS public.submission_with_stats;

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
    -- 优先从 public.users 获取用户信息
    COALESCE(pu.username, u.raw_user_meta_data->>'username') as creator_name,
    COALESCE(pu.avatar_url, u.raw_user_meta_data->>'avatar_url') as creator_avatar,
    COALESCE(pu.full_name, u.raw_user_meta_data->>'full_name') as creator_full_name
FROM public.event_submissions es
JOIN public.events e ON es.event_id = e.id
JOIN auth.users u ON es.user_id = u.id
LEFT JOIN public.users pu ON es.user_id = pu.id;

COMMENT ON VIEW public.submission_with_stats IS '作品完整信息视图，包含作者信息（优先从 public.users 获取）';

-- 2. 修复 submission_full_details 视图
DROP VIEW IF EXISTS public.submission_full_details;

CREATE OR REPLACE VIEW public.submission_full_details AS
SELECT 
    es.*,
    e.title as event_title,
    e.start_time as event_start_time,
    e.end_time as event_end_time,
    e.location as event_location,
    e.organizer_id as event_organizer_id,
    e.max_participants as event_max_participants,
    e.current_participants as event_current_participants,
    e.status as event_status,
    e.image_url as event_image_url,
    -- 优先从 public.users 获取用户信息
    COALESCE(pu.username, u.raw_user_meta_data->>'username') as creator_name,
    COALESCE(pu.avatar_url, u.raw_user_meta_data->>'avatar_url') as creator_avatar,
    COALESCE(pu.email, u.raw_user_meta_data->>'email') as creator_email,
    COALESCE(pu.full_name, u.raw_user_meta_data->>'full_name') as creator_full_name,
    -- 添加评分统计字段
    COALESCE(ss.score_count, 0) as score_count,
    COALESCE(ss.avg_score, 0) as avg_score,
    COALESCE(ss.max_score, 0) as max_score,
    COALESCE(ss.min_score, 0) as min_score,
    COALESCE(ss.judge_count, 0) as judge_count
FROM public.event_submissions es
JOIN public.events e ON es.event_id = e.id
JOIN auth.users u ON es.user_id = u.id
LEFT JOIN public.users pu ON es.user_id = pu.id
LEFT JOIN public.submission_score_summary ss ON es.id = ss.submission_id;

COMMENT ON VIEW public.submission_full_details IS '作品完整信息视图，包含活动信息、创作者信息（优先从 public.users 获取）和评分统计';

-- 验证视图
SELECT 'submission_with_stats' as view_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'submission_with_stats' AND column_name IN ('creator_name', 'creator_avatar', 'creator_full_name')
UNION ALL
SELECT 'submission_full_details' as view_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'submission_full_details' AND column_name IN ('creator_name', 'creator_avatar', 'creator_full_name')
ORDER BY view_name, column_name;
