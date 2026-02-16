-- ============================================
-- 创建 judge_score_details 视图
-- ============================================

-- 1. 删除旧视图（如果存在）
DROP VIEW IF EXISTS public.judge_score_details;

-- 2. 创建视图：评委评分详情
CREATE OR REPLACE VIEW public.judge_score_details AS
SELECT 
    ss.id,
    ss.submission_id,
    ss.judge_id,
    u.raw_user_meta_data->>'username' as judge_name,
    u.raw_user_meta_data->>'avatar_url' as judge_avatar,
    ss.score,
    ss.comment,
    ss.created_at,
    ss.updated_at
FROM public.submission_scores ss
JOIN auth.users u ON ss.judge_id = u.id;

-- 3. 添加注释
COMMENT ON VIEW public.judge_score_details IS '评委评分详情视图';

-- 4. 授予权限
GRANT SELECT ON public.judge_score_details TO authenticated;
GRANT SELECT ON public.judge_score_details TO anon;

-- 5. 验证
SELECT 'judge_score_details view created' as status;
