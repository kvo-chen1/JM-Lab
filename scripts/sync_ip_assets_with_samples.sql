-- 同步 IP 资产数据与 IP孵化中心显示的示例数据一致
-- 在 Supabase Studio 的 SQL Editor 中执行此脚本

-- 1. 先删除之前插入的示例数据
DELETE FROM ip_stages WHERE ip_asset_id IN (
    SELECT id FROM ip_assets 
    WHERE name IN ('津门古韵·杨柳青年画创新', '泥人张·现代演绎系列', '风筝魏·飞天系列图案', 
                   '狗不理·品牌形象升级', '古文化街·数字藏品系列', '海河夜景·插画系列')
);

DELETE FROM ip_assets 
WHERE name IN ('津门古韵·杨柳青年画创新', '泥人张·现代演绎系列', '风筝魏·飞天系列图案', 
               '狗不理·品牌形象升级', '古文化街·数字藏品系列', '海河夜景·插画系列');

-- 2. 获取一个存在的用户ID作为这些示例数据的创建者
DO $$
DECLARE
    sample_user_id UUID;
BEGIN
    -- 获取第一个用户ID
    SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
    
    IF sample_user_id IS NULL THEN
        RAISE NOTICE '没有找到用户，无法插入示例数据';
        RETURN;
    END IF;
    
    RAISE NOTICE '使用用户ID: %', sample_user_id;

    -- 3. 插入与 IP孵化中心一致的示例数据
    
    -- 示例1: 津门古韵·杨柳青年画创新
    INSERT INTO ip_assets (
        user_id, name, description, type, commercial_value, thumbnail, status,
        priority, is_featured, tags, cultural_elements, view_count, like_count, created_at, updated_at
    ) VALUES (
        sample_user_id,
        '津门古韵·杨柳青年画创新',
        '将传统杨柳青年画元素与现代插画风格融合，创作出具有天津特色的国潮插画系列，适用于文创产品、包装设计等多种商业场景。',
        'illustration',
        15000,
        'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=400&h=300&fit=crop',
        'pending_review',
        'high',
        true,
        '["年画", "传统文化", "数字艺术", "国潮"]'::jsonb,
        '["杨柳青年画", "津门文化", "民间艺术"]'::jsonb,
        128,
        45,
        '2026-01-15T10:00:00Z',
        '2026-01-15T10:00:00Z'
    );
    
    -- 示例2: 海河印象·纹样设计
    INSERT INTO ip_assets (
        user_id, name, description, type, commercial_value, thumbnail, status,
        priority, is_featured, tags, cultural_elements, view_count, like_count, created_at, updated_at
    ) VALUES (
        sample_user_id,
        '海河印象·纹样设计',
        '提取海河两岸建筑轮廓与传统纹样，设计出具有地域特色的装饰纹样，可应用于家居用品、服装面料、包装纸等领域。',
        'pattern',
        25000,
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
        'active',
        'medium',
        true,
        '["纹样", "海河", "装饰艺术", "地域特色"]'::jsonb,
        '["海河文化", "天津建筑", "传统纹样"]'::jsonb,
        256,
        89,
        '2026-01-10T09:00:00Z',
        '2026-01-10T09:00:00Z'
    );
    
    -- 示例3: 泥人张·3D数字藏品
    INSERT INTO ip_assets (
        user_id, name, description, type, commercial_value, thumbnail, status,
        priority, is_featured, tags, cultural_elements, view_count, like_count, created_at, updated_at
    ) VALUES (
        sample_user_id,
        '泥人张·3D数字藏品',
        '以天津泥人张传统技艺为灵感，创作3D数字艺术藏品，结合区块链技术，打造具有收藏价值的数字艺术品。',
        '3d_model',
        35000,
        'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop',
        'pending_review',
        'high',
        true,
        '["3D模型", "数字藏品", "区块链", "非遗"]'::jsonb,
        '["泥人张", "天津非遗", "数字艺术"]'::jsonb,
        312,
        156,
        '2026-02-01T10:00:00Z',
        '2026-02-01T10:00:00Z'
    );
    
    -- 4. 为示例IP资产创建孵化阶段
    
    -- 为津门古韵创建阶段
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed, completed_at)
    SELECT id, '创意设计', '完成原创设计作品', 1, true, '2026-01-15T10:00:00Z'
    FROM ip_assets WHERE name = '津门古韵·杨柳青年画创新';
    
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed, completed_at)
    SELECT id, '版权存证', '完成作品版权存证', 2, true, '2026-01-20T14:30:00Z'
    FROM ip_assets WHERE name = '津门古韵·杨柳青年画创新';
    
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed)
    SELECT id, 'IP孵化', '将设计转化为IP资产', 3, false
    FROM ip_assets WHERE name = '津门古韵·杨柳青年画创新';
    
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed)
    SELECT id, '商业合作', '对接品牌合作机会', 4, false
    FROM ip_assets WHERE name = '津门古韵·杨柳青年画创新';
    
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed)
    SELECT id, '收益分成', '获得作品收益分成', 5, false
    FROM ip_assets WHERE name = '津门古韵·杨柳青年画创新';
    
    -- 为海河印象创建阶段
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed, completed_at)
    SELECT id, '创意设计', '完成原创设计作品', 1, true, '2026-01-10T09:00:00Z'
    FROM ip_assets WHERE name = '海河印象·纹样设计';
    
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed, completed_at)
    SELECT id, '版权存证', '完成作品版权存证', 2, true, '2026-01-12T16:00:00Z'
    FROM ip_assets WHERE name = '海河印象·纹样设计';
    
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed, completed_at)
    SELECT id, 'IP孵化', '将设计转化为IP资产', 3, true, '2026-01-18T11:00:00Z'
    FROM ip_assets WHERE name = '海河印象·纹样设计';
    
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed)
    SELECT id, '商业合作', '对接品牌合作机会', 4, false
    FROM ip_assets WHERE name = '海河印象·纹样设计';
    
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed)
    SELECT id, '收益分成', '获得作品收益分成', 5, false
    FROM ip_assets WHERE name = '海河印象·纹样设计';
    
    -- 为泥人张创建阶段
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed, completed_at)
    SELECT id, '创意设计', '完成原创设计作品', 1, true, '2026-02-01T10:00:00Z'
    FROM ip_assets WHERE name = '泥人张·3D数字藏品';
    
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed)
    SELECT id, '版权存证', '完成作品版权存证', 2, false
    FROM ip_assets WHERE name = '泥人张·3D数字藏品';
    
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed)
    SELECT id, 'IP孵化', '将设计转化为IP资产', 3, false
    FROM ip_assets WHERE name = '泥人张·3D数字藏品';
    
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed)
    SELECT id, '商业合作', '对接品牌合作机会', 4, false
    FROM ip_assets WHERE name = '泥人张·3D数字藏品';
    
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index, completed)
    SELECT id, '收益分成', '获得作品收益分成', 5, false
    FROM ip_assets WHERE name = '泥人张·3D数字藏品';
    
    RAISE NOTICE '示例数据插入完成';
END $$;

-- 5. 验证数据
SELECT 'IP资产总数' as metric, COUNT(*) as value FROM ip_assets
UNION ALL
SELECT '待审核数', COUNT(*) FROM ip_assets WHERE status = 'pending_review'
UNION ALL
SELECT '已通过数', COUNT(*) FROM ip_assets WHERE status = 'active'
UNION ALL
SELECT '已驳回数', COUNT(*) FROM ip_assets WHERE status = 'rejected';

-- 6. 查看插入的数据详情
SELECT 
    ia.id, 
    ia.name, 
    ia.type,
    ia.status,
    ia.commercial_value,
    au.email as creator_email,
    au.raw_user_meta_data->>'username' as creator_username
FROM ip_assets ia
JOIN auth.users au ON ia.user_id = au.id
ORDER BY ia.created_at DESC;
