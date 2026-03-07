-- 创建数据预警规则表
CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  metric_type TEXT NOT NULL CHECK (metric_type IN (
    'users', 'works', 'views', 'likes', 'comments', 'shares',
    'active_users', 'conversion_rate', 'revenue',
    'server_cpu', 'server_memory', 'error_rate', 'response_time'
  )),
  threshold DECIMAL(10, 2) NOT NULL,
  operator TEXT NOT NULL CHECK (operator IN ('gt', 'lt', 'eq', 'gte', 'lte')),
  time_window INTEGER DEFAULT 60,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  enabled BOOLEAN DEFAULT true,
  notify_channels TEXT[] DEFAULT ARRAY['dashboard'],
  notify_targets JSONB DEFAULT '{}'::jsonb,
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
  actual_value DECIMAL(10, 2) NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'ignored')),
  acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolved_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建预警通知日志表
CREATE TABLE IF NOT EXISTS alert_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES alert_records(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('dashboard', 'email', 'sms', 'webhook')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建更新时间戳的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
INSERT INTO alert_rules (name, description, metric_type, threshold, operator, severity, enabled, notify_channels)
VALUES 
  ('用户增长预警', '当用户增长异常时触发', 'users', 100, 'gt', 'warning', true, ARRAY['dashboard']),
  ('作品发布预警', '当作品发布量异常时触发', 'works', 50, 'gt', 'info', true, ARRAY['dashboard']),
  ('服务器CPU预警', '当CPU使用率过高时触发', 'server_cpu', 80, 'gt', 'critical', true, ARRAY['dashboard', 'email']),
  ('错误率预警', '当错误率过高时触发', 'error_rate', 5, 'gt', 'error', true, ARRAY['dashboard', 'email'])
ON CONFLICT DO NOTHING;

SELECT '预警系统创建完成!' as result;
