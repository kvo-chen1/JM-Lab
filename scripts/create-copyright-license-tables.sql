-- ============================================
-- 版权授权需求功能数据库表结构
-- ============================================

-- 1. 版权授权需求表
-- 品牌方发布的可版权授权需求
CREATE TABLE IF NOT EXISTS copyright_license_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    brand_name VARCHAR(255) NOT NULL,
    brand_logo TEXT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    requirements TEXT, -- 申请要求
    license_type VARCHAR(50) DEFAULT 'non_exclusive', -- exclusive(独家)/non_exclusive(非独家)/sole(排他)
    license_scope JSONB DEFAULT '{"regions": [], "channels": [], "duration": ""}', -- 授权范围
    license_fee_min INTEGER, -- 最低授权费
    license_fee_max INTEGER, -- 最高授权费
    revenue_share_rate DECIMAL(5,2) DEFAULT 10.00, -- 分成比例(%)
    ip_categories JSONB DEFAULT '[]', -- 适用IP类别: ['illustration', 'pattern', 'design', '3d_model', 'digital_collectible']
    status VARCHAR(50) DEFAULT 'open', -- open(开放)/closed(已关闭)/paused(暂停)
    valid_until TIMESTAMPTZ, -- 有效期
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    view_count INTEGER DEFAULT 0,
    application_count INTEGER DEFAULT 0,
    approved_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_license_requests_brand_id ON copyright_license_requests(brand_id);
CREATE INDEX IF NOT EXISTS idx_license_requests_status ON copyright_license_requests(status);
CREATE INDEX IF NOT EXISTS idx_license_requests_created_at ON copyright_license_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_license_requests_valid_until ON copyright_license_requests(valid_until);

