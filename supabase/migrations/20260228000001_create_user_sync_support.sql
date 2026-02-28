-- ============================================
-- 用户数据同步支持函数
-- 创建时间：2026-02-28
-- 用途：支持前端用户同步服务的数据同步
-- ============================================

-- 创建用户同步记录表
CREATE TABLE IF NOT EXISTS user_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('profile_update', 'avatar_update', 'settings_update', 'full_sync')),
  sync_data JSONB DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  device_info JSONB DEFAULT '{}'::jsonb,
  ip_address INET
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_sync_logs_user_id ON user_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sync_logs_sync_type ON user_sync_logs(sync_type);
CREATE INDEX IF NOT EXISTS idx_user_sync_logs_synced_at ON user_sync_logs(synced_at);

-- 添加注释
COMMENT ON TABLE user_sync_logs IS '用户数据同步日志表，记录用户数据的同步历史';
COMMENT ON COLUMN user_sync_logs.sync_type IS '同步类型：profile_update(资料更新), avatar_update(头像更新), settings_update(设置更新), full_sync(完整同步)';
COMMENT ON COLUMN user_sync_logs.sync_data IS '同步的数据内容';
COMMENT ON COLUMN user_sync_logs.device_info IS '设备信息';

-- 创建用户数据同步函数
CREATE OR REPLACE FUNCTION sync_user_data(
  p_user_id UUID,
  p_sync_type TEXT,
  p_sync_data JSONB DEFAULT '{}'::jsonb,
  p_device_info JSONB DEFAULT '{}'::jsonb,
  p_ip_address INET DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_sync_id UUID;
  v_updated_fields TEXT[];
  v_result JSONB;
BEGIN
  -- 记录同步日志
  INSERT INTO user_sync_logs (
    user_id,
    sync_type,
    sync_data,
    device_info,
    ip_address
  ) VALUES (
    p_user_id,
    p_sync_type,
    p_sync_data,
    p_device_info,
    p_ip_address
  ) RETURNING id INTO v_sync_id;

  -- 根据同步类型更新用户数据
  IF p_sync_type = 'profile_update' THEN
    -- 更新用户资料
    UPDATE users SET
      username = COALESCE((p_sync_data->>'username')::TEXT, username),
      bio = COALESCE((p_sync_data->>'bio')::TEXT, bio),
      location = COALESCE((p_sync_data->>'location')::TEXT, location),
      website = COALESCE((p_sync_data->>'website')::TEXT, website),
      updated_at = NOW()
    WHERE id = p_user_id;

    -- 提取更新的字段
    v_updated_fields := ARRAY['username', 'bio', 'location', 'website'];

  ELSIF p_sync_type = 'avatar_update' THEN
    -- 更新头像
    UPDATE users SET
      avatar_url = COALESCE((p_sync_data->>'avatar')::TEXT, avatar_url),
      updated_at = NOW()
    WHERE id = p_user_id;

    v_updated_fields := ARRAY['avatar_url'];

  ELSIF p_sync_type = 'settings_update' THEN
    -- 更新用户设置
    UPDATE users SET
      settings = COALESCE(p_sync_data->'settings', settings),
      updated_at = NOW()
    WHERE id = p_user_id;

    v_updated_fields := ARRAY['settings'];

  ELSIF p_sync_type = 'full_sync' THEN
    -- 完整同步：更新所有字段
    UPDATE users SET
      username = COALESCE((p_sync_data->>'username')::TEXT, username),
      bio = COALESCE((p_sync_data->>'bio')::TEXT, bio),
      location = COALESCE((p_sync_data->>'location')::TEXT, location),
      website = COALESCE((p_sync_data->>'website')::TEXT, website),
      avatar_url = COALESCE((p_sync_data->>'avatar')::TEXT, avatar_url),
      settings = COALESCE(p_sync_data->'settings', settings),
      updated_at = NOW()
    WHERE id = p_user_id;

    v_updated_fields := ARRAY['username', 'bio', 'location', 'website', 'avatar_url', 'settings'];
  END IF;

  -- 返回结果
  v_result := jsonb_build_object(
    'success', true,
    'sync_id', v_sync_id,
    'updated_fields', v_updated_fields,
    'synced_at', NOW()
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取用户同步状态函数
CREATE OR REPLACE FUNCTION get_user_sync_status(
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_last_sync TIMESTAMPTZ;
  v_sync_count BIGINT;
  v_pending_updates JSONB;
BEGIN
  -- 获取最后一次同步时间
  SELECT MAX(synced_at) INTO v_last_sync
  FROM user_sync_logs
  WHERE user_id = p_user_id;

  -- 获取同步次数
  SELECT COUNT(*) INTO v_sync_count
  FROM user_sync_logs
  WHERE user_id = p_user_id;

  -- 获取待处理的更新 (如果有)
  SELECT jsonb_agg(latest_sync.sync_data)
  INTO v_pending_updates
  FROM (
    SELECT sync_data
    FROM user_sync_logs
    WHERE user_id = p_user_id
    ORDER BY synced_at DESC
    LIMIT 1
  ) latest_sync;

  RETURN jsonb_build_object(
    'last_sync', v_last_sync,
    'sync_count', v_sync_count,
    'pending_updates', COALESCE(v_pending_updates, '[]'::jsonb),
    'is_synced', v_last_sync IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 清理旧的同步日志 (保留最近 30 天)
CREATE OR REPLACE FUNCTION cleanup_old_sync_logs(
  p_retention_days INTEGER DEFAULT 30
) RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM user_sync_logs
  WHERE synced_at < NOW() - (p_retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 启用行级安全
ALTER TABLE user_sync_logs ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能查看自己的同步日志
CREATE POLICY "Users can view their own sync logs"
  ON user_sync_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 创建策略：用户只能插入自己的同步日志
CREATE POLICY "Users can insert their own sync logs"
  ON user_sync_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 创建策略：只有 admin 可以查看所有同步日志
CREATE POLICY "Admins can view all sync logs"
  ON user_sync_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 创建策略：只有 admin 可以清理同步日志
CREATE POLICY "Admins can cleanup sync logs"
  ON user_sync_logs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 添加注释
COMMENT ON FUNCTION sync_user_data IS '同步用户数据到数据库';
COMMENT ON FUNCTION get_user_sync_status IS '获取用户同步状态';
COMMENT ON FUNCTION cleanup_old_sync_logs IS '清理旧的同步日志';

-- 创建触发器：自动更新用户的 last_synced_at 字段
CREATE OR REPLACE FUNCTION update_user_last_synced()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET updated_at = NEW.synced_at
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_last_synced
  AFTER INSERT ON user_sync_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_synced();

-- ============================================
-- 示例用法
-- ============================================

-- 1. 同步用户资料
-- SELECT sync_user_data(
--   'user-uuid-here'::UUID,
--   'profile_update',
--   '{"username": "newusername", "bio": "New bio"}'::jsonb
-- );

-- 2. 同步头像
-- SELECT sync_user_data(
--   'user-uuid-here'::UUID,
--   'avatar_update',
--   '{"avatar": "https://example.com/avatar.jpg"}'::jsonb
-- );

-- 3. 获取同步状态
-- SELECT get_user_sync_status('user-uuid-here'::UUID);

-- 4. 清理 30 天前的同步日志
-- SELECT cleanup_old_sync_logs(30);
