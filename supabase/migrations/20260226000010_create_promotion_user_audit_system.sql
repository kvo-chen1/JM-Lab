-- ==========================================================================
-- 推广用户审核系统 - 数据库迁移
-- 包含：推广用户申请表、审核记录表、推广用户统计表
-- ==========================================================================

-- ==========================================================================
-- 1. 推广用户申请表 (promotion_applications)
-- 用于用户申请成为推广用户
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.promotion_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 申请人信息
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- 申请类型
    application_type TEXT NOT NULL DEFAULT 'individual'
        CHECK (application_type IN ('individual', 'business', 'creator', 'brand')),
    
    -- 联系信息
    contact_name TEXT NOT NULL,
    contact_phone TEXT,
    contact_email TEXT,
    
    -- 公司/品牌信息（企业申请时填写）
    company_name TEXT,
    business_license TEXT, -- 营业执照图片URL
    company_address TEXT,
    
    -- 推广能力描述
    promotion_channels JSONB DEFAULT '[]'::jsonb, -- 推广渠道，如["抖音", "小红书", "微信"]
    promotion_experience TEXT, -- 推广经验描述
    expected_monthly_budget DECIMAL(12, 2), -- 预期月推广预算
    
    -- 社交媒体账号
    social_accounts JSONB DEFAULT '[]'::jsonb, 
    /*
    [
        { "platform": "抖音", "account": "@username", "followers": 10000 },
        { "platform": "小红书", "account": "@username", "followers": 5000 }
    ]
    */
    
    -- 申请状态
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'suspended')),
    
    -- 审核信息
    reviewed_by UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    rejection_reason TEXT,
    
    -- 推广权限
    promotion_permissions JSONB DEFAULT '{}'::jsonb,
    /*
    {
        "can_create_orders": true,
        "can_use_coupons": true,
        "max_daily_budget": 10000,
        "allowed_package_types": ["standard", "basic", "long"],
        "commission_rate": 0.1
    }
    */
    
    -- 推广统计数据（累计）
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(12, 2) DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    
    -- 每个用户只能有一个有效申请
    UNIQUE(user_id, status)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_promotion_applications_user ON public.promotion_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_applications_status ON public.promotion_applications(status);
CREATE INDEX IF NOT EXISTS idx_promotion_applications_type ON public.promotion_applications(application_type);
CREATE INDEX IF NOT EXISTS idx_promotion_applications_created ON public.promotion_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_promotion_applications_reviewed ON public.promotion_applications(reviewed_at DESC);

-- ==========================================================================
-- 2. 推广用户审核记录表 (promotion_audit_logs)
-- 记录所有审核操作历史
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.promotion_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 关联申请
    application_id UUID NOT NULL REFERENCES public.promotion_applications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- 审核操作
    action TEXT NOT NULL
        CHECK (action IN ('submit', 'review', 'approve', 'reject', 'suspend', 'reactivate', 'update')),
    
    -- 状态变更
    previous_status TEXT,
    new_status TEXT,
    
    -- 审核详情
    notes TEXT,
    reason TEXT,
    
    -- 审核人
    performed_by UUID REFERENCES public.users(id),
    performed_by_role TEXT DEFAULT 'admin', -- admin, system
    
    -- 变更内容（JSON格式记录具体变更字段）
    changes JSONB DEFAULT '{}'::jsonb,
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_promotion_audit_logs_application ON public.promotion_audit_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_promotion_audit_logs_user ON public.promotion_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_audit_logs_action ON public.promotion_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_promotion_audit_logs_created ON public.promotion_audit_logs(created_at DESC);

