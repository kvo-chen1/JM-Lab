-- 合并执行迁移（不包含 storage 策略）
-- 请在 Supabase SQL Editor 中执行此文件

-- ============================================
-- 1. AI 点评表和函数
-- ============================================

-- 创建 ai_reviews 表
CREATE TABLE IF NOT EXISTS public.ai_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    work_id UUID,
    work_type TEXT DEFAULT 'image',
    work_title TEXT,
    work_description TEXT,
    work_thumbnail TEXT,
    prompt TEXT,
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    cultural_fit_score INTEGER CHECK (cultural_fit_score >= 0 AND cultural_fit_score <= 100),
    creativity_score INTEGER CHECK (creativity_score >= 0 AND creativity_score <= 100),
    aesthetics_score INTEGER CHECK (aesthetics_score >= 0 AND aesthetics_score <= 100),
    commercial_potential_score INTEGER CHECK (commercial_potential_score >= 0 AND commercial_potential_score <= 100),
    cultural_fit JSONB DEFAULT '{}'::jsonb,
    creativity JSONB DEFAULT '{}'::jsonb,
    aesthetics JSONB DEFAULT '{}'::jsonb,
    commercial_potential JSONB DEFAULT '{}'::jsonb,
    highlights TEXT[] DEFAULT '{}',
    suggestions TEXT[] DEFAULT '{}',
    market_analysis JSONB DEFAULT '{}'::jsonb,
    improvement_suggestions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ai_reviews_user ON public.ai_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_reviews_work ON public.ai_reviews(work_id);
CREATE INDEX IF NOT EXISTS idx_ai_reviews_created ON public.ai_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_reviews_score ON public.ai_reviews(overall_score DESC);

-- 启用 RLS
ALTER TABLE public.ai_reviews ENABLE ROW LEVEL SECURITY;

-- 创建策略
DROP POLICY IF EXISTS "Users can view own AI reviews" ON public.ai_reviews;
DROP POLICY IF EXISTS "Users can create own AI reviews" ON public.ai_reviews;
DROP POLICY IF EXISTS "Users can delete own AI reviews" ON public.ai_reviews;

CREATE POLICY "Users can view own AI reviews" ON public.ai_reviews
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own AI reviews" ON public.ai_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own AI reviews" ON public.ai_reviews
    FOR DELETE USING (auth.uid() = user_id);

-- 创建获取用户AI点评历史函数
CREATE OR REPLACE FUNCTION public.get_user_ai_reviews(
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    work_id UUID,
    work_type TEXT,
    work_title TEXT,
    work_thumbnail TEXT,
    overall_score INTEGER,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ar.id,
        ar.work_id,
        ar.work_type,
        ar.work_title,
        ar.work_thumbnail,
        ar.overall_score,
        ar.created_at
    FROM public.ai_reviews ar
    WHERE ar.user_id = auth.uid()
    ORDER BY ar.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 创建获取AI点评详情函数
CREATE OR REPLACE FUNCTION public.get_ai_review_detail(p_review_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT to_jsonb(ar.*) INTO v_result
    FROM public.ai_reviews ar
    WHERE ar.id = p_review_id AND ar.user_id = auth.uid();
    
    RETURN v_result;
END;
$$;

-- 创建保存AI点评函数
CREATE OR REPLACE FUNCTION public.save_ai_review(
    p_work_id UUID,
    p_work_type TEXT,
    p_work_title TEXT,
    p_work_description TEXT,
    p_work_thumbnail TEXT,
    p_prompt TEXT,
    p_overall_score INTEGER,
    p_cultural_fit JSONB,
    p_creativity JSONB,
    p_aesthetics JSONB,
    p_commercial_potential JSONB,
    p_highlights TEXT[],
    p_suggestions TEXT[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_review_id UUID;
BEGIN
    INSERT INTO public.ai_reviews (
        user_id, work_id, work_type, work_title, work_description,
        work_thumbnail, prompt, overall_score,
        cultural_fit_score, creativity_score, aesthetics_score, commercial_potential_score,
        cultural_fit, creativity, aesthetics, commercial_potential,
        highlights, suggestions
    ) VALUES (
        auth.uid(), p_work_id, p_work_type, p_work_title, p_work_description,
        p_work_thumbnail, p_prompt, p_overall_score,
        (p_cultural_fit->>'score')::INTEGER,
        (p_creativity->>'score')::INTEGER,
        (p_aesthetics->>'score')::INTEGER,
        (p_commercial_potential->>'score')::INTEGER,
        p_cultural_fit, p_creativity, p_aesthetics, p_commercial_potential,
        p_highlights, p_suggestions
    )
    RETURNING id INTO v_review_id;
    
    RETURN v_review_id;
END;
$$;

-- ============================================
-- 2. 创建 event_submissions 表（如果不存在）
-- ============================================

CREATE TABLE IF NOT EXISTS public.event_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    participation_id UUID REFERENCES public.event_participants(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    files JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'reviewed', 'rejected')),
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    score DECIMAL(5,2),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_event_submissions_event ON public.event_submissions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_submissions_user ON public.event_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_event_submissions_status ON public.event_submissions(status);

-- 启用 RLS
ALTER TABLE public.event_submissions ENABLE ROW LEVEL SECURITY;

-- 创建策略
DROP POLICY IF EXISTS "Users can view own submissions" ON public.event_submissions;
DROP POLICY IF EXISTS "Users can create own submissions" ON public.event_submissions;

CREATE POLICY "Users can view own submissions" ON public.event_submissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own submissions" ON public.event_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. 验证安装
-- ============================================

-- 验证表
SELECT 'ai_reviews table exists' as status 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_reviews');

-- 验证函数
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_user_ai_reviews', 'get_ai_review_detail', 'save_ai_review', 'submit_event_work')
ORDER BY routine_name;
