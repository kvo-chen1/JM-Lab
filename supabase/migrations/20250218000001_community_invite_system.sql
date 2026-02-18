-- 社群邀请与申请系统数据库表结构
-- 津脉社区平台

-- ============================================
-- 1. 社群成员邀请表
-- ============================================
CREATE TABLE IF NOT EXISTS community_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    inviter_id TEXT NOT NULL, -- 邀请人ID
    invitee_id TEXT, -- 被邀请人ID（如果通过用户ID邀请）
    invitee_email VARCHAR(255), -- 被邀请人邮箱（如果通过邮箱邀请）
    invitee_phone VARCHAR(50), -- 被邀请人手机号（如果通过手机号邀请）
    invite_code VARCHAR(20) UNIQUE, -- 邀请码（用于链接邀请）
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
    message TEXT, -- 邀请附言
    expires_at TIMESTAMP WITH TIME ZONE, -- 邀请过期时间
    accepted_at TIMESTAMP WITH TIME ZONE, -- 接受时间
    rejected_at TIMESTAMP WITH TIME ZONE, -- 拒绝时间
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_community_invitations_community_id ON community_invitations(community_id);
CREATE INDEX IF NOT EXISTS idx_community_invitations_inviter_id ON community_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_community_invitations_invitee_id ON community_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_community_invitations_status ON community_invitations(status);
CREATE INDEX IF NOT EXISTS idx_community_invitations_invite_code ON community_invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_community_invitations_created_at ON community_invitations(created_at);

-- ============================================
-- 2. 社群加入申请表
-- ============================================
CREATE TABLE IF NOT EXISTS community_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- 申请人ID
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    reason TEXT, -- 申请理由
    answers JSONB, -- 申请表单答案（JSON格式，支持自定义问题）
    reviewed_by TEXT, -- 审核人ID
    reviewed_at TIMESTAMP WITH TIME ZONE, -- 审核时间
    review_note TEXT, -- 审核备注
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_community_join_requests_community_id ON community_join_requests(community_id);
CREATE INDEX IF NOT EXISTS idx_community_join_requests_user_id ON community_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_community_join_requests_status ON community_join_requests(status);
CREATE INDEX IF NOT EXISTS idx_community_join_requests_created_at ON community_join_requests(created_at);

-- 唯一约束：一个用户对一个社群只能有一个待处理申请
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_request 
ON community_join_requests(community_id, user_id) 
WHERE status = 'pending';

-- ============================================
-- 3. 社群邀请/申请历史记录表
-- ============================================
CREATE TABLE IF NOT EXISTS community_invitation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- 操作人ID
    target_user_id TEXT, -- 目标用户ID
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('invite_sent', 'invite_accepted', 'invite_rejected', 'invite_cancelled', 'invite_expired', 'application_submitted', 'application_approved', 'application_rejected', 'application_cancelled', 'member_joined', 'member_left', 'member_removed')),
    action_detail JSONB, -- 操作详情
    ip_address INET, -- IP地址
    user_agent TEXT, -- 用户代理
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_community_invitation_history_community_id ON community_invitation_history(community_id);
CREATE INDEX IF NOT EXISTS idx_community_invitation_history_user_id ON community_invitation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_community_invitation_history_action_type ON community_invitation_history(action_type);
CREATE INDEX IF NOT EXISTS idx_community_invitation_history_created_at ON community_invitation_history(created_at);

