-- 更新 IP 资产创建函数，支持设置状态
-- 用于实现 IP 资产审核流程

-- 1. 先删除现有的函数（避免参数不匹配的问题）
DROP FUNCTION IF EXISTS create_ip_asset_with_stages(UUID, VARCHAR, TEXT, VARCHAR, UUID, INTEGER, TEXT);
DROP FUNCTION IF EXISTS create_ip_asset_with_stages(UUID, VARCHAR, TEXT, VARCHAR, UUID, INTEGER, TEXT, VARCHAR);

-- 2. 创建新的函数，添加状态参数
CREATE OR REPLACE FUNCTION create_ip_asset_with_stages(
    p_user_id UUID,
    p_name VARCHAR,
    p_description TEXT,
    p_type VARCHAR,
    p_original_work_id UUID,
    p_commercial_value INTEGER,
    p_thumbnail TEXT,
    p_status VARCHAR DEFAULT 'pending_review'  -- 新增参数，默认待审核
)
RETURNS UUID AS $$
DECLARE
    v_asset_id UUID;
BEGIN
    -- 创建IP资产，使用传入的状态
    INSERT INTO ip_assets (user_id, name, description, type, original_work_id, commercial_value, thumbnail, status)
    VALUES (p_user_id, p_name, p_description, p_type, p_original_work_id, p_commercial_value, p_thumbnail, p_status)
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

-- 3. 修改 ip_assets 表的默认值（可选，如果希望直接插入时也默认待审核）
-- ALTER TABLE ip_assets ALTER COLUMN status SET DEFAULT 'pending_review';

-- 4. 添加注释
COMMENT ON FUNCTION create_ip_asset_with_stages IS '创建IP资产并初始化孵化阶段，支持设置状态（默认pending_review）';
