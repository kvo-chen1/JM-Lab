-- 修复 submission_score_summary 视图，使用正确的字段名
-- 删除旧视图（如果存在）
DROP VIEW IF EXISTS public.submission_score_summary;

-- 创建视图：作品评分汇总
-- 使用实际的 event_submissions 表结构字段名
CREATE OR REPLACE VIEW public.submission_score_summary AS
SELECT 
    es.id as submission_id,
    es.event_id,
    es.user_id,
    es.title,
    es.status,
    -- 使用 submitted_at 代替 published_at
    es.submitted_at as published_at,
    -- 使用 status = 'submitted' 代替 is_published
    CASE WHEN es.status = 'submitted' THEN true ELSE false END as is_published,
    COUNT(ss.id) as score_count,
    AVG(ss.score)::DECIMAL(5,2) as avg_score,
    MAX(ss.score) as max_score,
    MIN(ss.score) as min_score,
    COUNT(DISTINCT ss.judge_id) as judge_count
FROM public.event_submissions es
LEFT JOIN public.submission_scores ss ON es.id = ss.submission_id
GROUP BY es.id, es.event_id, es.user_id, es.title, es.status, es.submitted_at;

-- 添加注释
COMMENT ON VIEW public.submission_score_summary IS '作品评分汇总视图，包含评分统计信息';
