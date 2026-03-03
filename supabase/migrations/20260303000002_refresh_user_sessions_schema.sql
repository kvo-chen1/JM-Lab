-- 刷新 user_sessions 表的 schema cache
-- 通过注释变更来触发 PostgREST 重新加载 schema

COMMENT ON TABLE user_sessions IS '用户会话表，记录用户在线时间和活跃度 - 更新时间: 2026-03-03';

-- 确保所有列都存在
DO $$
BEGIN
    -- 检查并添加缺失的列
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_sessions' AND column_name = 'actions_count') THEN
        ALTER TABLE user_sessions ADD COLUMN actions_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_sessions' AND column_name = 'page_views') THEN
        ALTER TABLE user_sessions ADD COLUMN page_views INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_sessions' AND column_name = 'duration_minutes') THEN
        ALTER TABLE user_sessions ADD COLUMN duration_minutes INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_sessions' AND column_name = 'ip_address') THEN
        ALTER TABLE user_sessions ADD COLUMN ip_address INET;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_sessions' AND column_name = 'user_agent') THEN
        ALTER TABLE user_sessions ADD COLUMN user_agent TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_sessions' AND column_name = 'device_type') THEN
        ALTER TABLE user_sessions ADD COLUMN device_type TEXT;
    END IF;
END $$;

-- 重新创建触发器
DROP TRIGGER IF EXISTS trigger_update_user_sessions ON user_sessions;
CREATE TRIGGER trigger_update_user_sessions
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_sessions_updated_at();

-- 通知 PostgREST 刷新 schema cache
NOTIFY pgrst, 'reload schema';
