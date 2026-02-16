-- ============================================
-- 创建 submission_full_details 视图（修复版）
-- ============================================

-- 1. 先检查并创建评分汇总表（如果不存在）
CREATE TABLE IF NOT EXISTS public.submission_score_summary (
    submission_id UUID PRIMARY KEY REFERENCES public.event_submissions(id) ON DELETE CASCADE,
    score_count INTEGER DEFAULT 0,
    avg_score DECIMAL(5,2) DEFAULT 0,
    max_score DECIMAL(5,2) DEFAULT 0,
    min_score DECIMAL(5,2) DEFAULT 0,
    judge_count INTEGER DEFAULT 0,
    updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- 2. 删除旧视图（如果存在）
DROP VIEW IF EXISTS public.submission_full_details;

-- 3. 创建视图：作品完整信息（含创作者信息和评分统计）
-- 只包含 event_submissions 表中实际存在的列
CREATE OR REPLACE VIEW public.submission_full_details AS
SELECT 
    es.id,
    es.event_id,
    es.user_id,
    es.participation_id,
    es.title,
    es.description,
    es.files,
    es.status,
    es.metadata,
    es.submitted_at,
    es.created_at,
    es.updated_at,
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
LEFT JOIN public.submission_score_summary ss ON es.id = ss.submission_id;

-- 4. 添加注释
COMMENT ON VIEW public.submission_full_details IS '作品完整信息视图，包含活动信息、创作者信息和评分统计';

-- 5. 授予权限
GRANT SELECT ON public.submission_full_details TO authenticated;
GRANT SELECT ON public.submission_full_details TO anon;

-- 6. 验证
SELECT 'submission_full_details view created' as status;
