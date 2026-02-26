-- 创建用户状态相关表

-- 1. Neo 页面创作状态表
CREATE TABLE IF NOT EXISTS user_neo_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt TEXT DEFAULT '',
    brand TEXT DEFAULT 'mahua',
    tags TEXT[] DEFAULT '{}',
    custom_brand TEXT DEFAULT '',
    use_custom_brand BOOLEAN DEFAULT false,
    text_style TEXT DEFAULT 'creative',
    video_params JSONB DEFAULT '{"duration": 5, "resolution": "720p", "cameraFixed": false}',
    engine TEXT DEFAULT 'sdxl',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. 用户历史记录表
CREATE TABLE IF NOT EXISTS user_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('video', 'image', 'text', 'audio')),
    url TEXT NOT NULL,
    thumbnail TEXT,
    title TEXT,
    prompt TEXT,
    metadata JSONB DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 用户工作流进度表
CREATE TABLE IF NOT EXISTS user_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workflow_type TEXT NOT NULL,
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER DEFAULT 1,
    data JSONB DEFAULT '{}',
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, workflow_type)
);

-- 4. 用户偏好设置表
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT,
    language TEXT,
    font_size INTEGER,
    layout_compactness TEXT,
    notifications_enabled BOOLEAN,
    notification_sound BOOLEAN,
    notification_frequency TEXT,
    data_collection_enabled BOOLEAN,
    custom_settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_neo_state_user_id ON user_neo_state(user_id);
CREATE INDEX IF NOT EXISTS idx_user_history_user_id ON user_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_history_type ON user_history(type);
CREATE INDEX IF NOT EXISTS idx_user_history_created_at ON user_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_workflows_user_id ON user_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_user_workflows_type ON user_workflows(workflow_type);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- 启用RLS
ALTER TABLE user_neo_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
DROP POLICY IF EXISTS "Users can only access their own neo state" ON user_neo_state;
CREATE POLICY "Users can only access their own neo state"
    ON user_neo_state FOR ALL
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can only access their own history" ON user_history;
CREATE POLICY "Users can only access their own history"
    ON user_history FOR ALL
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can only access their own workflows" ON user_workflows;
CREATE POLICY "Users can only access their own workflows"
    ON user_workflows FOR ALL
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can only access their own preferences" ON user_preferences;
CREATE POLICY "Users can only access their own preferences"
    ON user_preferences FOR ALL
    USING (user_id = auth.uid());

-- 创建触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_user_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_neo_state_updated_at ON user_neo_state;
CREATE TRIGGER update_user_neo_state_updated_at
    BEFORE UPDATE ON user_neo_state
    FOR EACH ROW EXECUTE FUNCTION update_user_state_updated_at();

DROP TRIGGER IF EXISTS update_user_workflows_updated_at ON user_workflows;
CREATE TRIGGER update_user_workflows_updated_at
    BEFORE UPDATE ON user_workflows
    FOR EACH ROW EXECUTE FUNCTION update_user_state_updated_at();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_user_state_updated_at();

COMMENT ON TABLE user_neo_state IS 'Neo页面创作状态表';
COMMENT ON TABLE user_history IS '用户历史记录表';
COMMENT ON TABLE user_workflows IS '用户工作流进度表';
COMMENT ON TABLE user_preferences IS '用户偏好设置表';
