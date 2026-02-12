-- 创建AI点评记录表
CREATE TABLE IF NOT EXISTS ai_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    work_id TEXT NOT NULL, -- 作品ID，可以是临时ID或真实作品ID
    prompt TEXT NOT NULL, -- 用户输入的提示词
    ai_explanation TEXT, -- AI对作品的解释
    
    -- 评分维度
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    cultural_fit_score INTEGER NOT NULL CHECK (cultural_fit_score >= 0 AND cultural_fit_score <= 100),
    creativity_score INTEGER NOT NULL CHECK (creativity_score >= 0 AND creativity_score <= 100),
    aesthetics_score INTEGER NOT NULL CHECK (aesthetics_score >= 0 AND aesthetics_score <= 100),
    commercial_potential_score INTEGER CHECK (commercial_potential_score >= 0 AND commercial_potential_score <= 100),
    
    -- 详细评价内容（JSON格式存储数组）
    cultural_fit_details JSONB DEFAULT '[]'::jsonb,
    creativity_details JSONB DEFAULT '[]'::jsonb,
    aesthetics_details JSONB DEFAULT '[]'::jsonb,
    suggestions JSONB DEFAULT '[]'::jsonb,
    highlights JSONB DEFAULT '[]'::jsonb,
    commercial_analysis JSONB DEFAULT '[]'::jsonb,
    recommended_commercial_paths JSONB DEFAULT '[]'::jsonb,
    related_activities JSONB DEFAULT '[]'::jsonb,
    
    -- 相似作品推荐
    similar_works JSONB DEFAULT '[]'::jsonb,
    
    -- 作品缩略图（用于历史记录展示）
    work_thumbnail TEXT,
    
    -- 元数据
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 唯一约束：同一用户对同一作品的点评只保留一条最新记录
    UNIQUE(user_id, work_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ai_reviews_user_id ON ai_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_reviews_work_id ON ai_reviews(work_id);
CREATE INDEX IF NOT EXISTS idx_ai_reviews_created_at ON ai_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_reviews_overall_score ON ai_reviews(overall_score DESC);

-- 启用RLS
ALTER TABLE ai_reviews ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- 用户只能查看自己的点评记录
CREATE POLICY "Users can view own reviews"
    ON ai_reviews FOR SELECT
    USING (user_id = auth.uid());

-- 用户只能插入自己的点评记录
CREATE POLICY "Users can insert own reviews"
    ON ai_reviews FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- 用户只能更新自己的点评记录
CREATE POLICY "Users can update own reviews"
    ON ai_reviews FOR UPDATE
    USING (user_id = auth.uid());

-- 用户只能删除自己的点评记录
CREATE POLICY "Users can delete own reviews"
    ON ai_reviews FOR DELETE
    USING (user_id = auth.uid());

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_ai_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ai_reviews_updated_at ON ai_reviews;
CREATE TRIGGER trigger_update_ai_reviews_updated_at
    BEFORE UPDATE ON ai_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_reviews_updated_at();

-- 创建获取用户AI点评历史记录的函数
CREATE OR REPLACE FUNCTION get_user_ai_reviews(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    work_id TEXT,
    prompt TEXT,
    overall_score INTEGER,
    cultural_fit_score INTEGER,
    creativity_score INTEGER,
    aesthetics_score INTEGER,
    commercial_potential_score INTEGER,
    highlights JSONB,
    work_thumbnail TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ar.id,
        ar.work_id,
        ar.prompt,
        ar.overall_score,
        ar.cultural_fit_score,
        ar.creativity_score,
        ar.aesthetics_score,
        ar.commercial_potential_score,
        ar.highlights,
        ar.work_thumbnail,
        ar.created_at
    FROM ai_reviews ar
    WHERE ar.user_id = p_user_id
    ORDER BY ar.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建获取单个AI点评详情的函数
CREATE OR REPLACE FUNCTION get_ai_review_detail(
    p_review_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    id UUID,
    work_id TEXT,
    prompt TEXT,
    ai_explanation TEXT,
    overall_score INTEGER,
    cultural_fit_score INTEGER,
    creativity_score INTEGER,
    aesthetics_score INTEGER,
    commercial_potential_score INTEGER,
    cultural_fit_details JSONB,
    creativity_details JSONB,
    aesthetics_details JSONB,
    suggestions JSONB,
    highlights JSONB,
    commercial_analysis JSONB,
    recommended_commercial_paths JSONB,
    related_activities JSONB,
    similar_works JSONB,
    work_thumbnail TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ar.id,
        ar.work_id,
        ar.prompt,
        ar.ai_explanation,
        ar.overall_score,
        ar.cultural_fit_score,
        ar.creativity_score,
        ar.aesthetics_score,
        ar.commercial_potential_score,
        ar.cultural_fit_details,
        ar.creativity_details,
        ar.aesthetics_details,
        ar.suggestions,
        ar.highlights,
        ar.commercial_analysis,
        ar.recommended_commercial_paths,
        ar.related_activities,
        ar.similar_works,
        ar.work_thumbnail,
        ar.created_at
    FROM ai_reviews ar
    WHERE ar.id = p_review_id AND ar.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建保存AI点评记录的函数（支持UPSERT）
CREATE OR REPLACE FUNCTION save_ai_review(
    p_user_id UUID,
    p_work_id TEXT,
    p_prompt TEXT,
    p_ai_explanation TEXT,
    p_overall_score INTEGER,
    p_cultural_fit_score INTEGER,
    p_creativity_score INTEGER,
    p_aesthetics_score INTEGER,
    p_commercial_potential_score INTEGER,
    p_cultural_fit_details JSONB,
    p_creativity_details JSONB,
    p_aesthetics_details JSONB,
    p_suggestions JSONB,
    p_highlights JSONB,
    p_commercial_analysis JSONB,
    p_recommended_commercial_paths JSONB,
    p_related_activities JSONB,
    p_similar_works JSONB,
    p_work_thumbnail TEXT
)
RETURNS UUID AS $$
DECLARE
    v_review_id UUID;
BEGIN
    INSERT INTO ai_reviews (
        user_id,
        work_id,
        prompt,
        ai_explanation,
        overall_score,
        cultural_fit_score,
        creativity_score,
        aesthetics_score,
        commercial_potential_score,
        cultural_fit_details,
        creativity_details,
        aesthetics_details,
        suggestions,
        highlights,
        commercial_analysis,
        recommended_commercial_paths,
        related_activities,
        similar_works,
        work_thumbnail
    ) VALUES (
        p_user_id,
        p_work_id,
        p_prompt,
        p_ai_explanation,
        p_overall_score,
        p_cultural_fit_score,
        p_creativity_score,
        p_aesthetics_score,
        p_commercial_potential_score,
        p_cultural_fit_details,
        p_creativity_details,
        p_aesthetics_details,
        p_suggestions,
        p_highlights,
        p_commercial_analysis,
        p_recommended_commercial_paths,
        p_related_activities,
        p_similar_works,
        p_work_thumbnail
    )
    ON CONFLICT (user_id, work_id)
    DO UPDATE SET
        prompt = EXCLUDED.prompt,
        ai_explanation = EXCLUDED.ai_explanation,
        overall_score = EXCLUDED.overall_score,
        cultural_fit_score = EXCLUDED.cultural_fit_score,
        creativity_score = EXCLUDED.creativity_score,
        aesthetics_score = EXCLUDED.aesthetics_score,
        commercial_potential_score = EXCLUDED.commercial_potential_score,
        cultural_fit_details = EXCLUDED.cultural_fit_details,
        creativity_details = EXCLUDED.creativity_details,
        aesthetics_details = EXCLUDED.aesthetics_details,
        suggestions = EXCLUDED.suggestions,
        highlights = EXCLUDED.highlights,
        commercial_analysis = EXCLUDED.commercial_analysis,
        recommended_commercial_paths = EXCLUDED.recommended_commercial_paths,
        related_activities = EXCLUDED.related_activities,
        similar_works = EXCLUDED.similar_works,
        work_thumbnail = EXCLUDED.work_thumbnail,
        updated_at = NOW()
    RETURNING id INTO v_review_id;
    
    RETURN v_review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加注释
COMMENT ON TABLE ai_reviews IS 'AI点评记录表，存储用户对作品的AI点评结果';
COMMENT ON COLUMN ai_reviews.work_id IS '作品ID，可以是临时生成的ID或已发布作品的ID';
COMMENT ON COLUMN ai_reviews.overall_score IS '总体评分，0-100分';
COMMENT ON COLUMN ai_reviews.cultural_fit_score IS '文化契合度评分，0-100分';
COMMENT ON COLUMN ai_reviews.creativity_score IS '创意性评分，0-100分';
COMMENT ON COLUMN ai_reviews.aesthetics_score IS '美学表现评分，0-100分';
COMMENT ON COLUMN ai_reviews.commercial_potential_score IS '商业潜力评分，0-100分';
