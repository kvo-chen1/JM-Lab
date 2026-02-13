-- 创建缺失的评分相关表和视图

-- 1. 创建评分记录表（支持多人评分）
CREATE TABLE public.submission_scores (
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
CREATE INDEX idx_submission_scores_submission ON public.submission_scores(submission_id);
CREATE INDEX idx_submission_scores_judge ON public.submission_scores(judge_id);
CREATE INDEX idx_submission_scores_created ON public.submission_scores(created_at DESC);

-- 2. 创建评分操作日志表
CREATE TABLE public.score_audit_logs (
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
CREATE INDEX idx_score_audit_logs_submission ON public.score_audit_logs(submission_id);
CREATE INDEX idx_score_audit_logs_judge ON public.score_audit_logs(judge_id);
CREATE INDEX idx_score_audit_logs_created ON public.score_audit_logs(created_at DESC);

-- 3. 启用 RLS
ALTER TABLE public.submission_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. 创建 RLS 策略
-- 评分记录策略
CREATE POLICY "Submission scores are viewable by everyone" 
    ON public.submission_scores FOR SELECT USING (true);
    
CREATE POLICY "Authenticated users can create scores" 
    ON public.submission_scores FOR INSERT WITH CHECK (auth.uid() = judge_id);
    
CREATE POLICY "Judges can update own scores" 
    ON public.submission_scores FOR UPDATE USING (auth.uid() = judge_id);
    
CREATE POLICY "Judges can delete own scores" 
    ON public.submission_scores FOR DELETE USING (auth.uid() = judge_id);

-- 评分日志策略
CREATE POLICY "Score audit logs are viewable by everyone" 
    ON public.score_audit_logs FOR SELECT USING (true);
    
CREATE POLICY "System can create audit logs" 
    ON public.score_audit_logs FOR INSERT WITH CHECK (true);

-- 5. 创建更新时间戳函数
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 创建触发器
CREATE TRIGGER update_submission_scores_updated_at
    BEFORE UPDATE ON public.submission_scores
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. 重新创建评分汇总视图
-- 使用实际的 event_submissions 表字段名
DROP VIEW IF EXISTS public.submission_score_summary;

CREATE OR REPLACE VIEW public.submission_score_summary AS
SELECT 
    es.id as submission_id,
    es.event_id,
    es.user_id,
    -- 使用 work_title 而不是 title
    es.work_title as title,
    es.status,
    -- 使用 submission_date 而不是 submitted_at
    to_timestamp(es.submission_date / 1000.0) as published_at,
    -- 使用 status 判断是否已发布
    CASE WHEN es.status = 'submitted' THEN true ELSE false END as is_published,
    COUNT(ss.id) as score_count,
    AVG(ss.score)::DECIMAL(5,2) as avg_score,
    MAX(ss.score) as max_score,
    MIN(ss.score) as min_score,
    COUNT(DISTINCT ss.judge_id) as judge_count
FROM public.event_submissions es
LEFT JOIN public.submission_scores ss ON es.id = ss.submission_id
GROUP BY es.id, es.event_id, es.user_id, es.work_title, es.status, es.submission_date;

-- 添加注释
COMMENT ON VIEW public.submission_score_summary IS '作品评分汇总视图，包含评分统计信息';