-- 2. 版权授权申请表
-- 用户向品牌方提交的授权申请
CREATE TABLE IF NOT EXISTS copyright_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES copyright_license_requests(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    applicant_name VARCHAR(255) NOT NULL,
    applicant_avatar TEXT,
    ip_asset_id UUID REFERENCES ip_assets(id) ON DELETE SET NULL,
    ip_asset_name VARCHAR(255),
    ip_asset_thumbnail TEXT,
    message TEXT, -- 申请留言
    proposed_usage TEXT, -- 计划用途描述
    expected_products JSONB DEFAULT '[]', -- 预期产品类型
    status VARCHAR(50) DEFAULT 'pending', -- pending(待处理)/approved(已同意)/rejected(已拒绝)/contacted(已联系)/completed(已完成)/cancelled(已取消)
    brand_response TEXT, -- 品牌方回复
    contact_shared BOOLEAN DEFAULT FALSE, -- 是否已分享联系方式
    brand_contact_email VARCHAR(255),
    brand_contact_phone VARCHAR(50),
    brand_contact_wechat VARCHAR(100),
    license_agreement_url TEXT, -- 授权协议URL
    license_start_date TIMESTAMPTZ,
    license_end_date TIMESTAMPTZ,
    actual_license_fee INTEGER, -- 实际授权费
    revenue_share_rate DECIMAL(5,2), -- 实际分成比例
    reviewed_at TIMESTAMPTZ, -- 审核时间
    completed_at TIMESTAMPTZ, -- 完成时间
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_copyright_applications_request_id ON copyright_applications(request_id);
CREATE INDEX IF NOT EXISTS idx_copyright_applications_applicant_id ON copyright_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_copyright_applications_status ON copyright_applications(status);
CREATE INDEX IF NOT EXISTS idx_copyright_applications_created_at ON copyright_applications(created_at);

-- 3. 授权IP产品表
-- 获得授权后创建的文创产品
CREATE TABLE IF NOT EXISTS licensed_ip_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES copyright_applications(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    product_description TEXT,
    product_images JSONB DEFAULT '[]',
    product_category VARCHAR(100),
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft', -- draft(草稿)/pending_review(审核中)/approved(已通过)/rejected(已拒绝)/on_sale(销售中)/sold_out(已售罄)/discontinued(已下架)
    sales_count INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    platform_fee DECIMAL(10,2) DEFAULT 0,
    brand_share DECIMAL(10,2) DEFAULT 0,
    creator_share DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_licensed_products_application_id ON licensed_ip_products(application_id);
CREATE INDEX IF NOT EXISTS idx_licensed_products_brand_id ON licensed_ip_products(brand_id);
CREATE INDEX IF NOT EXISTS idx_licensed_products_creator_id ON licensed_ip_products(creator_id);
CREATE INDEX IF NOT EXISTS idx_licensed_products_status ON licensed_ip_products(status);
CREATE INDEX IF NOT EXISTS idx_licensed_products_created_at ON licensed_ip_products(created_at);

-- 4. 自动更新 updated_at 的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
DROP TRIGGER IF EXISTS update_license_requests_updated_at ON copyright_license_requests;
CREATE TRIGGER update_license_requests_updated_at 
    BEFORE UPDATE ON copyright_license_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_copyright_applications_updated_at ON copyright_applications;
CREATE TRIGGER update_copyright_applications_updated_at 
    BEFORE UPDATE ON copyright_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_licensed_products_updated_at ON licensed_ip_products;
CREATE TRIGGER update_licensed_products_updated_at 
    BEFORE UPDATE ON licensed_ip_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. 申请数量自动更新触发器
-- 当有新申请时，自动更新需求的 application_count
CREATE OR REPLACE FUNCTION update_request_application_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE copyright_license_requests 
        SET application_count = application_count + 1
        WHERE id = NEW.request_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE copyright_license_requests 
        SET application_count = application_count - 1
        WHERE id = OLD.request_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_update_request_application_count ON copyright_applications;
CREATE TRIGGER trg_update_request_application_count
    AFTER INSERT OR DELETE ON copyright_applications
    FOR EACH ROW EXECUTE FUNCTION update_request_application_count();

-- 6. 通过数量自动更新触发器
-- 当申请被批准时，自动更新需求的 approved_count
CREATE OR REPLACE FUNCTION update_request_approved_count()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
        UPDATE copyright_license_requests 
        SET approved_count = approved_count + 1
        WHERE id = NEW.request_id;
    ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
        UPDATE copyright_license_requests 
        SET approved_count = approved_count - 1
        WHERE id = NEW.request_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_update_request_approved_count ON copyright_applications;
CREATE TRIGGER trg_update_request_approved_count
    AFTER UPDATE ON copyright_applications
    FOR EACH ROW EXECUTE FUNCTION update_request_approved_count();

-- ============================================
-- 插入示例数据
-- ============================================

-- 示例授权需求数据（仅用于开发测试，生产环境请删除）
INSERT INTO copyright_license_requests (
    brand_id, brand_name, brand_logo, title, description, requirements,
    license_type, license_scope, license_fee_min, license_fee_max, revenue_share_rate,
    ip_categories, status, valid_until, contact_email, contact_phone
) VALUES 
(
    '00000000-0000-0000-0000-000000000001',
    '天津文旅集团',
    'https://example.com/logos/tianjin-culture.png',
    '天津城市文创IP授权合作',
    '诚邀优秀创作者使用天津城市元素进行文创产品设计，包括但不限于：天津之眼、意式风情区、古文化街等标志性景点。',
    '1. 作品需体现天津文化特色；2. 设计风格不限，鼓励创新；3. 需提供完整设计方案；4. 有文创产品设计经验者优先。',
    'non_exclusive',
    '{"regions": ["中国大陆", "港澳台"], "channels": ["线上电商", "线下门店", "景区合作"], "duration": "2年"}',
    5000,
    50000,
    15.00,
    '["illustration", "pattern", "design", "3d_model"]',
    'open',
    NOW() + INTERVAL '3 months',
    'license@tianjinculture.com',
    '022-12345678'
),
(
    '00000000-0000-0000-0000-000000000002',
    '海河传媒',
    'https://example.com/logos/haihe-media.png',
    '海河主题插画授权征集',
    '为海河传媒旗下产品线征集海河主题插画作品，用于文创产品开发。',
    '1. 需展现海河风光或沿岸建筑；2. 风格可为写实或艺术化；3. 分辨率不低于300dpi；4. 需提供源文件。',
    'non_exclusive',
    '{"regions": ["中国大陆"], "channels": ["线上电商", "媒体合作"], "duration": "1年"}',
    3000,
    20000,
    12.00,
    '["illustration", "pattern"]',
    'open',
    NOW() + INTERVAL '2 months',
    'creative@haihemedia.com',
    '022-87654321'
),
(
    '00000000-0000-0000-0000-000000000003',
    '泥人张工作室',
    'https://example.com/logos/nirenzhang.png',
    '传统技艺数字化授权合作',
    '将传统泥人张技艺进行数字化创作，开发数字藏品和3D模型产品。',
    '1. 需尊重传统文化；2. 3D建模精度要求高；3. 数字藏品需符合平台规范；4. 需提供创作说明。',
    'exclusive',
    '{"regions": ["全球"], "channels": ["数字藏品平台", "元宇宙", "虚拟展览"], "duration": "3年"}',
    10000,
    100000,
    20.00,
    '["3d_model", "digital_collectible"]',
    'open',
    NOW() + INTERVAL '6 months',
    'digital@nirenzhang.com',
    '022-11112222'
),
(
    '00000000-0000-0000-0000-000000000004',
    '天津博物馆',
    'https://example.com/logos/tianjin-museum.png',
    '文物IP授权开发计划',
    '基于天津博物馆馆藏文物进行IP开发，包括镇馆之宝、特色藏品等。',
    '1. 需有文物再创作经验；2. 作品需经博物馆审核；3. 需注明文物来源；4. 鼓励教育性设计。',
    'non_exclusive',
    '{"regions": ["中国大陆"], "channels": ["博物馆商店", "线上电商", "教育合作"], "duration": "2年"}',
    8000,
    80000,
    18.00,
    '["illustration", "design", "pattern", "3d_model"]',
    'open',
    NOW() + INTERVAL '4 months',
    'ip@tjmuseum.com',
    '022-33334444'
);

-- ============================================
-- 完成
-- ============================================
SELECT '版权授权需求功能数据库表创建完成！' AS message;
