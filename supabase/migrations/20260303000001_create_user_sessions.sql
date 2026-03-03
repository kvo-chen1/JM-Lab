-- 创建用户会话表，用于记录用户在线时间和活跃度
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  duration_minutes INTEGER DEFAULT 0,
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,
  page_views INTEGER DEFAULT 0,
  actions_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_start ON user_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active ON user_sessions(last_active);

-- 创建更新时间戳的触发器
CREATE OR REPLACE FUNCTION update_user_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_sessions ON user_sessions;
CREATE TRIGGER trigger_update_user_sessions
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_sessions_updated_at();

-- 创建 RLS 策略
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- 允许管理员查看所有会话
CREATE POLICY "Admin can view all sessions"
  ON user_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.is_admin = true OR users.role = 'admin')
    )
  );

-- 允许用户查看自己的会话
CREATE POLICY "Users can view own sessions"
  ON user_sessions
  FOR SELECT
  USING (user_id = auth.uid());

-- 允许插入新会话（用于前端记录）
CREATE POLICY "Allow insert sessions"
  ON user_sessions
  FOR INSERT
  WITH CHECK (true);

-- 允许更新自己的会话
CREATE POLICY "Users can update own sessions"
  ON user_sessions
  FOR UPDATE
  USING (user_id = auth.uid());

-- 添加表注释
COMMENT ON TABLE user_sessions IS '用户会话表，记录用户在线时间和活跃度';
COMMENT ON COLUMN user_sessions.session_start IS '会话开始时间';
COMMENT ON COLUMN user_sessions.session_end IS '会话结束时间';
COMMENT ON COLUMN user_sessions.last_active IS '最后活跃时间';
COMMENT ON COLUMN user_sessions.duration_minutes IS '会话持续时间（分钟）';
COMMENT ON COLUMN user_sessions.page_views IS '页面浏览次数';
COMMENT ON COLUMN user_sessions.actions_count IS '用户操作次数';
