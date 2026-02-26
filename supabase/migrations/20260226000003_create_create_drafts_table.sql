-- 创建创作中心草稿箱表
CREATE TABLE IF NOT EXISTS create_drafts (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    prompt TEXT,
    selected_result INTEGER,
    generated_results JSONB DEFAULT '[]',
    active_tool TEXT NOT NULL DEFAULT 'sketch',
    style_preset TEXT,
    current_step INTEGER DEFAULT 1,
    ai_explanation TEXT,
    selected_pattern_id TEXT,
    pattern_opacity INTEGER,
    pattern_scale INTEGER,
    pattern_rotation INTEGER,
    pattern_blend_mode TEXT,
    pattern_tile_mode TEXT,
    pattern_position_x INTEGER,
    pattern_position_y INTEGER,
    tile_pattern_id TEXT,
    tile_mode TEXT,
    tile_size INTEGER,
    tile_spacing INTEGER,
    tile_rotation INTEGER,
    tile_opacity INTEGER,
    mockup_selected_template_id TEXT,
    mockup_show_wireframe BOOLEAN,
    trace_selected_knowledge_id TEXT,
    cultural_info_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_create_drafts_user_id ON create_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_create_drafts_updated_at ON create_drafts(updated_at DESC);

-- 启用RLS
ALTER TABLE create_drafts ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
DROP POLICY IF EXISTS "Users can only access their own drafts" ON create_drafts;
CREATE POLICY "Users can only access their own drafts"
    ON create_drafts FOR ALL
    USING (user_id = auth.uid());

-- 创建触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_create_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_create_drafts_updated_at ON create_drafts;
CREATE TRIGGER update_create_drafts_updated_at
    BEFORE UPDATE ON create_drafts
    FOR EACH ROW EXECUTE FUNCTION update_create_drafts_updated_at();

COMMENT ON TABLE create_drafts IS '创作中心草稿箱表，存储用户的创作草稿';