-- ==========================================================================
-- 3. 推广用户统计表 (promotion_user_stats)
-- 每日统计推广用户数据
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.promotion_user_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- 日期
    date DATE NOT NULL,
    
    -- 当日数据
    daily_orders INTEGER DEFAULT 0,
    daily_spent DECIMAL(12, 2) DEFAULT 0,
    daily_views INTEGER DEFAULT 0,
    daily_clicks INTEGER DEFAULT 0,
    daily_conversions INTEGER DEFAULT 0,
    
    -- 累计数据（截至当日）
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(12, 2) DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    
    -- 唯一约束：每个用户每天一条记录
    UNIQUE(user_id, date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_promotion_user_stats_user ON public.promotion_user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_user_stats_date ON public.promotion_user_stats(date);

-- ==========================================================================
-- 4. 推广用户通知表 (promotion_notifications)
-- 推广用户相关的系统通知
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.promotion_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- 通知类型
    type TEXT NOT NULL
        CHECK (type IN ('application_submitted', 'application_approved', 'application_rejected', 
                       'order_completed', 'performance_alert', 'system_notice')),
    
    -- 通知内容
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    
    -- 关联数据
    related_id UUID, -- 关联的申请ID或订单ID
    related_type TEXT, -- application, order
    
    -- 状态
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_promotion_notifications_user ON public.promotion_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_notifications_type ON public.promotion_notifications(type);
CREATE INDEX IF NOT EXISTS idx_promotion_notifications_read ON public.promotion_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_promotion_notifications_created ON public.promotion_notifications(created_at DESC);

-- ==========================================================================
-- RLS 策略
-- ==========================================================================

-- 推广用户申请表
ALTER TABLE public.promotion_applications ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的申请
CREATE POLICY "用户查看自己的推广申请" ON public.promotion_applications
    FOR SELECT TO public
    USING (user_id = auth.uid());

-- 用户可以创建自己的申请
CREATE POLICY "用户创建推广申请" ON public.promotion_applications
    FOR INSERT TO public
    WITH CHECK (user_id = auth.uid());

-- 用户可以更新自己的待审核申请
CREATE POLICY "用户更新自己的推广申请" ON public.promotion_applications
    FOR UPDATE TO public
    USING (user_id = auth.uid() AND status = 'pending');

-- 推广用户审核记录表
ALTER TABLE public.promotion_audit_logs ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的审核记录
CREATE POLICY "用户查看自己的审核记录" ON public.promotion_audit_logs
    FOR SELECT TO public
    USING (user_id = auth.uid());

-- 推广用户统计表
ALTER TABLE public.promotion_user_stats ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的统计数据
CREATE POLICY "用户查看自己的推广统计" ON public.promotion_user_stats
    FOR SELECT TO public
    USING (user_id = auth.uid());

-- 推广用户通知表
ALTER TABLE public.promotion_notifications ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的通知
CREATE POLICY "用户查看自己的推广通知" ON public.promotion_notifications
    FOR SELECT TO public
    USING (user_id = auth.uid());

-- 用户可以更新自己的通知状态
CREATE POLICY "用户更新自己的通知状态" ON public.promotion_notifications
    FOR UPDATE TO public
    USING (user_id = auth.uid());

-- ==========================================================================
-- 触发器函数
-- ==========================================================================

-- 更新时间戳
CREATE OR REPLACE FUNCTION update_promotion_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 推广申请表更新触发器
DROP TRIGGER IF EXISTS update_promotion_applications_updated_at ON public.promotion_applications;
CREATE TRIGGER update_promotion_applications_updated_at
    BEFORE UPDATE ON public.promotion_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_promotion_updated_at_column();

-- ==========================================================================
-- 辅助函数
-- ==========================================================================

-- 获取推广用户统计
CREATE OR REPLACE FUNCTION get_promotion_user_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_applications', COUNT(*),
        'pending_applications', COUNT(*) FILTER (WHERE status = 'pending'),
        'approved_applications', COUNT(*) FILTER (WHERE status = 'approved'),
        'rejected_applications', COUNT(*) FILTER (WHERE status = 'rejected'),
        'total_spent', COALESCE(SUM(total_spent), 0),
        'total_orders', COALESCE(SUM(total_orders), 0),
        'total_views', COALESCE(SUM(total_views), 0)
    )
    INTO v_stats
    FROM public.promotion_applications
    WHERE user_id = p_user_id;
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- 获取待审核推广申请数量
CREATE OR REPLACE FUNCTION get_pending_promotion_applications_count()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.promotion_applications
    WHERE status = 'pending';
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 记录审核日志
CREATE OR REPLACE FUNCTION log_promotion_audit(
    p_application_id UUID,
    p_user_id UUID,
    p_action TEXT,
    p_previous_status TEXT,
    p_new_status TEXT,
    p_notes TEXT,
    p_reason TEXT,
    p_performed_by UUID,
    p_changes JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.promotion_audit_logs (
        application_id,
        user_id,
        action,
        previous_status,
        new_status,
        notes,
        reason,
        performed_by,
        changes
    ) VALUES (
        p_application_id,
        p_user_id,
        p_action,
        p_previous_status,
        p_new_status,
        p_notes,
        p_reason,
        p_performed_by,
        p_changes
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- 发送推广通知
CREATE OR REPLACE FUNCTION send_promotion_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_content TEXT,
    p_related_id UUID DEFAULT NULL,
    p_related_type TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO public.promotion_notifications (
        user_id,
        type,
        title,
        content,
        related_id,
        related_type
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_content,
        p_related_id,
        p_related_type
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- 审核推广申请
CREATE OR REPLACE FUNCTION audit_promotion_application(
    p_application_id UUID,
    p_action TEXT, -- 'approve', 'reject', 'suspend'
    p_notes TEXT,
    p_reason TEXT,
    p_performed_by UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_application RECORD;
    v_new_status TEXT;
    v_permissions JSONB;
BEGIN
    -- 获取申请信息
    SELECT * INTO v_application
    FROM public.promotion_applications
    WHERE id = p_application_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- 确定新状态
    CASE p_action
        WHEN 'approve' THEN
            v_new_status := 'approved';
            v_permissions := jsonb_build_object(
                'can_create_orders', true,
                'can_use_coupons', true,
                'max_daily_budget', 10000,
                'allowed_package_types', jsonb_build_array('standard', 'basic', 'long', 'custom'),
                'commission_rate', 0.1
            );
        WHEN 'reject' THEN
            v_new_status := 'rejected';
            v_permissions := '{}'::jsonb;
        WHEN 'suspend' THEN
            v_new_status := 'suspended';
            v_permissions := v_application.promotion_permissions;
        ELSE
            RETURN false;
    END CASE;
    
    -- 更新申请状态
    UPDATE public.promotion_applications
    SET 
        status = v_new_status,
        reviewed_by = p_performed_by,
        reviewed_at = NOW(),
        review_notes = p_notes,
        rejection_reason = CASE WHEN p_action = 'reject' THEN p_reason ELSE NULL END,
        promotion_permissions = v_permissions,
        approved_at = CASE WHEN p_action = 'approve' THEN NOW() ELSE approved_at END,
        updated_at = NOW()
    WHERE id = p_application_id;
    
    -- 记录审核日志
    PERFORM log_promotion_audit(
        p_application_id,
        v_application.user_id,
        p_action,
        v_application.status,
        v_new_status,
        p_notes,
        p_reason,
        p_performed_by,
        jsonb_build_object('permissions', v_permissions)
    );
    
    -- 发送通知
    PERFORM send_promotion_notification(
        v_application.user_id,
        CASE p_action
            WHEN 'approve' THEN 'application_approved'
            WHEN 'reject' THEN 'application_rejected'
            ELSE 'system_notice'
        END,
        CASE p_action
            WHEN 'approve' THEN '推广申请已通过'
            WHEN 'reject' THEN '推广申请未通过'
            ELSE '推广账号状态变更'
        END,
        CASE p_action
            WHEN 'approve' THEN '恭喜！您的推广用户申请已通过审核，现在可以开始使用推广功能了。'
            WHEN 'reject' THEN '很遗憾，您的推广用户申请未通过审核。原因：' || COALESCE(p_reason, '未提供')
            ELSE '您的推广账号状态已变更为：' || v_new_status
        END,
        p_application_id,
        'application'
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ==========================================================================
-- 视图
-- ==========================================================================

-- 推广用户申请详情视图
CREATE OR REPLACE VIEW promotion_applications_detail AS
SELECT 
    pa.*,
    u.username as user_username,
    u.email as user_email,
    u.avatar_url as user_avatar,
    reviewer.username as reviewer_username,
    reviewer.avatar_url as reviewer_avatar
FROM public.promotion_applications pa
LEFT JOIN public.users u ON pa.user_id = u.id
LEFT JOIN public.users reviewer ON pa.reviewed_by = reviewer.id;

-- 推广用户审核统计视图
CREATE OR REPLACE VIEW promotion_audit_stats AS
SELECT 
    DATE(created_at) as date,
    action,
    COUNT(*) as count
FROM public.promotion_audit_logs
GROUP BY DATE(created_at), action
ORDER BY date DESC, action;

-- ==========================================================================
-- 完成
-- ==========================================================================

-- 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';
