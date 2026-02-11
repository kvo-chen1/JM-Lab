-- IP孵化中心 RPC 函数
-- 这些函数需要在 Supabase SQL Editor 中手动执行
-- 因为包含 PL/pgSQL 代码块，无法通过普通迁移工具执行

-- ============================================
-- 1. 获取用户的IP统计
-- ============================================
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

-- ============================================
-- 2. 创建IP资产并初始化阶段
-- ============================================
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

-- ============================================
-- 3. 获取IP资产详情（包含阶段信息）
-- ============================================
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

-- ============================================
-- 4. 更新阶段完成状态
-- ============================================
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
