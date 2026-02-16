-- 修复 submission_full_details 视图，从 public.users 获取头像
-- 执行时间: 2026-02-16

-- 删除旧视图（如果存在）
DROP VIEW IF EXISTS public.submission_full_details;

-- 创建视图：作品完整信息（含创作者信息和评分统计）
-- 优先从 public.users 获取头像，如果不存在则从 auth.users 获取
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
    COALESCE(pu.username, u.raw_user_meta_data->>'username') as creator_name,
    COALESCE(pu.avatar_url, u.raw_user_meta_data->>'avatar_url') as creator_avatar,
    u.raw_user_meta_data->>'email' as creator_email,
    u.raw_user_meta_data->>'full_name' as creator_full_name,
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

-- 添加注释
COMMENT ON VIEW public.submission_full_details IS '作品完整信息视图，包含活动信息、创作者信息和评分统计。头像优先从 public.users 获取';
