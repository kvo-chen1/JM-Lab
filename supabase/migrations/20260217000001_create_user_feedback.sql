-- 创建用户反馈表
CREATE TABLE IF NOT EXISTS user_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('bug', 'feature', 'complaint', 'inquiry', 'other')),
    title VARCHAR(200),
    content TEXT NOT NULL,
    contact_info VARCHAR(255),
    contact_type VARCHAR(20) CHECK (contact_type IN ('email', 'phone', 'wechat', 'other')),
    screenshots TEXT[] DEFAULT '{}',
    device_info JSONB,
    browser_info VARCHAR(255),
    page_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'resolved', 'rejected', 'closed')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to UUID REFERENCES admin_accounts(id) ON DELETE SET NULL,
    response_content TEXT,
    responded_at TIMESTAMPTZ,
    responded_by UUID REFERENCES admin_accounts(id) ON DELETE SET NULL,
    is_notified BOOLEAN DEFAULT false,
    notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建反馈处理日志表
CREATE TABLE IF NOT EXISTS feedback_process_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID REFERENCES user_feedbacks(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES admin_accounts(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建用户通知表
CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    related_id UUID,
    related_type VARCHAR(50),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建更新时间触发器
DROP TRIGGER IF EXISTS update_user_feedbacks_updated_at ON user_feedbacks;
CREATE TRIGGER update_user_feedbacks_updated_at
    BEFORE UPDATE ON user_feedbacks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 启用RLS
ALTER TABLE user_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_process_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- 用户只能看到自己的反馈
CREATE POLICY "用户查看自己的反馈" ON user_feedbacks
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM admin_accounts
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- 用户可以提交反馈
CREATE POLICY "用户提交反馈" ON user_feedbacks
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR auth.uid() IS NULL
    );

-- 管理员可以管理所有反馈
CREATE POLICY "管理员管理反馈" ON user_feedbacks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_accounts aa
            JOIN admin_roles ar ON aa.role_id = ar.id
            WHERE aa.user_id = auth.uid()
            AND aa.status = 'active'
            AND (ar.permissions @> '[{"permission": "feedback:manage"}]'::jsonb
                 OR ar.permissions @> '[{"permission": "admin:manage"}]'::jsonb)
        )
    );

-- 处理日志查看策略
CREATE POLICY "管理员查看处理日志" ON feedback_process_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_accounts
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- 用户只能看到自己的通知
CREATE POLICY "用户查看自己的通知" ON user_notifications
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- 用户更新自己的通知（标记已读）
CREATE POLICY "用户更新自己的通知" ON user_notifications
    FOR UPDATE USING (
        auth.uid() = user_id
    );

-- 系统可以插入通知
CREATE POLICY "系统插入通知" ON user_notifications
    FOR INSERT WITH CHECK (true);

-- 创建索引
CREATE INDEX idx_user_feedbacks_user_id ON user_feedbacks(user_id);
CREATE INDEX idx_user_feedbacks_status ON user_feedbacks(status);
CREATE INDEX idx_user_feedbacks_type ON user_feedbacks(type);
CREATE INDEX idx_user_feedbacks_priority ON user_feedbacks(priority);
CREATE INDEX idx_user_feedbacks_created_at ON user_feedbacks(created_at DESC);
CREATE INDEX idx_user_feedbacks_assigned_to ON user_feedbacks(assigned_to);
CREATE INDEX idx_feedback_process_logs_feedback_id ON feedback_process_logs(feedback_id);
CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_is_read ON user_notifications(is_read);

-- 创建获取反馈统计的函数
CREATE OR REPLACE FUNCTION get_feedback_stats()
RETURNS TABLE (
    total_count BIGINT,
    pending_count BIGINT,
    processing_count BIGINT,
    resolved_count BIGINT,
    today_count BIGINT,
    avg_process_hours NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_count,
        COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_count,
        COUNT(*) FILTER (WHERE status = 'processing')::BIGINT as processing_count,
        COUNT(*) FILTER (WHERE status = 'resolved')::BIGINT as resolved_count,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::BIGINT as today_count,
        ROUND(AVG(EXTRACT(EPOCH FROM (responded_at - created_at)) / 3600)::NUMERIC, 2) as avg_process_hours
    FROM user_feedbacks;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建记录反馈处理日志的函数
CREATE OR REPLACE FUNCTION log_feedback_process(
    p_feedback_id UUID,
    p_admin_id UUID,
    p_action VARCHAR,
    p_old_value TEXT DEFAULT NULL,
    p_new_value TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO feedback_process_logs (feedback_id, admin_id, action, old_value, new_value, details)
    VALUES (p_feedback_id, p_admin_id, p_action, p_old_value, p_new_value, p_details)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建发送用户通知的函数
CREATE OR REPLACE FUNCTION send_user_notification(
    p_user_id UUID,
    p_type VARCHAR,
    p_title VARCHAR,
    p_content TEXT,
    p_related_id UUID DEFAULT NULL,
    p_related_type VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO user_notifications (user_id, type, title, content, related_id, related_type)
    VALUES (p_user_id, p_type, p_title, p_content, p_related_id, p_related_type)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建反馈提交后的触发器（可选：发送邮件通知管理员）
CREATE OR REPLACE FUNCTION on_feedback_created()
RETURNS TRIGGER AS $$
BEGIN
    -- 记录创建日志
    INSERT INTO feedback_process_logs (feedback_id, action, new_value, details)
    VALUES (
        NEW.id,
        'created',
        NEW.status,
        jsonb_build_object('type', NEW.type, 'user_id', NEW.user_id)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_feedback_created ON user_feedbacks;
CREATE TRIGGER trigger_feedback_created
    AFTER INSERT ON user_feedbacks
    FOR EACH ROW
    EXECUTE FUNCTION on_feedback_created();
