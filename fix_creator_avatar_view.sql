-- 修复 submission_with_stats 视图中 creator_avatar 字段
-- 问题：avatar_url 可能存储在 public.users 表中，而不是 auth.users.raw_user_meta_data

-- 先检查 public.users 表是否有 avatar_url 字段
DO $$
BEGIN
    -- 检查 public.users 表结构
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'avatar_url'
    ) THEN
        RAISE NOTICE 'public.users 表有 avatar_url 字段';
    ELSE
        RAISE NOTICE 'public.users 表没有 avatar_url 字段';
    END IF;
END $$;

-- 重新创建视图，优先从 public.users 获取 avatar_url，如果没有则从 auth.users.raw_user_meta_data 获取
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

-- 添加注释
COMMENT ON VIEW public.submission_with_stats IS '作品完整信息视图，包含作者信息（优先从 public.users 获取）';

-- 检查视图是否正确创建
SELECT 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' 
    AND table_name = 'submission_with_stats';
