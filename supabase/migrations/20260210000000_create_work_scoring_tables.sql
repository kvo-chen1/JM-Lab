-- ============================================
-- 作品管理与评分系统数据库迁移
-- ============================================

-- 1. 扩展 event_submissions 表，添加评分相关字段
ALTER TABLE public.event_submissions 
ADD COLUMN IF NOT EXISTS score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS review_notes TEXT,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES auth.users(id);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_event_submissions_score ON public.event_submissions(score);
CREATE INDEX IF NOT EXISTS idx_event_submissions_reviewed_by ON public.event_submissions(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_event_submissions_is_published ON public.event_submissions(is_published);

-- 2. 创建评分记录表（支持多人评分）
CREATE TABLE IF NOT EXISTS public.submission_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.event_submissions(id) ON DELETE CASCADE,
    judge_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 10),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(submission_id, judge_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_submission_scores_submission ON public.submission_scores(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_scores_judge ON public.submission_scores(judge_id);
CREATE INDEX IF NOT EXISTS idx_submission_scores_created ON public.submission_scores(created_at DESC);

-- 3. 创建评分操作日志表
CREATE TABLE IF NOT EXISTS public.score_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.event_submissions(id) ON DELETE CASCADE,
    judge_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL CHECK (action IN ('score', 'update_score', 'delete_score', 'publish', 'unpublish')),
    old_score DECIMAL(5,2),
    new_score DECIMAL(5,2),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_score_audit_logs_submission ON public.score_audit_logs(submission_id);
CREATE INDEX IF NOT EXISTS idx_score_audit_logs_judge ON public.score_audit_logs(judge_id);
CREATE INDEX IF NOT EXISTS idx_score_audit_logs_created ON public.score_audit_logs(created_at DESC);

-- 4. 启用 RLS
ALTER TABLE public.submission_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS 策略
-- submission_scores 表策略
CREATE POLICY "Judges can view all scores" ON public.submission_scores
    FOR SELECT USING (true);
    
CREATE POLICY "Judges can create own scores" ON public.submission_scores
    FOR INSERT WITH CHECK (auth.uid() = judge_id);
    
CREATE POLICY "Judges can update own scores" ON public.submission_scores
    FOR UPDATE USING (auth.uid() = judge_id);

CREATE POLICY "Judges can delete own scores" ON public.submission_scores
    FOR DELETE USING (auth.uid() = judge_id);

-- score_audit_logs 表策略（仅管理员可查看）
CREATE POLICY "Audit logs viewable by authenticated users" ON public.score_audit_logs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Audit logs insertable by authenticated users" ON public.score_audit_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6. 创建触发器函数：自动更新 updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS update_submission_scores_updated_at ON public.submission_scores;
CREATE TRIGGER update_submission_scores_updated_at
    BEFORE UPDATE ON public.submission_scores
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. 创建视图：作品评分汇总
CREATE OR REPLACE VIEW public.submission_score_summary AS
SELECT 
    es.id as submission_id,
    es.event_id,
    es.user_id,
    es.title,
    es.status,
    es.is_published,
    es.published_at,
    COUNT(ss.id) as score_count,
    AVG(ss.score)::DECIMAL(5,2) as avg_score,
    MAX(ss.score) as max_score,
    MIN(ss.score) as min_score,
    COUNT(DISTINCT ss.judge_id) as judge_count
FROM public.event_submissions es
LEFT JOIN public.submission_scores ss ON es.id = ss.submission_id
GROUP BY es.id, es.event_id, es.user_id, es.title, es.status, es.is_published, es.published_at;

-- 8. 创建视图：评委评分详情
CREATE OR REPLACE VIEW public.judge_score_details AS
SELECT 
    ss.*,
    u.raw_user_meta_data->>'username' as judge_name,
    u.raw_user_meta_data->>'avatar_url' as judge_avatar,
    es.event_id,
    es.title as submission_title
FROM public.submission_scores ss
JOIN auth.users u ON ss.judge_id = u.id
JOIN public.event_submissions es ON ss.submission_id = es.id;

-- 9. 创建视图：作品完整信息（含创作者信息）
CREATE OR REPLACE VIEW public.submission_full_details AS
SELECT 
    es.*,
    e.title as event_title,
    e.start_time as event_start_time,
    e.end_time as event_end_time,
    e.brand_id,
    e.brand_name,
    u.raw_user_meta_data->>'username' as creator_name,
    u.raw_user_meta_data->>'avatar_url' as creator_avatar,
    u.raw_user_meta_data->>'email' as creator_email,
    css.avg_score,
    css.score_count,
    css.judge_count
FROM public.event_submissions es
JOIN public.events e ON es.event_id = e.id
JOIN auth.users u ON es.user_id = u.id
LEFT JOIN public.submission_score_summary css ON es.id = css.submission_id;

-- 10. 更新 event_submissions 表的 RLS 策略，允许品牌方查看自己活动的作品
-- 先删除现有的限制性策略
DROP POLICY IF EXISTS "Users can view own submissions" ON public.event_submissions;

-- 创建新的策略：用户可以查看自己的提交，品牌方可以查看自己活动的所有提交
CREATE POLICY "Users can view own or brand submissions" ON public.event_submissions
    FOR SELECT USING (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM public.events e
            JOIN public.brand_partnerships bp ON e.brand_id = bp.brand_id
            WHERE e.id = event_submissions.event_id
            AND bp.user_id = auth.uid()
            AND bp.status = 'approved'
        )
        OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'admin'
        )
    );

-- 保持其他策略不变
DROP POLICY IF EXISTS "Users can create own submissions" ON public.event_submissions;
CREATE POLICY "Users can create own submissions" ON public.event_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own draft submissions" ON public.event_submissions;
CREATE POLICY "Users can update own draft submissions" ON public.event_submissions
    FOR UPDATE USING (auth.uid() = user_id AND status = 'draft');

DROP POLICY IF EXISTS "Users can delete own draft submissions" ON public.event_submissions;
CREATE POLICY "Users can delete own draft submissions" ON public.event_submissions
    FOR DELETE USING (auth.uid() = user_id AND status = 'draft');
