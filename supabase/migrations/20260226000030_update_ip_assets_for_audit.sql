-- 更新 ip_assets 表以支持审核流程
-- 添加 pending_review 和 rejected 状态

-- 1. 修改 status 字段的约束
ALTER TABLE ip_assets DROP CONSTRAINT IF EXISTS ip_assets_status_check;
ALTER TABLE ip_assets ADD CONSTRAINT ip_assets_status_check 
    CHECK (status IN ('active', 'archived', 'deleted', 'pending_review', 'rejected'));

-- 2. 添加审核相关字段
ALTER TABLE ip_assets 
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS review_notes TEXT,
    ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS cultural_elements JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_ip_assets_reviewed_at ON ip_assets(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_ip_assets_priority ON ip_assets(priority);
CREATE INDEX IF NOT EXISTS idx_ip_assets_is_featured ON ip_assets(is_featured);

-- 4. 更新RLS策略，允许管理员查看所有IP资产
DROP POLICY IF EXISTS "Admins can view all IP assets" ON ip_assets;
CREATE POLICY "Admins can view all IP assets" ON ip_assets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can update all IP assets" ON ip_assets;
CREATE POLICY "Admins can update all IP assets" ON ip_assets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 5. 插入示例IP资产数据
INSERT INTO ip_assets (
    user_id, 
    name, 
    description, 
    type, 
    commercial_value, 
    thumbnail, 
    status,
    priority,
    is_featured,
    tags,
    cultural_elements,
    view_count,
    like_count
) 
SELECT 
    id as user_id,
    '津门古韵·杨柳青年画创新' as name,
    '融合传统杨柳青年画技法与现代设计理念，创作出既有文化底蕴又符合现代审美的IP形象。作品采用数字绘画技术，保留了年画的线条韵味，同时加入了渐变色彩和立体效果。' as description,
    'illustration' as type,
    15000 as commercial_value,
    'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&h=600&fit=crop' as thumbnail,
    'pending_review' as status,
    'high' as priority,
    true as is_featured,
    '["年画", "传统文化", "数字艺术", "国潮"]'::jsonb as tags,
    '["杨柳青年画", "津门文化", "民间艺术"]'::jsonb as cultural_elements,
    128 as view_count,
    45 as like_count
FROM auth.users 
WHERE email = 'admin@jinmai.com'
LIMIT 1;

-- 插入更多示例数据
INSERT INTO ip_assets (
    user_id, 
    name, 
    description, 
    type, 
    commercial_value, 
    thumbnail, 
    status,
    priority,
    tags,
    cultural_elements
) 
SELECT 
    id as user_id,
    '泥人张·现代演绎系列' as name,
    '以天津泥人张传统泥塑为灵感，创作现代Q版人物形象。作品保留了泥塑的质朴感和手工温度，通过简化造型和明亮色彩，让传统艺术更符合年轻群体审美。' as description,
    '3d_model' as type,
    22000 as commercial_value,
    'https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=800&h=600&fit=crop' as thumbnail,
    'pending_review' as status,
    'high' as priority,
    '["泥塑", "3D建模", "传统手工艺", "文创"]'::jsonb as tags,
    '["泥人张", "天津非遗", "民间工艺"]'::jsonb as cultural_elements
FROM auth.users 
WHERE email = 'admin@jinmai.com'
LIMIT 1;

INSERT INTO ip_assets (
    user_id, 
    name, 
    description, 
    type, 
    commercial_value, 
    thumbnail, 
    status,
    priority,
    tags,
    cultural_elements
) 
SELECT 
    id as user_id,
    '风筝魏·飞天系列图案' as name,
    '提取风筝魏传统风筝的造型元素，设计现代装饰图案。图案可用于服装、家居用品、文创产品等多种场景，将传统风筝艺术融入现代生活。' as description,
    'pattern' as type,
    18000 as commercial_value,
    'https://images.unsplash.com/photo-1533158307587-828f0a76ef46?w=800&h=600&fit=crop' as thumbnail,
    'active' as status,
    'medium' as priority,
    '["风筝", "图案设计", "装饰艺术", "纹样"]'::jsonb as tags,
    '["风筝魏", "天津风筝", "传统纹样"]'::jsonb as cultural_elements
FROM auth.users 
WHERE email = 'admin@jinmai.com'
LIMIT 1;

INSERT INTO ip_assets (
    user_id, 
    name, 
    description, 
    type, 
    commercial_value, 
    thumbnail, 
    status,
    priority,
    tags,
    cultural_elements
) 
SELECT 
    id as user_id,
    '狗不理·品牌形象升级' as name,
    '为天津老字号狗不理设计现代化品牌形象。保留品牌经典元素的同时，通过字体设计、色彩搭配、图形符号的优化，让百年老店焕发新活力。' as description,
    'design' as type,
    35000 as commercial_value,
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop' as thumbnail,
    'pending_review' as status,
    'high' as priority,
    '["品牌设计", "老字号", "VI设计", "视觉升级"]'::jsonb as tags,
    '["狗不理", "天津老字号", "包子文化"]'::jsonb as cultural_elements
FROM auth.users 
WHERE email = 'admin@jinmai.com'
LIMIT 1;

INSERT INTO ip_assets (
    user_id, 
    name, 
    description, 
    type, 
    commercial_value, 
    thumbnail, 
    status,
    priority,
    tags,
    cultural_elements
) 
SELECT 
    id as user_id,
    '古文化街·数字藏品系列' as name,
    '以天津古文化街为场景，创作数字藏品系列。每件藏品对应古文化街的一个标志性建筑或文化符号，通过区块链技术确权，具有收藏价值和文化纪念意义。' as description,
    'digital_collectible' as type,
    28000 as commercial_value,
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop' as thumbnail,
    'active' as status,
    'medium' as priority,
    '["数字藏品", "NFT", "古文化街", "区块链"]'::jsonb as tags,
    '["古文化街", "天津地标", "津门文化"]'::jsonb as cultural_elements
FROM auth.users 
WHERE email = 'admin@jinmai.com'
LIMIT 1;

INSERT INTO ip_assets (
    user_id, 
    name, 
    description, 
    type, 
    commercial_value, 
    thumbnail, 
    status,
    priority,
    tags,
    cultural_elements
) 
SELECT 
    id as user_id,
    '海河夜景·插画系列' as name,
    '创作天津海河夜景插画系列，展现天津现代化都市风貌与历史建筑的和谐共存。作品采用水彩风格，色彩丰富，适合用于城市宣传、文创产品开发等场景。' as description,
    'illustration' as type,
    12000 as commercial_value,
    'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&h=600&fit=crop' as thumbnail,
    'rejected' as status,
    'low' as priority,
    '["插画", "城市风光", "夜景", "水彩"]'::jsonb as tags,
    '["海河", "天津之眼", "城市景观"]'::jsonb as cultural_elements
FROM auth.users 
WHERE email = 'admin@jinmai.com'
LIMIT 1;

-- 6. 为示例IP资产创建孵化阶段
DO $$
DECLARE
    asset_id UUID;
BEGIN
    -- 为津门古韵创建阶段
    SELECT id INTO asset_id FROM ip_assets WHERE name = '津门古韵·杨柳青年画创新' LIMIT 1;
    IF asset_id IS NOT NULL THEN
        INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed, completed_at) VALUES
        (asset_id, '创意设计', '完成原创设计作品', 1, true, NOW() - INTERVAL '30 days'),
        (asset_id, '版权存证', '完成作品版权存证', 2, true, NOW() - INTERVAL '25 days'),
        (asset_id, 'IP孵化', '将设计转化为IP资产', 3, false, NULL),
        (asset_id, '商业合作', '对接品牌合作机会', 4, false, NULL),
        (asset_id, '收益分成', '获得作品收益分成', 5, false, NULL);
    END IF;

    -- 为泥人张创建阶段
    SELECT id INTO asset_id FROM ip_assets WHERE name = '泥人张·现代演绎系列' LIMIT 1;
    IF asset_id IS NOT NULL THEN
        INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed, completed_at) VALUES
        (asset_id, '创意设计', '完成原创设计作品', 1, true, NOW() - INTERVAL '20 days'),
        (asset_id, '版权存证', '完成作品版权存证', 2, false, NULL),
        (asset_id, 'IP孵化', '将设计转化为IP资产', 3, false, NULL),
        (asset_id, '商业合作', '对接品牌合作机会', 4, false, NULL),
        (asset_id, '收益分成', '获得作品收益分成', 5, false, NULL);
    END IF;

    -- 为风筝魏创建阶段
    SELECT id INTO asset_id FROM ip_assets WHERE name = '风筝魏·飞天系列图案' LIMIT 1;
    IF asset_id IS NOT NULL THEN
        INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed, completed_at) VALUES
        (asset_id, '创意设计', '完成原创设计作品', 1, true, NOW() - INTERVAL '45 days'),
        (asset_id, '版权存证', '完成作品版权存证', 2, true, NOW() - INTERVAL '40 days'),
        (asset_id, 'IP孵化', '将设计转化为IP资产', 3, true, NOW() - INTERVAL '35 days'),
        (asset_id, '商业合作', '对接品牌合作机会', 4, true, NOW() - INTERVAL '10 days'),
        (asset_id, '收益分成', '获得作品收益分成', 5, false, NULL);
    END IF;

    -- 为狗不理创建阶段
    SELECT id INTO asset_id FROM ip_assets WHERE name = '狗不理·品牌形象升级' LIMIT 1;
    IF asset_id IS NOT NULL THEN
        INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed, completed_at) VALUES
        (asset_id, '创意设计', '完成原创设计作品', 1, true, NOW() - INTERVAL '15 days'),
        (asset_id, '版权存证', '完成作品版权存证', 2, false, NULL),
        (asset_id, 'IP孵化', '将设计转化为IP资产', 3, false, NULL),
        (asset_id, '商业合作', '对接品牌合作机会', 4, false, NULL),
        (asset_id, '收益分成', '获得作品收益分成', 5, false, NULL);
    END IF;

    -- 为古文化街创建阶段
    SELECT id INTO asset_id FROM ip_assets WHERE name = '古文化街·数字藏品系列' LIMIT 1;
    IF asset_id IS NOT NULL THEN
        INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed, completed_at) VALUES
        (asset_id, '创意设计', '完成原创设计作品', 1, true, NOW() - INTERVAL '60 days'),
        (asset_id, '版权存证', '完成作品版权存证', 2, true, NOW() - INTERVAL '55 days'),
        (asset_id, 'IP孵化', '将设计转化为IP资产', 3, true, NOW() - INTERVAL '50 days'),
        (asset_id, '商业合作', '对接品牌合作机会', 4, true, NOW() - INTERVAL '20 days'),
        (asset_id, '收益分成', '获得作品收益分成', 5, true, NOW() - INTERVAL '5 days');
    END IF;

    -- 为海河夜景创建阶段
    SELECT id INTO asset_id FROM ip_assets WHERE name = '海河夜景·插画系列' LIMIT 1;
    IF asset_id IS NOT NULL THEN
        INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed, completed_at) VALUES
        (asset_id, '创意设计', '完成原创设计作品', 1, true, NOW() - INTERVAL '10 days'),
        (asset_id, '版权存证', '完成作品版权存证', 2, false, NULL),
        (asset_id, 'IP孵化', '将设计转化为IP资产', 3, false, NULL),
        (asset_id, '商业合作', '对接品牌合作机会', 4, false, NULL),
        (asset_id, '收益分成', '获得作品收益分成', 5, false, NULL);
    END IF;
END $$;

-- 7. 创建审核统计视图
CREATE OR REPLACE VIEW ip_asset_audit_stats AS
SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'pending_review') as pending,
    COUNT(*) FILTER (WHERE status IN ('active', 'approved')) as approved,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_submitted,
    COUNT(*) FILTER (WHERE reviewed_at >= CURRENT_DATE) as today_reviewed
FROM ip_assets;
