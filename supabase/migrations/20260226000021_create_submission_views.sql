-- 创建作品提交相关视图
-- 包含创作者信息，避免前端直接访问 auth.users

-- 删除旧视图（如果存在）
DROP VIEW IF EXISTS public.submission_full_details;
DROP VIEW IF EXISTS public.submission_with_stats;

-- 创建视图：作品完整信息（含创作者信息）
-- 使用 public.users 表获取用户信息（包含 avatar_url）
CREATE OR REPLACE VIEW public.submission_full_details AS
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
    e.location as event_location,
    e.organizer_id as event_organizer_id,
    e.max_participants as event_max_participants,
    e.current_participants as event_current_participants,
    e.status as event_status,
    e.image_url as event_image_url,
    u.username as creator_name,
    u.avatar_url as creator_avatar,
    u.email as creator_email
FROM public.event_submissions es
JOIN public.events e ON es.event_id = e.id
LEFT JOIN public.users u ON es.user_id = u.id;

-- 为视图添加注释
COMMENT ON VIEW public.submission_full_details IS '作品完整信息视图，包含活动信息、创作者信息。用于作品审核列表。';

-- 创建视图：作品统计信息
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
    u.username as creator_name,
    u.avatar_url as creator_avatar
FROM public.event_submissions es
JOIN public.events e ON es.event_id = e.id
LEFT JOIN public.users u ON es.user_id = u.id;

-- 为视图添加注释
COMMENT ON VIEW public.submission_with_stats IS '作品统计视图，包含基本统计信息。';

-- 确保 event_submissions 表的 RLS 已启用
ALTER TABLE public.event_submissions ENABLE ROW LEVEL SECURITY;
