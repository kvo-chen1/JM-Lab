-- 创建积分规则表
CREATE TABLE IF NOT EXISTS points_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  daily_limit INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_points_rules_action ON points_rules(action);
CREATE INDEX IF NOT EXISTS idx_points_rules_enabled ON points_rules(enabled);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_points_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_points_rules_updated_at
  BEFORE UPDATE ON points_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_points_rules_updated_at();

-- RLS 策略
ALTER TABLE points_rules ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取积分规则
CREATE POLICY "Allow public read on points_rules"
  ON points_rules FOR SELECT
  USING (true);

-- 只有管理员可以修改积分规则
CREATE POLICY "Allow admin write on points_rules"
  ON points_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- 插入默认积分规则
INSERT INTO points_rules (action, description, points, daily_limit, enabled) VALUES
  ('daily_checkin', '每日签到', 10, 1, true),
  ('create_post', '发布帖子', 20, 5, true),
  ('like_content', '点赞内容', 2, 50, true),
  ('comment', '发表评论', 5, 20, true),
  ('share_content', '分享内容', 10, 10, true),
  ('invite_friend', '邀请好友', 100, 0, true),
  ('complete_profile', '完善资料', 50, 1, true),
  ('work_adopted', '作品被采纳', 500, 0, true)
ON CONFLICT (action) DO NOTHING;
