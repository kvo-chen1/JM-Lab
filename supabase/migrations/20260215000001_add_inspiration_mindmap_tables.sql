-- 灵感脉络相关表
-- 创建时间: 2026-02-15

-- 1. 创作脉络表
CREATE TABLE IF NOT EXISTS inspiration_mindmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT '未命名脉络',
    description TEXT,
    layout_type TEXT DEFAULT 'tree',
    settings JSONB DEFAULT '{"layoutType": "tree", "theme": "tianjin", "autoSave": true, "showGrid": true, "snapToGrid": false, "gridSize": 20}'::jsonb,
    stats JSONB DEFAULT '{"totalNodes": 0, "maxDepth": 0, "aiGeneratedNodes": 0, "cultureNodes": 0}'::jsonb,
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 脉络节点表
CREATE TABLE IF NOT EXISTS inspiration_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_id UUID NOT NULL REFERENCES inspiration_mindmaps(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES inspiration_nodes(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT '新节点',
    description TEXT,
    category TEXT DEFAULT 'inspiration',
    content JSONB,
    ai_prompt TEXT,
    ai_generated_content TEXT,
    user_note TEXT,
    tags TEXT[] DEFAULT '{}',
    style JSONB,
    brand_references JSONB,
    cultural_elements JSONB,
    ai_results JSONB,
    position JSONB,
    version INTEGER DEFAULT 1,
    history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. AI建议表
CREATE TABLE IF NOT EXISTS inspiration_ai_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL REFERENCES inspiration_nodes(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    prompt TEXT,
    confidence FLOAT DEFAULT 0.8,
    is_applied BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创作故事表
CREATE TABLE IF NOT EXISTS inspiration_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_id UUID NOT NULL REFERENCES inspiration_mindmaps(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subtitle TEXT,
    full_story TEXT,
    key_turning_points JSONB DEFAULT '[]'::jsonb,
    culture_elements TEXT[] DEFAULT '{}',
    timeline JSONB DEFAULT '[]'::jsonb,
    stats JSONB,
    themes TEXT[] DEFAULT '{}',
    participants UUID[] DEFAULT '{}',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_mindmaps_user_id ON inspiration_mindmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_mindmaps_created_at ON inspiration_mindmaps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nodes_map_id ON inspiration_nodes(map_id);
CREATE INDEX IF NOT EXISTS idx_nodes_parent_id ON inspiration_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_node_id ON inspiration_ai_suggestions(node_id);
CREATE INDEX IF NOT EXISTS idx_stories_map_id ON inspiration_stories(map_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_mindmaps_updated_at ON inspiration_mindmaps;
CREATE TRIGGER update_mindmaps_updated_at
    BEFORE UPDATE ON inspiration_mindmaps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_nodes_updated_at ON inspiration_nodes;
CREATE TRIGGER update_nodes_updated_at
    BEFORE UPDATE ON inspiration_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 创建统计更新触发器
CREATE OR REPLACE FUNCTION update_mindmap_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新脉络统计信息
    UPDATE inspiration_mindmaps
    SET stats = jsonb_build_object(
        'totalNodes', (SELECT COUNT(*) FROM inspiration_nodes WHERE map_id = COALESCE(NEW.map_id, OLD.map_id)),
        'maxDepth', COALESCE((SELECT MAX((position->>'level')::int) FROM inspiration_nodes WHERE map_id = COALESCE(NEW.map_id, OLD.map_id)), 0),
        'aiGeneratedNodes', (SELECT COUNT(*) FROM inspiration_nodes WHERE map_id = COALESCE(NEW.map_id, OLD.map_id) AND category = 'ai_generate'),
        'cultureNodes', (SELECT COUNT(*) FROM inspiration_nodes WHERE map_id = COALESCE(NEW.map_id, OLD.map_id) AND category = 'culture'),
        'lastActivityAt', extract(epoch from NOW()) * 1000
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.map_id, OLD.map_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_stats_on_node_change ON inspiration_nodes;
CREATE TRIGGER update_stats_on_node_change
    AFTER INSERT OR UPDATE OR DELETE ON inspiration_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_mindmap_stats();

-- 启用RLS (行级安全)
ALTER TABLE inspiration_mindmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspiration_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspiration_ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspiration_stories ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略（如果存在）
DROP POLICY IF EXISTS "Users can view own mindmaps" ON inspiration_mindmaps;
DROP POLICY IF EXISTS "Users can insert own mindmaps" ON inspiration_mindmaps;
DROP POLICY IF EXISTS "Users can update own mindmaps" ON inspiration_mindmaps;
DROP POLICY IF EXISTS "Users can delete own mindmaps" ON inspiration_mindmaps;

DROP POLICY IF EXISTS "Users can view own nodes" ON inspiration_nodes;
DROP POLICY IF EXISTS "Users can insert own nodes" ON inspiration_nodes;
DROP POLICY IF EXISTS "Users can update own nodes" ON inspiration_nodes;
DROP POLICY IF EXISTS "Users can delete own nodes" ON inspiration_nodes;

DROP POLICY IF EXISTS "Users can view own suggestions" ON inspiration_ai_suggestions;
DROP POLICY IF EXISTS "Users can insert own suggestions" ON inspiration_ai_suggestions;
DROP POLICY IF EXISTS "Users can update own suggestions" ON inspiration_ai_suggestions;
DROP POLICY IF EXISTS "Users can delete own suggestions" ON inspiration_ai_suggestions;

DROP POLICY IF EXISTS "Users can view own stories" ON inspiration_stories;
DROP POLICY IF EXISTS "Users can insert own stories" ON inspiration_stories;
DROP POLICY IF EXISTS "Users can update own stories" ON inspiration_stories;
DROP POLICY IF EXISTS "Users can delete own stories" ON inspiration_stories;

-- 创建RLS策略
-- mindmaps 策略
CREATE POLICY "Users can view own mindmaps"
    ON inspiration_mindmaps FOR SELECT
    USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "Users can insert own mindmaps"
    ON inspiration_mindmaps FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own mindmaps"
    ON inspiration_mindmaps FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own mindmaps"
    ON inspiration_mindmaps FOR DELETE
    USING (user_id = auth.uid());

-- nodes 策略（通过mindmap的user_id来验证）
CREATE POLICY "Users can view own nodes"
    ON inspiration_nodes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM inspiration_mindmaps 
            WHERE id = inspiration_nodes.map_id 
            AND (user_id = auth.uid() OR is_public = true)
        )
    );

CREATE POLICY "Users can insert own nodes"
    ON inspiration_nodes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM inspiration_mindmaps 
            WHERE id = inspiration_nodes.map_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own nodes"
    ON inspiration_nodes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM inspiration_mindmaps 
            WHERE id = inspiration_nodes.map_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own nodes"
    ON inspiration_nodes FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM inspiration_mindmaps 
            WHERE id = inspiration_nodes.map_id 
            AND user_id = auth.uid()
        )
    );

-- suggestions 策略
CREATE POLICY "Users can view own suggestions"
    ON inspiration_ai_suggestions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM inspiration_nodes n
            JOIN inspiration_mindmaps m ON n.map_id = m.id
            WHERE n.id = inspiration_ai_suggestions.node_id
            AND (m.user_id = auth.uid() OR m.is_public = true)
        )
    );

