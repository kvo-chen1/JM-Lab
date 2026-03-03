-- 创建数据预警规则表
CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- 规则名称
  description TEXT, -- 规则描述
  metric_type TEXT NOT NULL CHECK (metric_type IN (
    'users',           -- 用户数
    'works',           -- 作品数
    'views',           -- 浏览量
    'likes',           -- 点赞数
    'comments',        -- 评论数
    'shares',          -- 分享数
    'active_users',    -- 活跃用户
    'conversion_rate', -- 转化率
    'revenue',         -- 收入
    'server_cpu',      -- 服务器CPU
    'server_memory',   -- 服务器内存
    'error_rate',      -- 错误率
    'response_time'    -- 响应时间
  )),
  threshold DECIMAL(10, 2) NOT NULL, -- 阈值
  operator TEXT NOT NULL CHECK (operator IN ('gt', 'lt', 'eq', 'gte', 'lte')), -- 操作符：大于、小于、等于、大于等于、小于等于
  time_window INTEGER DEFAULT 60, -- 时间窗口（分钟）
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')), -- 严重程度
  enabled BOOLEAN DEFAULT true, -- 是否启用
  notify_channels TEXT[] DEFAULT ARRAY['dashboard'], -- 通知渠道：dashboard, email, sms, webhook
  notify_targets JSONB DEFAULT '{}'::jsonb, -- 通知目标配置
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建预警记录表
CREATE TABLE IF NOT EXISTS alert_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  threshold DECIMAL(10, 2) NOT NULL,
  actual_value DECIMAL(10, 2) NOT NULL, -- 实际值
  severity TEXT NOT NULL,
  message TEXT NOT NULL, -- 预警消息
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'ignored')), -- 状态
  acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolved_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb, -- 额外元数据
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建预警通知日志表
CREATE TABLE IF NOT EXISTS alert_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES alert_records(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('dashboard', 'email', 'sms', 'webhook', 'push')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'retrying')),
  recipient TEXT, -- 接收者
  content TEXT, -- 通知内容
  error_message TEXT, -- 错误信息
  sent_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled ON alert_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_alert_rules_metric ON alert_rules(metric_type);
CREATE INDEX IF NOT EXISTS idx_alert_rules_created_by ON alert_rules(created_by);

CREATE INDEX IF NOT EXISTS idx_alert_records_rule_id ON alert_records(rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_records_status ON alert_records(status);
CREATE INDEX IF NOT EXISTS idx_alert_records_severity ON alert_records(severity);
CREATE INDEX IF NOT EXISTS idx_alert_records_created_at ON alert_records(created_at);
CREATE INDEX IF NOT EXISTS idx_alert_records_metric_created ON alert_records(metric_type, created_at);

CREATE INDEX IF NOT EXISTS idx_alert_notifications_alert_id ON alert_notifications(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_status ON alert_notifications(status);

-- 添加注释
COMMENT ON TABLE alert_rules IS '数据预警规则表';
COMMENT ON TABLE alert_records IS '预警记录表';
COMMENT ON TABLE alert_notifications IS '预警通知日志表';

-- 启用 RLS
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY;

-- 创建策略：管理员可以管理所有预警规则
CREATE POLICY "Admins can manage all alert rules"
  ON alert_rules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- 创建策略：管理员可以查看所有预警记录
CREATE POLICY "Admins can view all alert records"
  ON alert_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- 创建策略：管理员可以更新预警记录状态
CREATE POLICY "Admins can update alert records"
  ON alert_records
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- 创建策略：管理员可以查看所有通知日志
CREATE POLICY "Admins can view all alert notifications"
  ON alert_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- 创建更新时间戳触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_alert_rules_updated_at ON alert_rules;
CREATE TRIGGER update_alert_rules_updated_at
  BEFORE UPDATE ON alert_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 创建获取预警统计的函数
CREATE OR REPLACE FUNCTION get_alert_stats(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  total_alerts BIGINT,
  active_alerts BIGINT,
  acknowledged_alerts BIGINT,
  critical_alerts BIGINT,
  warning_alerts BIGINT,
  avg_resolution_time INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_alerts,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT as active_alerts,
    COUNT(*) FILTER (WHERE status = 'acknowledged')::BIGINT as acknowledged_alerts,
    COUNT(*) FILTER (WHERE severity = 'critical')::BIGINT as critical_alerts,
    COUNT(*) FILTER (WHERE severity = 'warning')::BIGINT as warning_alerts,
    AVG(resolved_at - created_at) FILTER (WHERE resolved_at IS NOT NULL) as avg_resolution_time
  FROM alert_records
  WHERE created_at BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建获取活跃预警列表的函数
CREATE OR REPLACE FUNCTION get_active_alerts(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  rule_id UUID,
  rule_name TEXT,
  metric_type TEXT,
  threshold DECIMAL,
  actual_value DECIMAL,
  severity TEXT,
  message TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  time_ago TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ar.id,
    ar.rule_id,
    alr.name as rule_name,
    ar.metric_type,
    ar.threshold,
    ar.actual_value,
    ar.severity,
    ar.message,
    ar.status,
    ar.created_at,
    CASE 
      WHEN ar.created_at > NOW() - INTERVAL '1 minute' THEN '刚刚'
      WHEN ar.created_at > NOW() - INTERVAL '1 hour' THEN EXTRACT(MINUTE FROM NOW() - ar.created_at)::TEXT || '分钟前'
      WHEN ar.created_at > NOW() - INTERVAL '1 day' THEN EXTRACT(HOUR FROM NOW() - ar.created_at)::TEXT || '小时前'
      ELSE EXTRACT(DAY FROM NOW() - ar.created_at)::TEXT || '天前'
    END as time_ago
  FROM alert_records ar
  JOIN alert_rules alr ON ar.rule_id = alr.id
  WHERE ar.status = 'active'
  ORDER BY ar.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 插入默认预警规则
INSERT INTO alert_rules (name, description, metric_type, threshold, operator, time_window, severity, enabled, notify_channels)
VALUES 
  ('用户增长下降预警', '当用户增长率下降超过20%时触发', 'users', -20, 'lt', 60, 'warning', true, ARRAY['dashboard']),
  ('浏览量异常下降', '当浏览量下降超过30%时触发', 'views', -30, 'lt', 60, 'warning', true, ARRAY['dashboard']),
  ('服务器CPU过高', '当服务器CPU使用率超过80%时触发', 'server_cpu', 80, 'gt', 5, 'critical', true, ARRAY['dashboard', 'email']),
  ('错误率过高', '当系统错误率超过5%时触发', 'error_rate', 5, 'gt', 10, 'error', true, ARRAY['dashboard', 'email']),
  ('响应时间过长', '当API响应时间超过2秒时触发', 'response_time', 2000, 'gt', 5, 'warning', true, ARRAY['dashboard'])
ON CONFLICT DO NOTHING;
