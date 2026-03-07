-- ==========================================================================
-- 创建缺失的数据库表
-- 用于修复 500 错误：relation "xxx" does not exist
-- ==========================================================================

-- 1. 创建 user_stats 表（用户统计表）
CREATE TABLE IF NOT EXISTS user_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    works_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. 创建 user_feedback 表（用户反馈表）
CREATE TABLE IF NOT EXISTS user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    admin_reply TEXT,
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建 user_audit_logs 表（用户审计日志表）
CREATE TABLE IF NOT EXISTS user_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    status VARCHAR(50) DEFAULT 'pending_review',
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建 profiles 表（用户资料表）
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(255),
    bio TEXT,
    avatar_url TEXT,
    verification_status VARCHAR(50) DEFAULT 'unverified',
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 5. 创建 content_moderation 表（内容审核表）
CREATE TABLE IF NOT EXISTS content_moderation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(50) NOT NULL,
    content_id UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    reason TEXT,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 创建 ip_assets 表（IP资产表）
CREATE TABLE IF NOT EXISTS ip_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'character',
    original_work_id UUID REFERENCES works(id) ON DELETE SET NULL,
    commercial_value INTEGER DEFAULT 0,
    thumbnail TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 创建 ip_stages 表（IP阶段表）
CREATE TABLE IF NOT EXISTS ip_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_asset_id UUID NOT NULL REFERENCES ip_assets(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 创建 get_user_ip_assets RPC 函数
CREATE OR REPLACE FUNCTION get_user_ip_assets(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name VARCHAR,
    description TEXT,
    type VARCHAR,
    original_work_id UUID,
    commercial_value INTEGER,
    thumbnail TEXT,
    status VARCHAR,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    stages JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.user_id,
        a.name,
        a.description,
        a.type,
        a.original_work_id,
        a.commercial_value,
        a.thumbnail,
        a.status,
        a.created_at,
        a.updated_at,
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', s.id,
                    'name', s.name,
                    'description', s.description,
                    'order_index', s.order_index,
                    'completed', s.completed,
                    'completed_at', s.completed_at,
                    'created_at', s.created_at,
                    'updated_at', s.updated_at
                ) ORDER BY s.order_index
            )
            FROM ip_stages s
            WHERE s.ip_asset_id = a.id
            ), '[]'::jsonb
        ) as stages
    FROM ip_assets a
    WHERE a.user_id = p_user_id 
      AND a.status = 'active'
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加注释
COMMENT ON FUNCTION get_user_ip_assets(UUID) IS '获取指定用户的所有IP资产列表，包含阶段信息。使用SECURITY DEFINER绕过RLS策略。';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_user_id ON user_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_status ON user_audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_content_moderation_status ON content_moderation(status);
CREATE INDEX IF NOT EXISTS idx_ip_assets_user_id ON ip_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_ip_assets_status ON ip_assets(status);
CREATE INDEX IF NOT EXISTS idx_ip_stages_ip_asset_id ON ip_stages(ip_asset_id);

-- 启用 RLS
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_stages ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Users can view own stats" ON user_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own stats" ON user_stats FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback" ON user_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create feedback" ON user_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own audit logs" ON user_audit_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own content moderation" ON content_moderation FOR SELECT USING (
    EXISTS (SELECT 1 FROM works w WHERE w.id = content_id AND w.creator_id = auth.uid())
);

CREATE POLICY "Users can view own IP assets" ON ip_assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own IP assets" ON ip_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own IP assets" ON ip_assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own IP assets" ON ip_assets FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view IP stages" ON ip_stages FOR SELECT USING (
    EXISTS (SELECT 1 FROM ip_assets a WHERE a.id = ip_asset_id AND a.user_id = auth.uid())
);
CREATE POLICY "Users can manage IP stages" ON ip_stages FOR ALL USING (
    EXISTS (SELECT 1 FROM ip_assets a WHERE a.id = ip_asset_id AND a.user_id = auth.uid())
);

-- 9. 创建 ip_partnerships 表（IP合作表）
CREATE TABLE IF NOT EXISTS ip_partnerships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_asset_id UUID NOT NULL REFERENCES ip_assets(id) ON DELETE CASCADE,
    brand_id UUID,
    brand_name TEXT,
    brand_logo TEXT,
    description TEXT,
    reward TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ip_partnerships_ip_asset_id ON ip_partnerships(ip_asset_id);
CREATE INDEX IF NOT EXISTS idx_ip_partnerships_status ON ip_partnerships(status);
CREATE INDEX IF NOT EXISTS idx_ip_partnerships_brand_id ON ip_partnerships(brand_id);

-- 启用 RLS
ALTER TABLE ip_partnerships ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Users can view own IP partnerships" ON ip_partnerships FOR SELECT USING (
    EXISTS (SELECT 1 FROM ip_assets a WHERE a.id = ip_asset_id AND a.user_id = auth.uid())
);
CREATE POLICY "Users can create own IP partnerships" ON ip_partnerships FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM ip_assets a WHERE a.id = ip_asset_id AND a.user_id = auth.uid())
);
CREATE POLICY "Users can update own IP partnerships" ON ip_partnerships FOR UPDATE USING (
    EXISTS (SELECT 1 FROM ip_assets a WHERE a.id = ip_asset_id AND a.user_id = auth.uid())
);
CREATE POLICY "Users can delete own IP partnerships" ON ip_partnerships FOR DELETE USING (
    EXISTS (SELECT 1 FROM ip_assets a WHERE a.id = ip_asset_id AND a.user_id = auth.uid())
);

-- ==========================================================================
-- 完成
-- ==========================================================================
