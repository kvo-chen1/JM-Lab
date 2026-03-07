-- 创建缺失的 get_user_ip_stats RPC 函数
-- 执行: psql $DATABASE_URL -f create-ip-stats-function.sql

-- 获取用户IP统计信息的函数
CREATE OR REPLACE FUNCTION get_user_ip_stats(p_user_id TEXT)
RETURNS TABLE (
    total_assets BIGINT,
    completed_assets BIGINT,
    in_progress_assets BIGINT,
    total_partnerships BIGINT,
    active_partnerships BIGINT,
    total_estimated_value DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- 总IP资产数
        COUNT(DISTINCT a.id)::BIGINT as total_assets,
        -- 已完成的IP资产数（所有阶段都完成）
        COUNT(DISTINCT CASE 
            WHEN NOT EXISTS (
                SELECT 1 FROM ip_stages s 
                WHERE s.ip_asset_id = a.id AND s.completed = FALSE
            ) AND EXISTS (
                SELECT 1 FROM ip_stages s 
                WHERE s.ip_asset_id = a.id
            ) THEN a.id 
        END)::BIGINT as completed_assets,
        -- 进行中的IP资产数（有未完成的阶段）
        COUNT(DISTINCT CASE 
            WHEN EXISTS (
                SELECT 1 FROM ip_stages s 
                WHERE s.ip_asset_id = a.id AND s.completed = FALSE
            ) THEN a.id 
        END)::BIGINT as in_progress_assets,
        -- 总合作数
        COUNT(DISTINCT p.id)::BIGINT as total_partnerships,
        -- 活跃合作数
        COUNT(DISTINCT CASE 
            WHEN p.status IN ('approved', 'negotiating', 'pending') THEN p.id 
        END)::BIGINT as active_partnerships,
        -- 总估计价值
        COALESCE(SUM(a.commercial_value), 0)::DECIMAL as total_estimated_value
    FROM ip_assets a
    LEFT JOIN ip_partnerships p ON a.id = p.ip_asset_id
    WHERE a.user_id = p_user_id::UUID
      AND a.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加注释
COMMENT ON FUNCTION get_user_ip_stats(TEXT) IS '获取指定用户的IP资产统计信息，包括资产数量、完成状态、合作数量等。使用SECURITY DEFINER绕过RLS策略。';

-- 检查 ip_partnerships 表是否存在，如果不存在则创建
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'ip_partnerships'
    ) THEN
        CREATE TABLE ip_partnerships (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            ip_asset_id UUID NOT NULL REFERENCES ip_assets(id) ON DELETE CASCADE,
            brand_id UUID,
            brand_name TEXT,
            description TEXT,
            reward TEXT,
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- 创建索引
        CREATE INDEX idx_ip_partnerships_ip_asset_id ON ip_partnerships(ip_asset_id);
        CREATE INDEX idx_ip_partnerships_status ON ip_partnerships(status);
        
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
        
        RAISE NOTICE 'Created ip_partnerships table';
    ELSE
        RAISE NOTICE 'ip_partnerships table already exists';
    END IF;
END $$;

-- ==========================================================================
-- 完成
-- ==========================================================================
