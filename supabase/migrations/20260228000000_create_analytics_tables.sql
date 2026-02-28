-- 如果表已存在，先删除（谨慎操作！）
DROP TABLE IF EXISTS user_behavior_logs CASCADE;
DROP TABLE IF EXISTS conversion_events CASCADE;

-- 创建用户行为日志表
CREATE TABLE user_behavior_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN (
    'view_work', 'click_work', 'like_work', 'collect_work', 
    'share_work', 'comment_work', 'purchase_work', 'view_promoted', 'click_promoted'
  )),
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  promoted_work_id UUID REFERENCES promoted_works(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_behavior_logs_user_id ON user_behavior_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_logs_action ON user_behavior_logs(action);
CREATE INDEX IF NOT EXISTS idx_user_behavior_logs_work_id ON user_behavior_logs(work_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_logs_promoted_work_id ON user_behavior_logs(promoted_work_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_logs_created_at ON user_behavior_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_behavior_logs_user_created ON user_behavior_logs(user_id, created_at);

-- 添加注释
COMMENT ON TABLE user_behavior_logs IS '用户行为日志表，记录用户的所有交互行为';
COMMENT ON COLUMN user_behavior_logs.action IS '行为类型：view_work(浏览作品), click_work(点击作品), like_work(点赞), collect_work(收藏), share_work(分享), comment_work(评论), purchase_work(购买), view_promoted(查看推广), click_promoted(点击推广)';
COMMENT ON COLUMN user_behavior_logs.metadata IS '额外元数据，如停留时长、来源页面等';

-- 创建转化事件表
CREATE TABLE conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  promoted_work_id UUID NOT NULL REFERENCES promoted_works(id) ON DELETE CASCADE,
  conversion_type TEXT NOT NULL CHECK (conversion_type IN ('purchase', 'signup', 'download', 'share', 'follow')),
  conversion_value DECIMAL(10,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_conversion_events_user_id ON conversion_events(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_promoted_work_id ON conversion_events(promoted_work_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_type ON conversion_events(conversion_type);
CREATE INDEX IF NOT EXISTS idx_conversion_events_created_at ON conversion_events(created_at);

-- 添加注释
COMMENT ON TABLE conversion_events IS '转化事件表，记录用户通过推广产生的转化行为';
COMMENT ON COLUMN conversion_events.conversion_type IS '转化类型：purchase(购买), signup(注册), download(下载), share(分享), follow(关注)';
COMMENT ON COLUMN conversion_events.conversion_value IS '转化价值，如订单金额';
COMMENT ON COLUMN conversion_events.metadata IS '额外元数据，如订单 ID、商品详情等';

-- 创建实时统计视图（最近 5 分钟活跃用户）
CREATE OR REPLACE VIEW active_users_5min AS
SELECT 
  COUNT(DISTINCT user_id) as active_count
FROM user_behavior_logs
WHERE created_at >= NOW() - INTERVAL '5 minutes';

-- 创建实时统计视图（每小时统计）
CREATE OR REPLACE VIEW hourly_stats AS
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  action,
  COUNT(*) as count
FROM user_behavior_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), action
ORDER BY hour DESC;

-- 授予权限
ALTER TABLE user_behavior_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;

-- 允许 authenticated 用户插入自己的行为日志
CREATE POLICY "Users can insert their own behavior logs"
  ON user_behavior_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 允许 authenticated 用户查看自己的行为日志
CREATE POLICY "Users can view their own behavior logs"
  ON user_behavior_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 允许 authenticated 用户插入自己的转化事件
CREATE POLICY "Users can insert their own conversion events"
  ON conversion_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 允许 admin 角色查看所有分析数据
CREATE POLICY "Admins can view all behavior logs"
  ON user_behavior_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all conversion events"
  ON conversion_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
