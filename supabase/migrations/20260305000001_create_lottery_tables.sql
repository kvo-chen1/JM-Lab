-- 创建转盘活动相关表
-- 包括：lottery_activities, lottery_prizes, lottery_spin_records

-- 1. 转盘活动表
CREATE TABLE IF NOT EXISTS lottery_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'ended')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    spin_cost INTEGER NOT NULL DEFAULT 10,
    daily_limit INTEGER NOT NULL DEFAULT -1,
    total_limit INTEGER NOT NULL DEFAULT -1,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 转盘奖品表
CREATE TABLE IF NOT EXISTS lottery_prizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES lottery_activities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    probability DECIMAL(5,4) NOT NULL CHECK (probability >= 0 AND probability <= 1),
    points INTEGER NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT -1,
    image_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    is_rare BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 抽奖记录表
CREATE TABLE IF NOT EXISTS lottery_spin_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES lottery_activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    prize_id UUID NOT NULL REFERENCES lottery_prizes(id),
    cost INTEGER NOT NULL DEFAULT 0,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_lottery_activities_status ON lottery_activities(status);
CREATE INDEX IF NOT EXISTS idx_lottery_activities_time ON lottery_activities(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_lottery_prizes_activity ON lottery_prizes(activity_id);
CREATE INDEX IF NOT EXISTS idx_lottery_spin_records_activity ON lottery_spin_records(activity_id);
CREATE INDEX IF NOT EXISTS idx_lottery_spin_records_user ON lottery_spin_records(user_id);
CREATE INDEX IF NOT EXISTS idx_lottery_spin_records_time ON lottery_spin_records(created_at);

-- 启用 RLS
ALTER TABLE lottery_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lottery_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lottery_spin_records ENABLE ROW LEVEL SECURITY;

-- RLS 策略（使用 IF NOT EXISTS）

-- lottery_activities 策略
DROP POLICY IF EXISTS "lottery_activities_select_all" ON lottery_activities;
CREATE POLICY "lottery_activities_select_all" ON lottery_activities
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "lottery_activities_insert_admin" ON lottery_activities;
CREATE POLICY "lottery_activities_insert_admin" ON lottery_activities
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "lottery_activities_update_admin" ON lottery_activities;
CREATE POLICY "lottery_activities_update_admin" ON lottery_activities
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "lottery_activities_delete_admin" ON lottery_activities;
CREATE POLICY "lottery_activities_delete_admin" ON lottery_activities
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- lottery_prizes 策略
DROP POLICY IF EXISTS "lottery_prizes_select_all" ON lottery_prizes;
CREATE POLICY "lottery_prizes_select_all" ON lottery_prizes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "lottery_prizes_insert_admin" ON lottery_prizes;
CREATE POLICY "lottery_prizes_insert_admin" ON lottery_prizes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "lottery_prizes_update_admin" ON lottery_prizes;
CREATE POLICY "lottery_prizes_update_admin" ON lottery_prizes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "lottery_prizes_delete_admin" ON lottery_prizes;
CREATE POLICY "lottery_prizes_delete_admin" ON lottery_prizes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- lottery_spin_records 策略
DROP POLICY IF EXISTS "lottery_spin_records_select_own" ON lottery_spin_records;
CREATE POLICY "lottery_spin_records_select_own" ON lottery_spin_records
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "lottery_spin_records_select_admin" ON lottery_spin_records;
CREATE POLICY "lottery_spin_records_select_admin" ON lottery_spin_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "lottery_spin_records_insert_own" ON lottery_spin_records;
CREATE POLICY "lottery_spin_records_insert_own" ON lottery_spin_records
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 创建视图：带用户信息的抽奖记录
CREATE OR REPLACE VIEW lottery_spin_records_with_users AS
SELECT 
    r.*,
    a.name as activity_name,
    p.name as prize_name,
    p.points as prize_points,
    u.username,
    u.avatar_url as avatar
FROM lottery_spin_records r
JOIN lottery_activities a ON r.activity_id = a.id
JOIN lottery_prizes p ON r.prize_id = p.id
LEFT JOIN users u ON r.user_id = u.id;

-- 创建函数：获取活动统计
CREATE OR REPLACE FUNCTION get_lottery_activity_stats(p_activity_id UUID)
RETURNS TABLE (
    total_spins BIGINT,
    total_participants BIGINT,
    total_cost BIGINT,
    win_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_spins,
        COUNT(DISTINCT user_id)::BIGINT as total_participants,
        SUM(cost)::BIGINT as total_cost,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(CASE WHEN p.points > 0 THEN 1 END)::DECIMAL / COUNT(*) * 100)
            ELSE 0
        END as win_rate
    FROM lottery_spin_records r
    JOIN lottery_prizes p ON r.prize_id = p.id
    WHERE r.activity_id = p_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数：获取每日统计
CREATE OR REPLACE FUNCTION get_lottery_daily_stats(p_activity_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    date DATE,
    spins BIGINT,
    participants BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(created_at) as date,
        COUNT(*)::BIGINT as spins,
        COUNT(DISTINCT user_id)::BIGINT as participants
    FROM lottery_spin_records
    WHERE activity_id = p_activity_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY DATE(created_at)
    ORDER BY date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数：获取小时统计
CREATE OR REPLACE FUNCTION get_lottery_hourly_stats(p_activity_id UUID)
RETURNS TABLE (
    hour INTEGER,
    spins BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(HOUR FROM created_at)::INTEGER as hour,
        COUNT(*)::BIGINT as spins
    FROM lottery_spin_records
    WHERE activity_id = p_activity_id
    AND created_at >= NOW() - INTERVAL '7 days'
    GROUP BY EXTRACT(HOUR FROM created_at)
    ORDER BY hour;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数：获取热门奖品
CREATE OR REPLACE FUNCTION get_lottery_top_prizes(p_activity_id UUID, p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
    prize_id UUID,
    name VARCHAR,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as prize_id,
        p.name,
        COUNT(r.id)::BIGINT as count
    FROM lottery_prizes p
    LEFT JOIN lottery_spin_records r ON p.id = r.prize_id
    WHERE p.activity_id = p_activity_id
    GROUP BY p.id, p.name
    ORDER BY count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加注释
COMMENT ON TABLE lottery_activities IS '转盘活动表';
COMMENT ON TABLE lottery_prizes IS '转盘奖品表';
COMMENT ON TABLE lottery_spin_records IS '用户抽奖记录表';
