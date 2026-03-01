-- ============================================
-- 第四阶段：A/B测试框架数据库表结构
-- ============================================

-- 实验表
CREATE TABLE IF NOT EXISTS ab_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft',           -- draft, running, paused, completed
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    traffic_allocation DECIMAL(4,3) DEFAULT 0.1,   -- 实验流量占比 (0-1)
    variants JSONB NOT NULL,                       -- 变体配置数组
    metrics JSONB NOT NULL,                        -- 指标配置数组
    targeting_rules JSONB,                         -- 定向规则
    owner_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_ab_experiments_status ON ab_experiments(status);
CREATE INDEX idx_ab_experiments_start_time ON ab_experiments(start_time);
CREATE INDEX idx_ab_experiments_owner ON ab_experiments(owner_id);

-- 用户实验分配表
CREATE TABLE IF NOT EXISTS ab_user_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL,                      -- 变体ID（在variants JSON中）
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    consistent BOOLEAN DEFAULT true,               -- 是否保持分配一致性
    UNIQUE(user_id, experiment_id)
);

CREATE INDEX idx_ab_user_assignments_user ON ab_user_assignments(user_id);
CREATE INDEX idx_ab_user_assignments_experiment ON ab_user_assignments(experiment_id);
CREATE INDEX idx_ab_user_assignments_variant ON ab_user_assignments(variant_id);

-- 指标数据表
CREATE TABLE IF NOT EXISTS ab_metric_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_id UUID NOT NULL,                       -- 指标ID（在metrics JSON中）
    value DECIMAL(15,4) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB,                                -- 额外元数据
    UNIQUE(experiment_id, user_id, metric_id, timestamp)
);

CREATE INDEX idx_ab_metric_data_experiment ON ab_metric_data(experiment_id);
CREATE INDEX idx_ab_metric_data_variant ON ab_metric_data(variant_id);
CREATE INDEX idx_ab_metric_data_user ON ab_metric_data(user_id);
CREATE INDEX idx_ab_metric_data_metric ON ab_metric_data(metric_id);
CREATE INDEX idx_ab_metric_data_timestamp ON ab_metric_data(timestamp);

-- 实验结果快照表
CREATE TABLE IF NOT EXISTS ab_experiment_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    variant_results JSONB NOT NULL,                -- 各变体结果
    total_sample_size INTEGER,
    duration_days INTEGER,
    has_significant_result BOOLEAN DEFAULT false,
    winner_variant_id UUID,
    confidence_level DECIMAL(4,3) DEFAULT 0.95,
    is_final_result BOOLEAN DEFAULT false          -- 是否为最终结果
);

CREATE INDEX idx_ab_experiment_results_experiment ON ab_experiment_results(experiment_id);
CREATE INDEX idx_ab_experiment_results_calculated ON ab_experiment_results(calculated_at);

-- 实验事件日志表（用于详细分析）
CREATE TABLE IF NOT EXISTS ab_experiment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,               -- exposure, conversion, etc.
    event_name VARCHAR(255),                       -- 具体事件名
    event_data JSONB,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ab_experiment_events_experiment ON ab_experiment_events(experiment_id);
CREATE INDEX idx_ab_experiment_events_variant ON ab_experiment_events(variant_id);
CREATE INDEX idx_ab_experiment_events_user ON ab_experiment_events(user_id);
CREATE INDEX idx_ab_experiment_events_type ON ab_experiment_events(event_type);
CREATE INDEX idx_ab_experiment_events_created ON ab_experiment_events(created_at);

-- 更新时间戳触发器
CREATE OR REPLACE FUNCTION update_ab_experiments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ab_experiments_updated_at ON ab_experiments;
CREATE TRIGGER trigger_ab_experiments_updated_at
    BEFORE UPDATE ON ab_experiments
    FOR EACH ROW EXECUTE FUNCTION update_ab_experiments_updated_at();

-- 启用RLS
ALTER TABLE ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_user_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_metric_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_experiment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_experiment_events ENABLE ROW LEVEL SECURITY;

