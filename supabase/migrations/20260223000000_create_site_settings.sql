-- 创建 site_settings 表用于存储系统设置
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);
CREATE INDEX IF NOT EXISTS idx_site_settings_category ON site_settings(category);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_site_settings_updated_at();

-- 创建设置变更历史表
CREATE TABLE IF NOT EXISTS settings_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 策略
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_history ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取设置
CREATE POLICY "Allow public read on site_settings"
  ON site_settings FOR SELECT
  USING (true);

-- 只有管理员可以修改设置
CREATE POLICY "Allow admin write on site_settings"
  ON site_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- 允许管理员查看历史
CREATE POLICY "Allow admin read on settings_history"
  ON settings_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- 插入默认设置
INSERT INTO site_settings (key, value, category, description) VALUES
  ('site_name', '创作者社区', 'general', '网站名称'),
  ('site_description', '一个为创作者打造的社区平台', 'general', '网站描述'),
  ('site_keywords', '创作者,社区,设计,开发,创意', 'general', '网站关键词'),
  ('contact_email', 'admin@example.com', 'general', '联系邮箱'),
  ('enable_registration', 'true', 'features', '是否开放注册'),
  ('enable_comments', 'true', 'features', '是否开启评论'),
  ('enable_likes', 'true', 'features', '是否开启点赞'),
  ('enable_shares', 'true', 'features', '是否开启分享'),
  ('posts_per_page', '20', 'display', '每页帖子数'),
  ('max_upload_size', '10485760', 'upload', '最大上传大小(字节)'),
  ('allowed_file_types', 'jpg,jpeg,png,gif,mp4,pdf', 'upload', '允许的文件类型'),
  ('points_post_create', '10', 'points', '发帖获得积分'),
  ('points_comment_create', '5', 'points', '评论获得积分'),
  ('points_like_receive', '2', 'points', '被点赞获得积分'),
  ('points_follow', '1', 'points', '关注获得积分')
ON CONFLICT (key) DO NOTHING;
