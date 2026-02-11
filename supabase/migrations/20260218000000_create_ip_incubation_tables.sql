-- IP孵化中心数据库表结构
-- 创建时间: 2026-02-18
-- 功能: 支持IP孵化全流程管理

-- ============================================
-- 1. IP资产表
-- ============================================
CREATE TABLE IF NOT EXISTS ip_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('illustration', 'pattern', 'design', '3d_model', 'digital_collectible')),
    original_work_id UUID REFERENCES works(id) ON DELETE SET NULL,
    commercial_value INTEGER DEFAULT 0,
    thumbnail TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ip_assets_user_id ON ip_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_ip_assets_type ON ip_assets(type);
CREATE INDEX IF NOT EXISTS idx_ip_assets_status ON ip_assets(status);
CREATE INDEX IF NOT EXISTS idx_ip_assets_created_at ON ip_assets(created_at DESC);

-- 启用RLS
ALTER TABLE ip_assets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. IP孵化阶段表
-- ============================================
CREATE TABLE IF NOT EXISTS ip_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_asset_id UUID NOT NULL REFERENCES ip_assets(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ip_stages_ip_asset_id ON ip_stages(ip_asset_id);
CREATE INDEX IF NOT EXISTS idx_ip_stages_completed ON ip_stages(completed);

-- 启用RLS
ALTER TABLE ip_stages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. 商业机会表
-- ============================================
CREATE TABLE IF NOT EXISTS commercial_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_name VARCHAR(255) NOT NULL,
    brand_logo TEXT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    reward VARCHAR(255),
    requirements TEXT,
    deadline TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'matched', 'closed')),
    match_criteria JSONB,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_commercial_opportunities_status ON commercial_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_commercial_opportunities_deadline ON commercial_opportunities(deadline);

-- 启用RLS
ALTER TABLE commercial_opportunities ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. IP商业合作表
-- ============================================
CREATE TABLE IF NOT EXISTS ip_partnerships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_asset_id UUID NOT NULL REFERENCES ip_assets(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES commercial_opportunities(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    brand_name VARCHAR(255),
    description TEXT,
    reward VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'negotiating', 'approved', 'rejected', 'completed')),
    notes TEXT,
    contract_url TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ip_partnerships_user_id ON ip_partnerships(user_id);
CREATE INDEX IF NOT EXISTS idx_ip_partnerships_ip_asset_id ON ip_partnerships(ip_asset_id);
CREATE INDEX IF NOT EXISTS idx_ip_partnerships_status ON ip_partnerships(status);

-- 启用RLS
ALTER TABLE ip_partnerships ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. 版权资产表
-- ============================================
CREATE TABLE IF NOT EXISTS copyright_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    thumbnail TEXT,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'registered' CHECK (status IN ('registered', 'licensed', 'expired')),
    can_license BOOLEAN DEFAULT TRUE,
    license_price INTEGER,
    certificate_url TEXT,
    registered_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_copyright_assets_user_id ON copyright_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_copyright_assets_status ON copyright_assets(status);

-- 启用RLS
ALTER TABLE copyright_assets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. IP活动/动态表
-- ============================================
CREATE TABLE IF NOT EXISTS ip_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('progress', 'opportunity', 'milestone', 'alert')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    ip_asset_id UUID REFERENCES ip_assets(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ip_activities_user_id ON ip_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_ip_activities_type ON ip_activities(type);
CREATE INDEX IF NOT EXISTS idx_ip_activities_is_read ON ip_activities(is_read);
CREATE INDEX IF NOT EXISTS idx_ip_activities_created_at ON ip_activities(created_at DESC);

-- 启用RLS
ALTER TABLE ip_activities ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS 安全策略
-- ============================================

-- ip_assets 策略
CREATE POLICY "Users can view their own IP assets" ON ip_assets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own IP assets" ON ip_assets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own IP assets" ON ip_assets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own IP assets" ON ip_assets
    FOR DELETE USING (auth.uid() = user_id);

-- ip_stages 策略（通过ip_assets关联）
CREATE POLICY "Users can view stages of their IP assets" ON ip_stages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ip_assets WHERE ip_assets.id = ip_stages.ip_asset_id AND ip_assets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage stages of their IP assets" ON ip_stages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ip_assets WHERE ip_assets.id = ip_stages.ip_asset_id AND ip_assets.user_id = auth.uid()
        )
    );