-- 创建访问策略
-- 实验管理：只有所有者和管理员可以修改
CREATE POLICY ab_experiments_owner_policy ON ab_experiments
    FOR ALL USING (
        auth.uid() = owner_id OR
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 实验查看：运行中的实验对所有人可见
CREATE POLICY ab_experiments_view_policy ON ab_experiments
    FOR SELECT USING (
        status = 'running' OR
        auth.uid() = owner_id OR
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 用户分配：用户只能查看自己的分配
CREATE POLICY ab_user_assignments_owner_policy ON ab_user_assignments
    FOR SELECT USING (auth.uid() = user_id);

-- 服务层可以管理用户分配
CREATE POLICY ab_user_assignments_service_policy ON ab_user_assignments
    FOR ALL USING (true);

-- 指标数据：服务层管理
CREATE POLICY ab_metric_data_service_policy ON ab_metric_data
    FOR ALL USING (true);

-- 实验结果：所有人可查看
CREATE POLICY ab_experiment_results_view_policy ON ab_experiment_results
    FOR SELECT USING (true);

-- 实验事件：服务层管理
CREATE POLICY ab_experiment_events_service_policy ON ab_experiment_events
    FOR ALL USING (true);

-- ============================================
-- A/B测试统计视图
-- ============================================

-- 实验概览视图
CREATE OR REPLACE VIEW ab_experiment_overview AS
SELECT 
    e.id,
    e.name,
    e.description,
    e.status,
    e.start_time,
    e.end_time,
    e.traffic_allocation,
    jsonb_array_length(e.variants) as variant_count,
    jsonb_array_length(e.metrics) as metric_count,
    (SELECT COUNT(*) FROM ab_user_assignments WHERE experiment_id = e.id) as total_assignments,
    (SELECT COUNT(DISTINCT user_id) FROM ab_metric_data WHERE experiment_id = e.id) as active_users,
    EXTRACT(DAY FROM COALESCE(e.end_time, NOW()) - e.start_time) as duration_days,
    e.created_at,
    e.updated_at
FROM ab_experiments e
ORDER BY e.created_at DESC;

-- 变体性能视图
CREATE OR REPLACE VIEW ab_variant_performance AS
SELECT 
    e.id as experiment_id,
    e.name as experiment_name,
    v.variant->>'id' as variant_id,
    v.variant->>'name' as variant_name,
    (v.variant->>'isControl')::boolean as is_control,
    (v.variant->>'trafficPercentage')::decimal as traffic_percentage,
    COUNT(DISTINCT a.user_id) as assigned_users,
    COUNT(DISTINCT m.user_id) as active_users,
    COALESCE(SUM(m.value), 0) as total_value,
    CASE 
        WHEN COUNT(DISTINCT m.user_id) > 0 
        THEN COALESCE(SUM(m.value), 0) / COUNT(DISTINCT m.user_id)
        ELSE 0 
    END as avg_value_per_user
FROM ab_experiments e
CROSS JOIN LATERAL jsonb_array_elements(e.variants) as v(variant)
LEFT JOIN ab_user_assignments a ON e.id = a.experiment_id AND a.variant_id = (v.variant->>'id')::uuid
LEFT JOIN ab_metric_data m ON e.id = m.experiment_id AND m.variant_id = (v.variant->>'id')::uuid
WHERE e.status = 'running'
GROUP BY e.id, e.name, v.variant;

-- 指标趋势视图（按天聚合）
CREATE OR REPLACE VIEW ab_metric_daily_trends AS
SELECT 
    m.experiment_id,
    e.name as experiment_name,
    m.variant_id,
    v.variant->>'name' as variant_name,
    metric.metric->>'id' as metric_id,
    metric.metric->>'name' as metric_name,
    DATE_TRUNC('day', m.timestamp) as date,
    COUNT(*) as event_count,
    COUNT(DISTINCT m.user_id) as unique_users,
    SUM(m.value) as total_value,
    AVG(m.value) as avg_value
FROM ab_metric_data m
JOIN ab_experiments e ON m.experiment_id = e.id
CROSS JOIN LATERAL jsonb_array_elements(e.variants) as v(variant)
CROSS JOIN LATERAL jsonb_array_elements(e.metrics) as metric(metric)
WHERE v.variant->>'id' = m.variant_id::text
  AND metric.metric->>'id' = m.metric_id::text
GROUP BY m.experiment_id, e.name, m.variant_id, v.variant, metric.metric, DATE_TRUNC('day', m.timestamp)
ORDER BY date DESC;

-- 实验显著性检验视图
CREATE OR REPLACE VIEW ab_experiment_significance AS
WITH control_stats AS (
    SELECT 
        m.experiment_id,
        metric.metric->>'id' as metric_id,
        AVG(m.value) as control_mean,
        STDDEV(m.value) as control_std,
        COUNT(DISTINCT m.user_id) as control_sample
    FROM ab_metric_data m
    JOIN ab_experiments e ON m.experiment_id = e.id
    CROSS JOIN LATERAL jsonb_array_elements(e.variants) as v(variant)
    CROSS JOIN LATERAL jsonb_array_elements(e.metrics) as metric(metric)
    WHERE (variant->>'isControl')::boolean = true
      AND v.variant->>'id' = m.variant_id::text
      AND metric.metric->>'id' = m.metric_id::text
    GROUP BY m.experiment_id, metric.metric
),
variant_stats AS (
    SELECT 
        m.experiment_id,
        m.variant_id,
        metric.metric->>'id' as metric_id,
        AVG(m.value) as variant_mean,
        STDDEV(m.value) as variant_std,
        COUNT(DISTINCT m.user_id) as variant_sample
    FROM ab_metric_data m
    JOIN ab_experiments e ON m.experiment_id = e.id
    CROSS JOIN LATERAL jsonb_array_elements(e.variants) as v(variant)
    CROSS JOIN LATERAL jsonb_array_elements(e.metrics) as metric(metric)
    WHERE (variant->>'isControl')::boolean = false
      AND v.variant->>'id' = m.variant_id::text
      AND metric.metric->>'id' = m.metric_id::text
    GROUP BY m.experiment_id, m.variant_id, metric.metric
)
SELECT 
    vs.experiment_id,
    e.name as experiment_name,
    vs.variant_id,
    v.variant->>'name' as variant_name,
    vs.metric_id,
    metric.metric->>'name' as metric_name,
    cs.control_mean,
    vs.variant_mean,
    ((vs.variant_mean - cs.control_mean) / NULLIF(cs.control_mean, 0)) * 100 as relative_improvement_pct,
    vs.variant_sample,
    cs.control_sample,
    -- 简化的z-score计算
    CASE 
        WHEN cs.control_std > 0 AND vs.variant_std > 0 THEN
            (vs.variant_mean - cs.control_mean) / 
            SQRT(POWER(cs.control_std, 2) / cs.control_sample + POWER(vs.variant_std, 2) / vs.variant_sample)
        ELSE NULL
    END as z_score,
    CASE 
        WHEN cs.control_std > 0 AND vs.variant_std > 0 THEN
            2 * (1 - CDF_NORMAL(ABS(
                (vs.variant_mean - cs.control_mean) / 
                SQRT(POWER(cs.control_std, 2) / cs.control_sample + POWER(vs.variant_std, 2) / vs.variant_sample)
            )))
        ELSE NULL
    END as p_value,
    CASE 
        WHEN cs.control_std > 0 AND vs.variant_std > 0 THEN
            ABS((vs.variant_mean - cs.control_mean) / 
            SQRT(POWER(cs.control_std, 2) / cs.control_sample + POWER(vs.variant_std, 2) / vs.variant_sample)) > 1.96
        ELSE false
    END as is_significant_95
FROM variant_stats vs
JOIN control_stats cs ON vs.experiment_id = cs.experiment_id AND vs.metric_id = cs.metric_id
JOIN ab_experiments e ON vs.experiment_id = e.id
CROSS JOIN LATERAL jsonb_array_elements(e.variants) as v(variant)
CROSS JOIN LATERAL jsonb_array_elements(e.metrics) as metric(metric)
WHERE v.variant->>'id' = vs.variant_id::text
  AND metric.metric->>'id' = vs.metric_id::text;

-- 辅助函数：标准正态分布CDF
CREATE OR REPLACE FUNCTION CDF_NORMAL(x DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    t DECIMAL;
    d DECIMAL;
    prob DECIMAL;
BEGIN
    t := 1 / (1 + 0.2316419 * ABS(x));
    d := 0.3989423 * EXP(-x * x / 2);
    prob := d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    RETURN CASE WHEN x > 0 THEN 1 - prob ELSE prob END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 样本量计算函数
CREATE OR REPLACE FUNCTION calculate_required_sample_size(
    baseline_conversion DECIMAL,
    mde DECIMAL,
    power DECIMAL DEFAULT 0.8,
    alpha DECIMAL DEFAULT 0.05
)
RETURNS INTEGER AS $$
DECLARE
    z_alpha DECIMAL;
    z_beta DECIMAL;
    p1 DECIMAL;
    p2 DECIMAL;
    p_avg DECIMAL;
    n INTEGER;
BEGIN
    -- 使用近似值
    z_alpha := 1.96;  -- 95%置信水平
    z_beta := 0.84;   -- 80%统计功效
    
    p1 := baseline_conversion;
    p2 := baseline_conversion * (1 + mde);
    p_avg := (p1 + p2) / 2;
    
    n := CEIL(
        (2 * p_avg * (1 - p_avg) * POWER(z_alpha + z_beta, 2)) / POWER(p2 - p1, 2)
    );
    
    RETURN n;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON TABLE ab_experiments IS 'A/B测试实验配置表';
COMMENT ON TABLE ab_user_assignments IS '用户实验变体分配表';
COMMENT ON TABLE ab_metric_data IS '实验指标数据表';
COMMENT ON TABLE ab_experiment_results IS '实验结果快照表';
COMMENT ON TABLE ab_experiment_events IS '实验事件日志表';
