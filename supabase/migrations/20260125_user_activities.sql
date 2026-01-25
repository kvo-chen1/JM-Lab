-- 20260125_user_activities.sql
-- 创建用户活动日志表，用于记录用户的所有关键操作

CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- e.g., 'login', 'publish_work', 'like_work', 'follow_user', 'update_profile', 'view_page'
    entity_type VARCHAR(50), -- e.g., 'work', 'user', 'page', 'system'
    entity_id VARCHAR(255),
    details JSONB DEFAULT '{}'::jsonb, -- 存储额外信息，如修改前后的值、作品标题等
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加索引以优化查询
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activities_action_type ON user_activities(action_type);

-- 启用 RLS
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- 策略：用户只能查看自己的活动记录
CREATE POLICY "Users can view their own activities" ON user_activities
    FOR SELECT USING (auth.uid() = user_id);

-- 策略：允许用户(或代表用户的后端)插入自己的活动记录
CREATE POLICY "Users can insert their own activities" ON user_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);