-- commercial_opportunities 策略（所有认证用户可查看开放的商业机会）
CREATE POLICY "Authenticated users can view open opportunities" ON commercial_opportunities
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can create opportunities" ON commercial_opportunities
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
        )
    );

-- ip_partnerships 策略
CREATE POLICY "Users can view their own partnerships" ON ip_partnerships
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own partnerships" ON ip_partnerships
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own partnerships" ON ip_partnerships
    FOR UPDATE USING (auth.uid() = user_id);

-- copyright_assets 策略
CREATE POLICY "Users can view their own copyright assets" ON copyright_assets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own copyright assets" ON copyright_assets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own copyright assets" ON copyright_assets
    FOR UPDATE USING (auth.uid() = user_id);

-- ip_activities 策略
CREATE POLICY "Users can view their own activities" ON ip_activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own activities" ON ip_activities
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 触发器：自动更新 updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有表创建触发器
CREATE TRIGGER update_ip_assets_updated_at
    BEFORE UPDATE ON ip_assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ip_stages_updated_at
    BEFORE UPDATE ON ip_stages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commercial_opportunities_updated_at
    BEFORE UPDATE ON commercial_opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ip_partnerships_updated_at
    BEFORE UPDATE ON ip_partnerships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_copyright_assets_updated_at
    BEFORE UPDATE ON copyright_assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 插入默认孵化阶段模板数据
-- ============================================
-- 注意：这些阶段会在创建IP资产时自动复制

-- ============================================
-- 插入示例商业机会数据
-- ============================================
INSERT INTO commercial_opportunities (brand_name, brand_logo, name, description, reward, requirements, status, match_criteria)
VALUES 
    ('桂发祥', NULL, '国潮包装设计', '为老字号食品品牌设计国潮风格包装，要求融合传统元素与现代审美', '¥15,000', '需要插画设计经验，了解国潮风格', 'open', '{"type": "illustration", "min_value": 3000}'),
    ('杨柳青画社', NULL, '文创产品开发', '设计传统文化元素文创产品系列，包括文具、家居用品等多个品类', '¥20,000', '需要纹样设计经验', 'open', '{"type": "pattern", "min_value": 5000}'),
    ('数字艺术馆', NULL, '数字藏品创作', '创作基于传统纹样的数字藏品系列，要求具有独特的艺术价值和收藏价值', '分成模式', '需要数字艺术创作经验', 'open', '{"type": "digital_collectible", "min_value": 2000}'),
    ('天津老字号协会', NULL, '品牌视觉升级', '为传统品牌进行现代化视觉升级，保留品牌基因的同时注入新活力', '¥25,000', '需要品牌设计经验', 'open', '{"type": "design", "min_value": 8000}'),
    ('天津市文化和旅游局', NULL, '文化主题插画', '创作以天津传统文化为主题的插画系列，用于城市宣传和文化推广', '¥18,000', '需要插画设计经验，了解天津文化', 'open', '{"type": "illustration", "min_value": 4000}')
ON CONFLICT DO NOTHING;

-- ============================================
-- 创建统计视图
-- ============================================
CREATE OR REPLACE VIEW ip_stats AS
SELECT 
    user_id,
    COUNT(*) as total_assets,
    COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM ip_stages 
        WHERE ip_stages.ip_asset_id = ip_assets.id 
        AND ip_stages.completed = FALSE
    )) as in_progress_assets,
    COUNT(*) FILTER (WHERE NOT EXISTS (
        SELECT 1 FROM ip_stages 
        WHERE ip_stages.ip_asset_id = ip_assets.id 
        AND ip_stages.completed = FALSE
    )) as completed_assets,
    SUM(commercial_value) as total_estimated_value
FROM ip_assets
WHERE status = 'active'
GROUP BY user_id;

-- ============================================
-- 创建RPC函数
-- ============================================

