-- ==========================================================================
-- 完整的推广系统数据库设置
-- 包含所有表、策略、视图、函数
-- 按顺序执行，避免依赖错误
-- ==========================================================================

-- ==========================================================================
-- 第一部分：创建表（如果不存在）
-- ==========================================================================

-- 1. 推广用户申请表
CREATE TABLE IF NOT EXISTS public.promotion_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    application_type TEXT NOT NULL DEFAULT 'individual'
        CHECK (application_type IN ('individual', 'business', 'creator', 'brand')),
    contact_name TEXT NOT NULL,
    contact_phone TEXT,
    contact_email TEXT,
    company_name TEXT,
    business_license TEXT,
    company_address TEXT,
    promotion_channels JSONB DEFAULT '[]'::jsonb,
    promotion_experience TEXT,
    expected_monthly_budget DECIMAL(12, 2),
    social_accounts JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'suspended')),
    reviewed_by UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    rejection_reason TEXT,
    promotion_permissions JSONB DEFAULT '{}'::jsonb,
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(12, 2) DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    UNIQUE(user_id, status)
);

-- 2. 推广用户审核记录表
CREATE TABLE IF NOT EXISTS public.promotion_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.promotion_applications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL
        CHECK (action IN ('submit', 'review', 'approve', 'reject', 'suspend', 'reactivate', 'update')),
    previous_status TEXT,
    new_status TEXT,
    notes TEXT,
    reason TEXT,
    performed_by UUID REFERENCES public.users(id),
    performed_by_role TEXT DEFAULT 'admin',
    changes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 推广用户统计表
CREATE TABLE IF NOT EXISTS public.promotion_user_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    daily_orders INTEGER DEFAULT 0,
    daily_spent DECIMAL(12, 2) DEFAULT 0,
    daily_views INTEGER DEFAULT 0,
    daily_clicks INTEGER DEFAULT 0,
    daily_conversions INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(12, 2) DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    UNIQUE(user_id, date)
);

-- 4. 推广用户通知表
CREATE TABLE IF NOT EXISTS public.promotion_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL
        CHECK (type IN ('application_submitted', 'application_approved', 'application_rejected', 
                       'order_completed', 'performance_alert', 'system_notice')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    related_id UUID,
    related_type TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 推广订单表
CREATE TABLE IF NOT EXISTS public.promotion_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    order_no TEXT NOT NULL UNIQUE,
    work_id TEXT, -- 支持非UUID格式的作品ID（如API返回的new_user_xxx）
    work_title TEXT,
    work_thumbnail TEXT,
    package_type TEXT NOT NULL
        CHECK (package_type IN ('standard', 'basic', 'long', 'custom')),
    package_name TEXT,
    package_duration INTEGER,
    expected_views_min INTEGER,
    expected_views_max INTEGER,
    target_type TEXT NOT NULL DEFAULT 'account'
        CHECK (target_type IN ('account', 'product', 'live')),
    metric_type TEXT NOT NULL DEFAULT 'views'
        CHECK (metric_type IN ('views', 'followers', 'engagement', 'heat')),
    original_price DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    final_price DECIMAL(10, 2) NOT NULL,
    coupon_id UUID,
    coupon_code TEXT,
    coupon_discount DECIMAL(10, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'processing', 'active', 'completed', 'cancelled', 'refunded')),
    payment_method TEXT,
    payment_time TIMESTAMPTZ,
    transaction_id TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    actual_views INTEGER DEFAULT 0,
    actual_clicks INTEGER DEFAULT 0,
    actual_conversions INTEGER DEFAULT 0,
    refund_amount DECIMAL(10, 2) DEFAULT 0,
    refund_reason TEXT,
    refund_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 6. 推广优惠券表
