-- ==========================================================================
-- IP孵化中心数据库表结构
-- 用于Neon PostgreSQL数据库
-- ==========================================================================

-- 1. 创建 ip_assets 表（IP资产表）- 如果不存在
CREATE TABLE IF NOT EXISTS ip_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'illustration',
    original_work_id UUID REFERENCES works(id) ON DELETE SET NULL,
    commercial_value INTEGER DEFAULT 0,
    thumbnail TEXT,
    status VARCHAR(50) DEFAULT 'pending_review',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建 ip_stages 表（IP阶段表）- 如果不存在
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

-- 3. 创建 ip_partnerships 表（IP合作表）- 如果不存在
CREATE TABLE IF NOT EXISTS ip_partnerships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_asset_id UUID NOT NULL REFERENCES ip_assets(id) ON DELETE CASCADE,
    opportunity_id UUID,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    brand_name TEXT,
    brand_logo TEXT,
    description TEXT,
    reward TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建 commercial_opportunities 表（商业机会表）
CREATE TABLE IF NOT EXISTS commercial_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES users(id) ON DELETE CASCADE,
    brand_name VARCHAR(255) NOT NULL,
    brand_logo TEXT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    reward TEXT,
    requirements TEXT,
    deadline TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'open',
    match_criteria JSONB,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 创建 copyright_assets 表（版权资产表）
CREATE TABLE IF NOT EXISTS copyright_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    thumbnail TEXT,
    type VARCHAR(50) DEFAULT 'illustration',
    status VARCHAR(50) DEFAULT 'registered',
    can_license BOOLEAN DEFAULT FALSE,
    license_price INTEGER,
    certificate_url TEXT,
    registered_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 创建 ip_activities 表（IP活动表）
CREATE TABLE IF NOT EXISTS ip_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    ip_asset_id UUID REFERENCES ip_assets(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================================
-- 创建索引
-- ==========================================================================

-- ip_assets 索引
CREATE INDEX IF NOT EXISTS idx_ip_assets_user_id ON ip_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_ip_assets_status ON ip_assets(status);
CREATE INDEX IF NOT EXISTS idx_ip_assets_type ON ip_assets(type);
CREATE INDEX IF NOT EXISTS idx_ip_assets_created_at ON ip_assets(created_at);

-- ip_stages 索引
CREATE INDEX IF NOT EXISTS idx_ip_stages_ip_asset_id ON ip_stages(ip_asset_id);
CREATE INDEX IF NOT EXISTS idx_ip_stages_order_index ON ip_stages(order_index);

-- ip_partnerships 索引
CREATE INDEX IF NOT EXISTS idx_ip_partnerships_user_id ON ip_partnerships(user_id);
CREATE INDEX IF NOT EXISTS idx_ip_partnerships_ip_asset_id ON ip_partnerships(ip_asset_id);
CREATE INDEX IF NOT EXISTS idx_ip_partnerships_status ON ip_partnerships(status);
CREATE INDEX IF NOT EXISTS idx_ip_partnerships_opportunity_id ON ip_partnerships(opportunity_id);

-- commercial_opportunities 索引
CREATE INDEX IF NOT EXISTS idx_commercial_opportunities_status ON commercial_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_commercial_opportunities_created_at ON commercial_opportunities(created_at);

-- copyright_assets 索引
CREATE INDEX IF NOT EXISTS idx_copyright_assets_user_id ON copyright_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_copyright_assets_status ON copyright_assets(status);

-- ip_activities 索引
CREATE INDEX IF NOT EXISTS idx_ip_activities_user_id ON ip_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_ip_activities_is_read ON ip_activities(is_read);
CREATE INDEX IF NOT EXISTS idx_ip_activities_created_at ON ip_activities(created_at);

-- ==========================================================================
-- 插入示例商业机会数据
-- ==========================================================================

INSERT INTO commercial_opportunities (brand_name, brand_logo, name, description, reward, requirements, status, match_criteria)
VALUES 
    ('天津文旅集团', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=100&h=100&fit=crop', '天津城市文创设计合作', '为天津文旅集团设计城市主题文创产品，包括明信片、冰箱贴、T恤等周边产品。', '¥5,000 - ¥20,000 + 销售分成', '需要具有天津文化元素的设计作品，风格要求国潮、年轻化', 'open', '{"type": ["illustration", "pattern"], "style": "国潮"}'),
    ('海河传媒', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop', '海河主题插画征集', '为海河传媒创作海河主题插画，用于宣传海报和数字媒体。', '¥3,000 - ¥10,000', '需要展现海河风光，风格不限，要求原创', 'open', '{"type": ["illustration"], "theme": "海河"}'),
    ('泥人张工作室', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=100&h=100&fit=crop', '传统技艺数字化合作', '将传统泥人张技艺进行数字化创作，开发数字藏品和NFT。', '¥10,000 - ¥50,000 + 长期分成', '需要3D建模或数字艺术能力，了解传统文化', 'open', '{"type": ["3d_model", "digital_collectible"], "style": "传统"}'),
    ('天津博物馆', 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=100&h=100&fit=crop', '文物IP授权合作', '基于天津博物馆馆藏文物进行IP开发和文创产品设计。', '¥8,000 - ¥30,000 + 授权费', '需要有文物再创作经验，尊重传统文化', 'open', '{"type": ["illustration", "design", "pattern"], "theme": "文物"}')
ON CONFLICT DO NOTHING;

-- ==========================================================================
-- 创建触发器：自动更新 updated_at
-- ==========================================================================

-- ip_assets 更新触发器
CREATE OR REPLACE FUNCTION update_ip_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ip_assets_updated_at ON ip_assets;
CREATE TRIGGER trigger_ip_assets_updated_at
    BEFORE UPDATE ON ip_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_ip_assets_updated_at();

-- ip_stages 更新触发器
CREATE OR REPLACE FUNCTION update_ip_stages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ip_stages_updated_at ON ip_stages;
CREATE TRIGGER trigger_ip_stages_updated_at
    BEFORE UPDATE ON ip_stages
    FOR EACH ROW
    EXECUTE FUNCTION update_ip_stages_updated_at();

-- ip_partnerships 更新触发器
CREATE OR REPLACE FUNCTION update_ip_partnerships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ip_partnerships_updated_at ON ip_partnerships;
CREATE TRIGGER trigger_ip_partnerships_updated_at
    BEFORE UPDATE ON ip_partnerships
    FOR EACH ROW
    EXECUTE FUNCTION update_ip_partnerships_updated_at();

-- commercial_opportunities 更新触发器
CREATE OR REPLACE FUNCTION update_commercial_opportunities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_commercial_opportunities_updated_at ON commercial_opportunities;
CREATE TRIGGER trigger_commercial_opportunities_updated_at
    BEFORE UPDATE ON commercial_opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_commercial_opportunities_updated_at();

-- copyright_assets 更新触发器
CREATE OR REPLACE FUNCTION update_copyright_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_copyright_assets_updated_at ON copyright_assets;
CREATE TRIGGER trigger_copyright_assets_updated_at
    BEFORE UPDATE ON copyright_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_copyright_assets_updated_at();

-- ==========================================================================
-- 完成
-- ==========================================================================