-- ============================================
-- 4. 社群邀请配置表
-- ============================================
CREATE TABLE IF NOT EXISTS community_invite_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL UNIQUE REFERENCES communities(id) ON DELETE CASCADE,
    allow_member_invite BOOLEAN DEFAULT true, -- 是否允许普通成员邀请
    require_admin_approval BOOLEAN DEFAULT false, -- 邀请是否需要管理员审核
    require_application_approval BOOLEAN DEFAULT true, -- 申请是否需要审核
    max_invites_per_day INTEGER DEFAULT 10, -- 每日邀请上限
    max_invites_per_batch INTEGER DEFAULT 20, -- 单次批量邀请上限
    invite_expire_hours INTEGER DEFAULT 168, -- 邀请过期时间（小时，默认7天）
    application_questions JSONB, -- 申请问题（JSON数组）
    welcome_message TEXT, -- 欢迎消息
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. 用户邀请频率限制表（防骚扰）
-- ============================================
CREATE TABLE IF NOT EXISTS user_invite_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    daily_count INTEGER DEFAULT 0,
    weekly_count INTEGER DEFAULT 0,
    monthly_count INTEGER DEFAULT 0,
    last_invite_at TIMESTAMP WITH TIME ZONE,
    reset_daily_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reset_weekly_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reset_monthly_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_invite_rate_limits_user_id ON user_invite_rate_limits(user_id);

-- ============================================
-- 6. 邀请举报表
-- ============================================
CREATE TABLE IF NOT EXISTS invitation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id TEXT NOT NULL, -- 举报人ID
    invitation_id UUID REFERENCES community_invitations(id) ON DELETE SET NULL,
    reported_user_id TEXT NOT NULL, -- 被举报人ID
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'fake', 'other')),
    description TEXT, -- 详细描述
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    resolved_by TEXT, -- 处理人ID
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_invitation_reports_reporter_id ON invitation_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_invitation_reports_reported_user_id ON invitation_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_invitation_reports_community_id ON invitation_reports(community_id);
CREATE INDEX IF NOT EXISTS idx_invitation_reports_status ON invitation_reports(status);

-- ============================================
-- 7. 社群成员角色权限表（扩展）
-- ============================================
-- 扩展 community_members 表的 role 字段约束
ALTER TABLE community_members DROP CONSTRAINT IF EXISTS community_members_role_check;
ALTER TABLE community_members ADD CONSTRAINT community_members_role_check 
CHECK (role IN ('owner', 'admin', 'moderator', 'member'));

-- ============================================
-- 8. 创建触发器函数：自动更新 updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有表创建触发器
DROP TRIGGER IF EXISTS update_community_invitations_updated_at ON community_invitations;
CREATE TRIGGER update_community_invitations_updated_at
    BEFORE UPDATE ON community_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_join_requests_updated_at ON community_join_requests;
CREATE TRIGGER update_community_join_requests_updated_at
    BEFORE UPDATE ON community_join_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_invite_settings_updated_at ON community_invite_settings;
CREATE TRIGGER update_community_invite_settings_updated_at
    BEFORE UPDATE ON community_invite_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_invite_rate_limits_updated_at ON user_invite_rate_limits;
CREATE TRIGGER update_user_invite_rate_limits_updated_at
    BEFORE UPDATE ON user_invite_rate_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invitation_reports_updated_at ON invitation_reports;
CREATE TRIGGER update_invitation_reports_updated_at
    BEFORE UPDATE ON invitation_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. 创建触发器：记录历史日志
-- ============================================
CREATE OR REPLACE FUNCTION log_community_invitation_action()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.status = 'pending' THEN
            INSERT INTO community_invitation_history (
                community_id, user_id, target_user_id, action_type, action_detail
            ) VALUES (
                NEW.community_id, NEW.inviter_id, NEW.invitee_id, 'invite_sent',
                jsonb_build_object('invitation_id', NEW.id, 'method', 
                    CASE 
                        WHEN NEW.invitee_id IS NOT NULL THEN 'user_id'
                        WHEN NEW.invitee_email IS NOT NULL THEN 'email'
                        WHEN NEW.invitee_phone IS NOT NULL THEN 'phone'
                        ELSE 'invite_code'
                    END
                )
            );
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
            INSERT INTO community_invitation_history (
                community_id, user_id, target_user_id, action_type, action_detail
            ) VALUES (
                NEW.community_id, NEW.invitee_id, NEW.invitee_id, 'invite_accepted',
                jsonb_build_object('invitation_id', NEW.id, 'inviter_id', NEW.inviter_id)
            );
        ELSIF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
            INSERT INTO community_invitation_history (
                community_id, user_id, target_user_id, action_type, action_detail
            ) VALUES (
                NEW.community_id, NEW.invitee_id, NEW.invitee_id, 'invite_rejected',
                jsonb_build_object('invitation_id', NEW.id, 'inviter_id', NEW.inviter_id)
            );
        ELSIF OLD.status = 'pending' AND NEW.status = 'cancelled' THEN
            INSERT INTO community_invitation_history (
                community_id, user_id, target_user_id, action_type, action_detail
            ) VALUES (
                NEW.community_id, NEW.inviter_id, NEW.invitee_id, 'invite_cancelled',
                jsonb_build_object('invitation_id', NEW.id)
            );
        ELSIF OLD.status = 'pending' AND NEW.status = 'expired' THEN
            INSERT INTO community_invitation_history (
                community_id, user_id, target_user_id, action_type, action_detail
            ) VALUES (
                NEW.community_id, NEW.inviter_id, NEW.invitee_id, 'invite_expired',
                jsonb_build_object('invitation_id', NEW.id)
            );
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_community_invitation_action ON community_invitations;
CREATE TRIGGER log_community_invitation_action
    AFTER INSERT OR UPDATE ON community_invitations
    FOR EACH ROW EXECUTE FUNCTION log_community_invitation_action();

