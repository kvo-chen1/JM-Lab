-- 创建AI生成记录表
-- 用于保存所有AI生成的图片、视频等内容

CREATE TABLE IF NOT EXISTS ai_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('image', 'video', 'text')),
    prompt TEXT NOT NULL,
    result_url TEXT NOT NULL,
    thumbnail_url TEXT,
    metadata JSONB DEFAULT '{}',
    source VARCHAR(50) DEFAULT 'unknown',
    source_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ai_generations_user_id ON ai_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_type ON ai_generations(type);
CREATE INDEX IF NOT EXISTS idx_ai_generations_source ON ai_generations(source);
CREATE INDEX IF NOT EXISTS idx_ai_generations_created_at ON ai_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generations_user_type ON ai_generations(user_id, type);

-- 启用行级安全
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略：用户只能查看自己的生成记录
CREATE POLICY "Users can view own generations"
    ON ai_generations
    FOR SELECT
    USING (auth.uid() = user_id);

-- 创建RLS策略：用户只能插入自己的生成记录
CREATE POLICY "Users can insert own generations"
    ON ai_generations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 创建RLS策略：用户只能更新自己的生成记录
CREATE POLICY "Users can update own generations"
    ON ai_generations
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 创建RLS策略：用户只能删除自己的生成记录
CREATE POLICY "Users can delete own generations"
    ON ai_generations
    FOR DELETE
    USING (auth.uid() = user_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ai_generations_updated_at ON ai_generations;
CREATE TRIGGER update_ai_generations_updated_at
    BEFORE UPDATE ON ai_generations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 添加表注释
COMMENT ON TABLE ai_generations IS 'AI生成内容记录表，保存所有AI生成的图片、视频等内容';
COMMENT ON COLUMN ai_generations.type IS '生成内容类型：image-图片, video-视频, text-文本';
COMMENT ON COLUMN ai_generations.prompt IS '生成使用的提示词';
COMMENT ON COLUMN ai_generations.result_url IS '生成结果的URL';
COMMENT ON COLUMN ai_generations.thumbnail_url IS '缩略图URL（视频类型使用）';
COMMENT ON COLUMN ai_generations.metadata IS '额外元数据，如模型参数、生成配置等';
COMMENT ON COLUMN ai_generations.source IS '生成来源，如 neo, wizard, generation_page 等';
COMMENT ON COLUMN ai_generations.source_id IS '关联的ID，如活动ID等';
