-- 修复 submission_full_details 视图，使用正确的字段名
-- 删除旧视图（如果存在）
DROP VIEW IF EXISTS public.submission_full_details;

-- 创建视图：作品完整信息（含创作者信息）
-- 使用实际的 Supabase 表结构字段名
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
    u.raw_user_meta_data->>'username' as creator_name,
    u.raw_user_meta_data->>'avatar_url' as creator_avatar,
    u.raw_user_meta_data->>'email' as creator_email,
    u.raw_user_meta_data->>'full_name' as creator_full_name
FROM public.event_submissions es
JOIN public.events e ON es.event_id = e.id
JOIN auth.users u ON es.user_id = u.id;

-- 添加注释
COMMENT ON VIEW public.submission_full_details IS '作品完整信息视图，包含活动信息和创作者信息';