-- 申请历史记录触发器
CREATE OR REPLACE FUNCTION log_community_join_request_action()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO community_invitation_history (
            community_id, user_id, target_user_id, action_type, action_detail
        ) VALUES (
            NEW.community_id, NEW.user_id, NEW.user_id, 'application_submitted',
            jsonb_build_object('request_id', NEW.id, 'reason', NEW.reason)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
            INSERT INTO community_invitation_history (
                community_id, user_id, target_user_id, action_type, action_detail
            ) VALUES (
                NEW.community_id, NEW.reviewed_by, NEW.user_id, 'application_approved',
                jsonb_build_object('request_id', NEW.id, 'review_note', NEW.review_note)
            );
        ELSIF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
            INSERT INTO community_invitation_history (
                community_id, user_id, target_user_id, action_type, action_detail
            ) VALUES (
                NEW.community_id, NEW.reviewed_by, NEW.user_id, 'application_rejected',
                jsonb_build_object('request_id', NEW.id, 'review_note', NEW.review_note)
            );
        ELSIF OLD.status = 'pending' AND NEW.status = 'cancelled' THEN
            INSERT INTO community_invitation_history (
                community_id, user_id, target_user_id, action_type, action_detail
            ) VALUES (
                NEW.community_id, NEW.user_id, NEW.user_id, 'application_cancelled',
                jsonb_build_object('request_id', NEW.id)
            );
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_community_join_request_action ON community_join_requests;
CREATE TRIGGER log_community_join_request_action
    AFTER INSERT OR UPDATE ON community_join_requests
    FOR EACH ROW EXECUTE FUNCTION log_community_join_request_action();

-- ============================================
-- 10. 创建 RLS 策略
-- ============================================

-- 社群邀请表 RLS
ALTER TABLE community_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_invitations_select_policy ON community_invitations;
CREATE POLICY community_invitations_select_policy ON community_invitations
    FOR SELECT USING (
        inviter_id = auth.uid()::text 
        OR invitee_id = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM community_members 
            WHERE community_id = community_invitations.community_id 
            AND user_id = auth.uid()::text 
            AND role IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS community_invitations_insert_policy ON community_invitations;
CREATE POLICY community_invitations_insert_policy ON community_invitations
    FOR INSERT WITH CHECK (
        inviter_id = auth.uid()::text
        AND EXISTS (
            SELECT 1 FROM community_members 
            WHERE community_id = community_invitations.community_id 
            AND user_id = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS community_invitations_update_policy ON community_invitations;
CREATE POLICY community_invitations_update_policy ON community_invitations
    FOR UPDATE USING (
        inviter_id = auth.uid()::text 
        OR invitee_id = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM community_members 
            WHERE community_id = community_invitations.community_id 
            AND user_id = auth.uid()::text 
            AND role IN ('owner', 'admin')
        )
    );

-- 社群申请表 RLS
ALTER TABLE community_join_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_join_requests_select_policy ON community_join_requests;
CREATE POLICY community_join_requests_select_policy ON community_join_requests
    FOR SELECT USING (
        user_id = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM community_members 
            WHERE community_id = community_join_requests.community_id 
            AND user_id = auth.uid()::text 
            AND role IN ('owner', 'admin', 'moderator')
        )
    );

DROP POLICY IF EXISTS community_join_requests_insert_policy ON community_join_requests;
CREATE POLICY community_join_requests_insert_policy ON community_join_requests
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS community_join_requests_update_policy ON community_join_requests;
CREATE POLICY community_join_requests_update_policy ON community_join_requests
    FOR UPDATE USING (
        user_id = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM community_members 
            WHERE community_id = community_join_requests.community_id 
            AND user_id = auth.uid()::text 
            AND role IN ('owner', 'admin', 'moderator')
        )
    );

-- 社群邀请配置表 RLS
ALTER TABLE community_invite_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_invite_settings_select_policy ON community_invite_settings;
CREATE POLICY community_invite_settings_select_policy ON community_invite_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS community_invite_settings_modify_policy ON community_invite_settings;
CREATE POLICY community_invite_settings_modify_policy ON community_invite_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM community_members 
            WHERE community_id = community_invite_settings.community_id 
            AND user_id = auth.uid()::text 
            AND role IN ('owner', 'admin')
        )
    );