CREATE TABLE IF NOT EXISTS public.promotion_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL DEFAULT 'percentage'
        CHECK (discount_type IN ('percentage', 'fixed', 'first_order')),
    discount_value DECIMAL(10, 2) NOT NULL,
    max_discount DECIMAL(10, 2),
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    total_quantity INTEGER DEFAULT -1,
    used_quantity INTEGER DEFAULT 0,
    per_user_limit INTEGER DEFAULT 1,
    applicable_packages JSONB DEFAULT '[]'::jsonb,
    applicable_user_types JSONB DEFAULT '[]'::jsonb,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- 7. 用户优惠券使用记录表
CREATE TABLE IF NOT EXISTS public.promotion_coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    coupon_id UUID NOT NULL REFERENCES public.promotion_coupons(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.promotion_orders(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ DEFAULT NOW(),
    discount_amount DECIMAL(10, 2) NOT NULL,
    UNIQUE(user_id, order_id)
);

-- 8. 推广金账户表
CREATE TABLE IF NOT EXISTS public.promotion_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    balance DECIMAL(12, 2) DEFAULT 0,
    frozen_balance DECIMAL(12, 2) DEFAULT 0,
    total_recharge DECIMAL(12, 2) DEFAULT 0,
    total_consumption DECIMAL(12, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_transaction_at TIMESTAMPTZ
);

-- 9. 推广金交易记录表
CREATE TABLE IF NOT EXISTS public.promotion_wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.promotion_wallets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL
        CHECK (type IN ('recharge', 'consumption', 'refund', 'bonus', 'withdrawal')),
    amount DECIMAL(12, 2) NOT NULL,
    balance_before DECIMAL(12, 2) NOT NULL,
    balance_after DECIMAL(12, 2) NOT NULL,
    order_id UUID REFERENCES public.promotion_orders(id) ON DELETE SET NULL,
    reference_id TEXT,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================================
-- 第二部分：创建索引
-- ==========================================================================

CREATE INDEX IF NOT EXISTS idx_promotion_applications_user ON public.promotion_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_applications_status ON public.promotion_applications(status);
CREATE INDEX IF NOT EXISTS idx_promotion_applications_type ON public.promotion_applications(application_type);
CREATE INDEX IF NOT EXISTS idx_promotion_applications_created ON public.promotion_applications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_promotion_audit_logs_application ON public.promotion_audit_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_promotion_audit_logs_user ON public.promotion_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_audit_logs_action ON public.promotion_audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_promotion_user_stats_user ON public.promotion_user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_user_stats_date ON public.promotion_user_stats(date);

CREATE INDEX IF NOT EXISTS idx_promotion_notifications_user ON public.promotion_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_notifications_type ON public.promotion_notifications(type);
CREATE INDEX IF NOT EXISTS idx_promotion_notifications_read ON public.promotion_notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_promotion_orders_user ON public.promotion_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_orders_status ON public.promotion_orders(status);
CREATE INDEX IF NOT EXISTS idx_promotion_orders_package ON public.promotion_orders(package_type);
CREATE INDEX IF NOT EXISTS idx_promotion_orders_created ON public.promotion_orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_promotion_coupons_code ON public.promotion_coupons(code);
CREATE INDEX IF NOT EXISTS idx_promotion_coupons_active ON public.promotion_coupons(is_active);

CREATE INDEX IF NOT EXISTS idx_promotion_coupon_usage_user ON public.promotion_coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_coupon_usage_coupon ON public.promotion_coupon_usage(coupon_id);

CREATE INDEX IF NOT EXISTS idx_promotion_wallets_user ON public.promotion_wallets(user_id);

CREATE INDEX IF NOT EXISTS idx_promotion_wallet_txn_wallet ON public.promotion_wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_promotion_wallet_txn_user ON public.promotion_wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_wallet_txn_type ON public.promotion_wallet_transactions(type);

-- ==========================================================================
-- 第三部分：RLS 策略
-- ==========================================================================

-- 推广用户申请表
ALTER TABLE public.promotion_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "用户查看自己的推广申请" ON public.promotion_applications;
DROP POLICY IF EXISTS "用户创建推广申请" ON public.promotion_applications;
DROP POLICY IF EXISTS "用户更新自己的推广申请" ON public.promotion_applications;
CREATE POLICY "用户查看自己的推广申请" ON public.promotion_applications FOR SELECT TO public USING (user_id = auth.uid());
CREATE POLICY "用户创建推广申请" ON public.promotion_applications FOR INSERT TO public WITH CHECK (user_id = auth.uid());
CREATE POLICY "用户更新自己的推广申请" ON public.promotion_applications FOR UPDATE TO public USING (user_id = auth.uid() AND status = 'pending');

-- 推广用户审核记录表
ALTER TABLE public.promotion_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "用户查看自己的审核记录" ON public.promotion_audit_logs;
CREATE POLICY "用户查看自己的审核记录" ON public.promotion_audit_logs FOR SELECT TO public USING (user_id = auth.uid());

-- 推广用户统计表
ALTER TABLE public.promotion_user_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "用户查看自己的推广统计" ON public.promotion_user_stats;
CREATE POLICY "用户查看自己的推广统计" ON public.promotion_user_stats FOR SELECT TO public USING (user_id = auth.uid());

-- 推广用户通知表
ALTER TABLE public.promotion_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "用户查看自己的推广通知" ON public.promotion_notifications;
DROP POLICY IF EXISTS "用户更新自己的通知状态" ON public.promotion_notifications;
CREATE POLICY "用户查看自己的推广通知" ON public.promotion_notifications FOR SELECT TO public USING (user_id = auth.uid());
CREATE POLICY "用户更新自己的通知状态" ON public.promotion_notifications FOR UPDATE TO public USING (user_id = auth.uid());

-- 推广订单表
ALTER TABLE public.promotion_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "用户查看自己的推广订单" ON public.promotion_orders;
DROP POLICY IF EXISTS "用户创建推广订单" ON public.promotion_orders;
DROP POLICY IF EXISTS "用户更新自己的推广订单" ON public.promotion_orders;
CREATE POLICY "用户查看自己的推广订单" ON public.promotion_orders FOR SELECT TO public USING (user_id = auth.uid());
CREATE POLICY "用户创建推广订单" ON public.promotion_orders FOR INSERT TO public WITH CHECK (user_id = auth.uid());
CREATE POLICY "用户更新自己的推广订单" ON public.promotion_orders FOR UPDATE TO public USING (user_id = auth.uid());

-- 优惠券表
ALTER TABLE public.promotion_coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "用户查看有效优惠券" ON public.promotion_coupons;
CREATE POLICY "用户查看有效优惠券" ON public.promotion_coupons FOR SELECT TO public USING (is_active = true);

-- 优惠券使用记录表
ALTER TABLE public.promotion_coupon_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "用户查看自己的优惠券使用记录" ON public.promotion_coupon_usage;
CREATE POLICY "用户查看自己的优惠券使用记录" ON public.promotion_coupon_usage FOR SELECT TO public USING (user_id = auth.uid());

-- 推广金账户表
ALTER TABLE public.promotion_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "用户查看自己的推广金账户" ON public.promotion_wallets;
CREATE POLICY "用户查看自己的推广金账户" ON public.promotion_wallets FOR SELECT TO public USING (user_id = auth.uid());

-- 交易记录表
ALTER TABLE public.promotion_wallet_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "用户查看自己的交易记录" ON public.promotion_wallet_transactions;
CREATE POLICY "用户查看自己的交易记录" ON public.promotion_wallet_transactions FOR SELECT TO public USING (user_id = auth.uid());

-- ==========================================================================
-- 第四部分：触发器函数
-- ==========================================================================

CREATE OR REPLACE FUNCTION update_promotion_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_promotion_applications_updated_at ON public.promotion_applications;
CREATE TRIGGER update_promotion_applications_updated_at
    BEFORE UPDATE ON public.promotion_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_promotion_updated_at_column();

DROP TRIGGER IF EXISTS update_promotion_orders_updated_at ON public.promotion_orders;
CREATE TRIGGER update_promotion_orders_updated_at
    BEFORE UPDATE ON public.promotion_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_promotion_updated_at_column();

DROP TRIGGER IF EXISTS update_promotion_wallets_updated_at ON public.promotion_wallets;
CREATE TRIGGER update_promotion_wallets_updated_at
    BEFORE UPDATE ON public.promotion_wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_promotion_updated_at_column();

DROP TRIGGER IF EXISTS update_promotion_coupons_updated_at ON public.promotion_coupons;
CREATE TRIGGER update_promotion_coupons_updated_at
    BEFORE UPDATE ON public.promotion_coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_promotion_updated_at_column();

-- ==========================================================================
-- 第五部分：辅助函数
-- ==========================================================================

-- 生成订单号
CREATE OR REPLACE FUNCTION generate_promotion_order_no()
RETURNS TEXT AS $$
DECLARE
    v_order_no TEXT;
    v_exists BOOLEAN;
BEGIN
    LOOP
        v_order_no := 'PRO' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        SELECT EXISTS(SELECT 1 FROM public.promotion_orders WHERE order_no = v_order_no) INTO v_exists;
        EXIT WHEN NOT v_exists;
    END LOOP;
    RETURN v_order_no;
END;
$$ LANGUAGE plpgsql;

-- 创建推广订单
CREATE OR REPLACE FUNCTION create_promotion_order(
    p_user_id UUID,
    p_work_id TEXT, -- 支持非UUID格式的作品ID
    p_package_type TEXT,
    p_target_type TEXT,
    p_metric_type TEXT,
    p_original_price DECIMAL,
    p_discount_amount DECIMAL,
    p_final_price DECIMAL,
    p_coupon_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_order_no TEXT;
BEGIN
    -- 生成订单号
    v_order_no := generate_promotion_order_no();

    -- 创建订单
    INSERT INTO public.promotion_orders (
        user_id,
        order_no,
        work_id,
        package_type,
        target_type,
        metric_type,
        original_price,
        discount_amount,
        final_price,
        coupon_id,
        metadata,
        status
    ) VALUES (
        p_user_id,
        v_order_no,
        p_work_id,
        p_package_type,
        p_target_type,
        p_metric_type,
        p_original_price,
        p_discount_amount,
        p_final_price,
        p_coupon_id,
        p_metadata,
        'pending'
    )
    RETURNING id INTO v_order_id;

    -- 如果使用优惠券，记录使用
    IF p_coupon_id IS NOT NULL THEN
        INSERT INTO public.promotion_coupon_usage (user_id, coupon_id, order_id, discount_amount)
        VALUES (p_user_id, p_coupon_id, v_order_id, p_discount_amount);

        -- 更新优惠券使用数量
        UPDATE public.promotion_coupons
        SET used_quantity = used_quantity + 1
        WHERE id = p_coupon_id;
    END IF;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- 支付推广订单
CREATE OR REPLACE FUNCTION pay_promotion_order(
    p_order_id UUID,
    p_payment_method TEXT,
    p_transaction_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_order RECORD;
BEGIN
    -- 获取订单信息
    SELECT * INTO v_order
    FROM public.promotion_orders
    WHERE id = p_order_id;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    IF v_order.status != 'pending' THEN
        RETURN false;
    END IF;

    -- 更新订单状态
    UPDATE public.promotion_orders
    SET
        status = 'paid',
        payment_method = p_payment_method,
        payment_time = NOW(),
        transaction_id = p_transaction_id,
        updated_at = NOW()
    WHERE id = p_order_id;

    RETURN true;
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
        application_id, user_id, action, previous_status, new_status,
        notes, reason, performed_by, changes
    ) VALUES (
        p_application_id, p_user_id, p_action, p_previous_status, p_new_status,
        p_notes, p_reason, p_performed_by, p_changes
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
        user_id, type, title, content, related_id, related_type
    ) VALUES (
        p_user_id, p_type, p_title, p_content, p_related_id, p_related_type
    )
    RETURNING id INTO v_notification_id;
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- 审核推广申请
CREATE OR REPLACE FUNCTION audit_promotion_application(
    p_application_id UUID,
    p_action TEXT,
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
    SELECT * INTO v_application FROM public.promotion_applications WHERE id = p_application_id;
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
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
    
    PERFORM log_promotion_audit(
        p_application_id, v_application.user_id, p_action,
        v_application.status, v_new_status, p_notes, p_reason, p_performed_by,
        jsonb_build_object('permissions', v_permissions)
    );
    
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
        p_application_id, 'application'
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 获取待审核推广申请数量
CREATE OR REPLACE FUNCTION get_pending_promotion_applications_count()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM public.promotion_applications WHERE status = 'pending';
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 获取用户推广统计
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

-- ==========================================================================
-- 第六部分：视图
-- ==========================================================================

DROP VIEW IF EXISTS promotion_orders_detail;
DROP VIEW IF EXISTS promotion_user_statistics;
DROP VIEW IF EXISTS promotion_applications_detail;
DROP VIEW IF EXISTS promotion_audit_stats;

CREATE OR REPLACE VIEW promotion_orders_detail AS
SELECT 
    po.*,
    u.username as user_username,
    u.email as user_email,
    u.avatar_url as user_avatar
FROM public.promotion_orders po
LEFT JOIN public.users u ON po.user_id = u.id;

CREATE OR REPLACE VIEW promotion_user_statistics AS
SELECT 
    user_id,
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
    COUNT(*) FILTER (WHERE status = 'paid') as paid_orders,
    COUNT(*) FILTER (WHERE status = 'active') as active_orders,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
    SUM(final_price) as total_spent,
    SUM(actual_views) as total_views
FROM public.promotion_orders
GROUP BY user_id;

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

CREATE OR REPLACE VIEW promotion_audit_stats AS
SELECT 
    DATE(created_at) as date,
    action,
    COUNT(*) as count
FROM public.promotion_audit_logs
GROUP BY DATE(created_at), action
ORDER BY date DESC, action;

-- ==========================================================================
-- 第七部分：初始化数据
-- ==========================================================================

-- 新人7折券
INSERT INTO public.promotion_coupons (
    code, name, description, discount_type, discount_value, max_discount,
    min_order_amount, total_quantity, per_user_limit, applicable_packages, is_active
) VALUES (
    'NEWUSER30', '新人7折优惠', '新用户首次推广专享7折优惠，最高减免200元',
    'percentage', 30, 200, 0, -1, 1, '[]'::jsonb, true
) ON CONFLICT (code) DO NOTHING;

-- 二单8折券
INSERT INTO public.promotion_coupons (
    code, name, description, discount_type, discount_value, max_discount,
    min_order_amount, total_quantity, per_user_limit, applicable_packages, is_active
) VALUES (
    'SECOND20', '二单8折优惠', '第二次推广专享8折优惠，最高减免100元',
    'percentage', 20, 100, 0, -1, 1, '[]'::jsonb, true
) ON CONFLICT (code) DO NOTHING;

-- 三单85折券
INSERT INTO public.promotion_coupons (
    code, name, description, discount_type, discount_value, max_discount,
    min_order_amount, total_quantity, per_user_limit, applicable_packages, is_active
) VALUES (
    'THIRD15', '三单85折优惠', '第三次推广专享85折优惠，最高减免80元',
    'percentage', 15, 80, 0, -1, 1, '[]'::jsonb, true
) ON CONFLICT (code) DO NOTHING;

-- ==========================================================================
-- 完成
-- ==========================================================================

NOTIFY pgrst, 'reload schema';