-- 获取用户的IP统计
CREATE OR REPLACE FUNCTION get_user_ip_stats(p_user_id UUID)
RETURNS TABLE (
    total_assets BIGINT,
    completed_assets BIGINT,
    in_progress_assets BIGINT,
    total_partnerships BIGINT,
    active_partnerships BIGINT,
    total_estimated_value BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(s.total_assets, 0)::BIGINT,
        COALESCE(s.completed_assets, 0)::BIGINT,
        COALESCE(s.in_progress_assets, 0)::BIGINT,
        COALESCE(p.total_partnerships, 0)::BIGINT,
        COALESCE(p.active_partnerships, 0)::BIGINT,
        COALESCE(s.total_estimated_value, 0)::BIGINT
    FROM 
        (SELECT 
            COUNT(*) as total_assets,
            COUNT(*) FILTER (WHERE NOT EXISTS (
                SELECT 1 FROM ip_stages 
                WHERE ip_stages.ip_asset_id = ip_assets.id 
                AND ip_stages.completed = FALSE
            )) as completed_assets,
            COUNT(*) FILTER (WHERE EXISTS (
                SELECT 1 FROM ip_stages 
                WHERE ip_stages.ip_asset_id = ip_assets.id 
                AND ip_stages.completed = FALSE
            )) as in_progress_assets,
            SUM(commercial_value) as total_estimated_value
        FROM ip_assets 
        WHERE user_id = p_user_id AND status = 'active') s
    CROSS JOIN
        (SELECT 
            COUNT(*) as total_partnerships,
            COUNT(*) FILTER (WHERE status IN ('pending', 'negotiating')) as active_partnerships
        FROM ip_partnerships 
        WHERE user_id = p_user_id) p;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建IP资产并初始化阶段
CREATE OR REPLACE FUNCTION create_ip_asset_with_stages(
    p_user_id UUID,
    p_name VARCHAR,
    p_description TEXT,
    p_type VARCHAR,
    p_original_work_id UUID,
    p_commercial_value INTEGER,
    p_thumbnail TEXT
)
RETURNS UUID AS $$
DECLARE
    v_asset_id UUID;
BEGIN
    -- 创建IP资产
    INSERT INTO ip_assets (user_id, name, description, type, original_work_id, commercial_value, thumbnail)
    VALUES (p_user_id, p_name, p_description, p_type, p_original_work_id, p_commercial_value, p_thumbnail)
    RETURNING id INTO v_asset_id;
    
    -- 创建默认孵化阶段
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index) VALUES
    (v_asset_id, '创意设计', '完成原创设计作品', 1),
    (v_asset_id, '版权存证', '完成作品版权存证', 2),
    (v_asset_id, 'IP孵化', '将设计转化为IP资产', 3),
    (v_asset_id, '商业合作', '对接品牌合作机会', 4),
    (v_asset_id, '收益分成', '获得作品收益分成', 5);
    
    RETURN v_asset_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取IP资产详情（包含阶段信息）
CREATE OR REPLACE FUNCTION get_ip_asset_details(p_asset_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', a.id,
        'user_id', a.user_id,
        'name', a.name,
        'description', a.description,
        'type', a.type,
        'original_work_id', a.original_work_id,
        'commercial_value', a.commercial_value,
        'thumbnail', a.thumbnail,
        'status', a.status,
        'created_at', a.created_at,
        'updated_at', a.updated_at,
        'stages', COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', s.id,
                    'name', s.name,
                    'description', s.description,
                    'order_index', s.order_index,
                    'completed', s.completed,
                    'completed_at', s.completed_at
                ) ORDER BY s.order_index
            )
            FROM ip_stages s
            WHERE s.ip_asset_id = a.id
            ), '[]'::jsonb
        )
    )
    INTO result
    FROM ip_assets a
    WHERE a.id = p_asset_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 更新阶段完成状态
CREATE OR REPLACE FUNCTION update_stage_completion(
    p_stage_id UUID,
    p_completed BOOLEAN
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE ip_stages 
    SET 
        completed = p_completed,
        completed_at = CASE WHEN p_completed THEN NOW() ELSE NULL END
    WHERE id = p_stage_id;
    
    -- 创建活动记录
    IF p_completed THEN
        INSERT INTO ip_activities (user_id, type, title, description)
        SELECT 
            a.user_id,
            'progress',
            '阶段完成: ' || s.name,
            '您的IP资产"' || a.name || '"已完成' || s.name || '阶段'
        FROM ip_stages s
        JOIN ip_assets a ON s.ip_asset_id = a.id
        WHERE s.id = p_stage_id;
    END IF;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
