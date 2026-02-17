-- 添加获取用户IP资产列表的RPC函数
-- 解决RLS策略导致前端无法直接查询的问题

-- ============================================
-- 获取用户的IP资产列表（包含阶段信息）
-- ============================================
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

-- 添加函数注释
COMMENT ON FUNCTION get_user_ip_assets(UUID) IS '获取指定用户的所有IP资产列表，包含阶段信息。使用SECURITY DEFINER绕过RLS策略。';