CREATE POLICY "Users can insert own suggestions"
    ON inspiration_ai_suggestions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM inspiration_nodes n
            JOIN inspiration_mindmaps m ON n.map_id = m.id
            WHERE n.id = inspiration_ai_suggestions.node_id
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own suggestions"
    ON inspiration_ai_suggestions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM inspiration_nodes n
            JOIN inspiration_mindmaps m ON n.map_id = m.id
            WHERE n.id = inspiration_ai_suggestions.node_id
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own suggestions"
    ON inspiration_ai_suggestions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM inspiration_nodes n
            JOIN inspiration_mindmaps m ON n.map_id = m.id
            WHERE n.id = inspiration_ai_suggestions.node_id
            AND m.user_id = auth.uid()
        )
    );

-- stories 策略
CREATE POLICY "Users can view own stories"
    ON inspiration_stories FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM inspiration_mindmaps 
            WHERE id = inspiration_stories.map_id 
            AND (user_id = auth.uid() OR is_public = true)
        )
    );

CREATE POLICY "Users can insert own stories"
    ON inspiration_stories FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM inspiration_mindmaps 
            WHERE id = inspiration_stories.map_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own stories"
    ON inspiration_stories FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM inspiration_mindmaps 
            WHERE id = inspiration_stories.map_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own stories"
    ON inspiration_stories FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM inspiration_mindmaps 
            WHERE id = inspiration_stories.map_id 
            AND user_id = auth.uid()
        )
    );

-- 添加注释
COMMENT ON TABLE inspiration_mindmaps IS '创作灵感脉络表';
COMMENT ON TABLE inspiration_nodes IS '脉络节点表';
COMMENT ON TABLE inspiration_ai_suggestions IS 'AI建议表';
COMMENT ON TABLE inspiration_stories IS '创作故事表';