-- 举报表 RLS
ALTER TABLE invitation_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS invitation_reports_select_policy ON invitation_reports;
CREATE POLICY invitation_reports_select_policy ON invitation_reports
    FOR SELECT USING (
        reporter_id = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM community_members 
            WHERE community_id = invitation_reports.community_id 
            AND user_id = auth.uid()::text 
            AND role IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS invitation_reports_insert_policy ON invitation_reports;
CREATE POLICY invitation_reports_insert_policy ON invitation_reports
    FOR INSERT WITH CHECK (reporter_id = auth.uid()::text);

-- ============================================
-- 11. 创建存储过程/函数
-- ============================================

-- 检查用户邀请频率限制
CREATE OR REPLACE FUNCTION check_invite_rate_limit(p_user_id TEXT)
RETURNS TABLE (
    can_invite BOOLEAN,
    daily_remaining INTEGER,
    weekly_remaining INTEGER,
    monthly_remaining INTEGER,
    reset_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_record RECORD;
    v_daily_limit INTEGER := 10;
    v_weekly_limit INTEGER := 50;
    v_monthly_limit INTEGER := 200;
BEGIN
    -- 获取或创建用户的频率限制记录
    SELECT * INTO v_record FROM user_invite_rate_limits WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        INSERT INTO user_invite_rate_limits (user_id) VALUES (p_user_id);
        RETURN QUERY SELECT true, v_daily_limit, v_weekly_limit, v_monthly_limit, NOW() + INTERVAL '1 day';
        RETURN;
    END IF;
    
    -- 检查是否需要重置计数器
    IF v_record.reset_daily_at < NOW() THEN
        UPDATE user_invite_rate_limits 
        SET daily_count = 0, reset_daily_at = NOW() + INTERVAL '1 day'
        WHERE user_id = p_user_id;
        v_record.daily_count := 0;
    END IF;
    
    IF v_record.reset_weekly_at < NOW() THEN
        UPDATE user_invite_rate_limits 
        SET weekly_count = 0, reset_weekly_at = NOW() + INTERVAL '7 days'
        WHERE user_id = p_user_id;
        v_record.weekly_count := 0;
    END IF;
    
    IF v_record.reset_monthly_at < NOW() THEN
        UPDATE user_invite_rate_limits 
        SET monthly_count = 0, reset_monthly_at = NOW() + INTERVAL '30 days'
        WHERE user_id = p_user_id;
        v_record.monthly_count := 0;
    END IF;
    
    RETURN QUERY SELECT 
        (v_record.daily_count < v_daily_limit AND v_record.weekly_count < v_weekly_limit AND v_record.monthly_count < v_monthly_limit),
        GREATEST(0, v_daily_limit - v_record.daily_count),
        GREATEST(0, v_weekly_limit - v_record.weekly_count),
        GREATEST(0, v_monthly_limit - v_record.monthly_count),
        v_record.reset_daily_at;
END;
$$ LANGUAGE plpgsql;

-- 更新邀请频率计数
CREATE OR REPLACE FUNCTION increment_invite_count(p_user_id TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_invite_rate_limits (user_id, daily_count, weekly_count, monthly_count, last_invite_at)
    VALUES (p_user_id, 1, 1, 1, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        daily_count = user_invite_rate_limits.daily_count + 1,
        weekly_count = user_invite_rate_limits.weekly_count + 1,
        monthly_count = user_invite_rate_limits.monthly_count + 1,
        last_invite_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 获取社群邀请统计
CREATE OR REPLACE FUNCTION get_community_invite_stats(p_community_id UUID)
RETURNS TABLE (
    total_invites BIGINT,
    accepted_invites BIGINT,
    pending_invites BIGINT,
    rejected_invites BIGINT,
    expired_invites BIGINT,
    total_applications BIGINT,
    approved_applications BIGINT,
    pending_applications BIGINT,
    rejected_applications BIGINT,
    conversion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM community_invitations WHERE community_id = p_community_id),
        (SELECT COUNT(*) FROM community_invitations WHERE community_id = p_community_id AND status = 'accepted'),
        (SELECT COUNT(*) FROM community_invitations WHERE community_id = p_community_id AND status = 'pending'),
        (SELECT COUNT(*) FROM community_invitations WHERE community_id = p_community_id AND status = 'rejected'),
        (SELECT COUNT(*) FROM community_invitations WHERE community_id = p_community_id AND status = 'expired'),
        (SELECT COUNT(*) FROM community_join_requests WHERE community_id = p_community_id),
        (SELECT COUNT(*) FROM community_join_requests WHERE community_id = p_community_id AND status = 'approved'),
        (SELECT COUNT(*) FROM community_join_requests WHERE community_id = p_community_id AND status = 'pending'),
        (SELECT COUNT(*) FROM community_join_requests WHERE community_id = p_community_id AND status = 'rejected'),
        CASE 
            WHEN (SELECT COUNT(*) FROM community_invitations WHERE community_id = p_community_id) > 0 
            THEN ROUND(
                (SELECT COUNT(*)::NUMERIC FROM community_invitations WHERE community_id = p_community_id AND status = 'accepted') /
                (SELECT COUNT(*)::NUMERIC FROM community_invitations WHERE community_id = p_community_id) * 100, 
                2
            )
            ELSE 0
        END;
END;
$$ LANGUAGE plpgsql;

-- 清理过期邀请
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE community_invitations 
    SET status = 'expired'
    WHERE status = 'pending' 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 12. 初始化默认配置
-- ============================================

-- 为现有社群创建默认邀请配置
INSERT INTO community_invite_settings (community_id)
SELECT id FROM communities c
WHERE NOT EXISTS (
    SELECT 1 FROM community_invite_settings s WHERE s.community_id = c.id
);

-- ============================================
-- 13. 创建定时任务（需要 pg_cron 扩展）
-- ============================================

-- 每小时清理过期邀请
-- SELECT cron.schedule('cleanup-expired-invitations', '0 * * * *', 'SELECT cleanup_expired_invitations()');

-- ============================================
-- 14. 注释说明
-- ============================================

COMMENT ON TABLE community_invitations IS '社群成员邀请表，记录所有邀请信息';
COMMENT ON TABLE community_join_requests IS '社群加入申请表，记录用户的入群申请';
COMMENT ON TABLE community_invitation_history IS '社群邀请/申请历史记录表，用于审计和统计';
COMMENT ON TABLE community_invite_settings IS '社群邀请配置表，存储各社群的邀请规则';
COMMENT ON TABLE user_invite_rate_limits IS '用户邀请频率限制表，防骚扰机制';
COMMENT ON TABLE invitation_reports IS '邀请举报表，记录不当邀请的举报';
