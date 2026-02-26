-- 修复 IP 资产审核功能
-- 在 Supabase Studio 的 SQL Editor 中执行此脚本

-- 1. 修改 status 字段的约束，添加审核状态
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

-- 4. 禁用 RLS 以便插入数据（仅用于开发环境）
ALTER TABLE ip_assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE ip_stages DISABLE ROW LEVEL SECURITY;

-- 5. 获取一个存在的用户ID
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- 尝试获取第一个用户作为示例数据的创建者
    SELECT id INTO admin_user_id FROM auth.users LIMIT 1;
    
    IF admin_user_id IS NULL THEN
        RAISE NOTICE '没有找到用户，跳过插入示例数据';
        RETURN;
    END IF;
    
    RAISE NOTICE '使用用户ID: %', admin_user_id;
    
    -- 6. 插入示例IP资产数据
    -- 示例1: 待审核的杨柳青年画
    INSERT INTO ip_assets (
        user_id, name, description, type, commercial_value, thumbnail, 
        status, priority, is_featured, tags, cultural_elements, view_count, like_count
    ) VALUES (
        admin_user_id,
        '津门古韵·杨柳青年画创新',
        '融合传统杨柳青年画技法与现代设计理念，创作出既有文化底蕴又符合现代审美的IP形象。作品采用数字绘画技术，保留了年画的线条韵味，同时加入了渐变色彩和立体效果。',
        'illustration',
        15000,
        'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&h=600&fit=crop',
        'pending_review',
        'high',
        true,
        '["年画", "传统文化", "数字艺术", "国潮"]'::jsonb,
        '["杨柳青年画", "津门文化", "民间艺术"]'::jsonb,
        128,
        45
    ) ON CONFLICT DO NOTHING;
    
    -- 示例2: 待审核的泥人张
    INSERT INTO ip_assets (
        user_id, name, description, type, commercial_value, thumbnail, 
        status, priority, tags, cultural_elements
    ) VALUES (
        admin_user_id,
        '泥人张·现代演绎系列',
        '以天津泥人张传统泥塑为灵感，创作现代Q版人物形象。作品保留了泥塑的质朴感和手工温度，通过简化造型和明亮色彩，让传统艺术更符合年轻群体审美。',
        '3d_model',
        22000,
        'https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=800&h=600&fit=crop',
        'pending_review',
        'high',
        '["泥塑", "3D建模", "传统手工艺", "文创"]'::jsonb,
        '["泥人张", "天津非遗", "民间工艺"]'::jsonb
    ) ON CONFLICT DO NOTHING;
    
    -- 示例3: 已通过的风筝魏
    INSERT INTO ip_assets (
        user_id, name, description, type, commercial_value, thumbnail, 
        status, priority, tags, cultural_elements
    ) VALUES (
        admin_user_id,
        '风筝魏·飞天系列图案',
        '提取风筝魏传统风筝的造型元素，设计现代装饰图案。图案可用于服装、家居用品、文创产品等多种场景，将传统风筝艺术融入现代生活。',
        'pattern',
        18000,
        'https://images.unsplash.com/photo-1533158307587-828f0a76ef46?w=800&h=600&fit=crop',
        'active',
        'medium',
        '["风筝", "图案设计", "装饰艺术", "纹样"]'::jsonb,
        '["风筝魏", "天津风筝", "传统纹样"]'::jsonb
    ) ON CONFLICT DO NOTHING;
    
    -- 示例4: 待审核的狗不理
    INSERT INTO ip_assets (
        user_id, name, description, type, commercial_value, thumbnail, 
        status, priority, tags, cultural_elements
    ) VALUES (
        admin_user_id,
        '狗不理·品牌形象升级',
        '为天津老字号狗不理设计现代化品牌形象。保留品牌经典元素的同时，通过字体设计、色彩搭配、图形符号的优化，让百年老店焕发新活力。',
        'design',
        35000,
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
        'pending_review',
        'high',
        '["品牌设计", "老字号", "VI设计", "视觉升级"]'::jsonb,
        '["狗不理", "天津老字号", "包子文化"]'::jsonb
    ) ON CONFLICT DO NOTHING;
    
    -- 示例5: 已通过的数字藏品
    INSERT INTO ip_assets (
        user_id, name, description, type, commercial_value, thumbnail, 
        status, priority, tags, cultural_elements
    ) VALUES (
        admin_user_id,
        '古文化街·数字藏品系列',
        '以天津古文化街为场景，创作数字藏品系列。每件藏品对应古文化街的一个标志性建筑或文化符号，通过区块链技术确权，具有收藏价值和文化纪念意义。',
        'digital_collectible',
        28000,
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
        'active',
        'medium',
        '["数字藏品", "NFT", "古文化街", "区块链"]'::jsonb,
        '["古文化街", "天津地标", "津门文化"]'::jsonb
    ) ON CONFLICT DO NOTHING;
    
    -- 示例6: 已驳回的海河夜景
    INSERT INTO ip_assets (
        user_id, name, description, type, commercial_value, thumbnail, 
        status, priority, tags, cultural_elements
    ) VALUES (
        admin_user_id,
        '海河夜景·插画系列',
        '创作天津海河夜景插画系列，展现天津现代化都市风貌与历史建筑的和谐共存。作品采用水彩风格，色彩丰富，适合用于城市宣传、文创产品开发等场景。',
        'illustration',
        12000,
        'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&h=600&fit=crop',
        'rejected',
        'low',
        '["插画", "城市风光", "夜景", "水彩"]'::jsonb,
        '["海河", "天津之眼", "城市景观"]'::jsonb
    ) ON CONFLICT DO NOTHING;
    
    -- 7. 为示例IP资产创建孵化阶段
    -- 为津门古韵创建阶段
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed, completed_at)
    SELECT id, '创意设计', '完成原创设计作品', 1, true, NOW() - INTERVAL '30 days'
    FROM ip_assets WHERE name = '津门古韵·杨柳青年画创新'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed, completed_at)
    SELECT id, '版权存证', '完成作品版权存证', 2, true, NOW() - INTERVAL '25 days'
    FROM ip_assets WHERE name = '津门古韵·杨柳青年画创新'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed)
    SELECT id, 'IP孵化', '将设计转化为IP资产', 3, false
    FROM ip_assets WHERE name = '津门古韵·杨柳青年画创新'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed)
    SELECT id, '商业合作', '对接品牌合作机会', 4, false
    FROM ip_assets WHERE name = '津门古韵·杨柳青年画创新'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed)
    SELECT id, '收益分成', '获得作品收益分成', 5, false
    FROM ip_assets WHERE name = '津门古韵·杨柳青年画创新'
    ON CONFLICT DO NOTHING;
    
    -- 为泥人张创建阶段
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed, completed_at)
    SELECT id, '创意设计', '完成原创设计作品', 1, true, NOW() - INTERVAL '20 days'
    FROM ip_assets WHERE name = '泥人张·现代演绎系列'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed)
    SELECT id, '版权存证', '完成作品版权存证', 2, false
    FROM ip_assets WHERE name = '泥人张·现代演绎系列'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed)
    SELECT id, 'IP孵化', '将设计转化为IP资产', 3, false
    FROM ip_assets WHERE name = '泥人张·现代演绎系列'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed)
    SELECT id, '商业合作', '对接品牌合作机会', 4, false
    FROM ip_assets WHERE name = '泥人张·现代演绎系列'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed)
    SELECT id, '收益分成', '获得作品收益分成', 5, false
    FROM ip_assets WHERE name = '泥人张·现代演绎系列'
    ON CONFLICT DO NOTHING;
    
    -- 为风筝魏创建阶段（已完成更多）
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed, completed_at)
    SELECT id, '创意设计', '完成原创设计作品', 1, true, NOW() - INTERVAL '45 days'
    FROM ip_assets WHERE name = '风筝魏·飞天系列图案'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed, completed_at)
    SELECT id, '版权存证', '完成作品版权存证', 2, true, NOW() - INTERVAL '40 days'
    FROM ip_assets WHERE name = '风筝魏·飞天系列图案'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed, completed_at)
    SELECT id, 'IP孵化', '将设计转化为IP资产', 3, true, NOW() - INTERVAL '35 days'
    FROM ip_assets WHERE name = '风筝魏·飞天系列图案'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed, completed_at)
    SELECT id, '商业合作', '对接品牌合作机会', 4, true, NOW() - INTERVAL '10 days'
    FROM ip_assets WHERE name = '风筝魏·飞天系列图案'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed)
    SELECT id, '收益分成', '获得作品收益分成', 5, false
    FROM ip_assets WHERE name = '风筝魏·飞天系列图案'
    ON CONFLICT DO NOTHING;
    
END $$;

-- 8. 创建审核统计视图
DROP VIEW IF EXISTS ip_asset_audit_stats;
CREATE VIEW ip_asset_audit_stats AS
SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'pending_review') as pending,
    COUNT(*) FILTER (WHERE status IN ('active', 'approved')) as approved,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_submitted,
    COUNT(*) FILTER (WHERE reviewed_at >= CURRENT_DATE) as today_reviewed
FROM ip_assets;

-- 9. 验证数据
SELECT 'IP资产总数' as metric, COUNT(*) as value FROM ip_assets
UNION ALL
SELECT '待审核数', COUNT(*) FROM ip_assets WHERE status = 'pending_review'
UNION ALL
SELECT '已通过数', COUNT(*) FROM ip_assets WHERE status = 'active'
UNION ALL
SELECT '已驳回数', COUNT(*) FROM ip_assets WHERE status = 'rejected';
