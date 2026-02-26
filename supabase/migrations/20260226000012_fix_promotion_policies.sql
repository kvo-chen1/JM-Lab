-- ==========================================================================
-- 修复推广系统策略和视图
-- 删除已存在的策略，重新创建
-- ==========================================================================

-- 删除已存在的策略（如果存在）
DROP POLICY IF EXISTS "用户查看自己的推广申请" ON public.promotion_applications;
DROP POLICY IF EXISTS "用户创建推广申请" ON public.promotion_applications;
DROP POLICY IF EXISTS "用户更新自己的推广申请" ON public.promotion_applications;

DROP POLICY IF EXISTS "用户查看自己的审核记录" ON public.promotion_audit_logs;

DROP POLICY IF EXISTS "用户查看自己的推广统计" ON public.promotion_user_stats;

DROP POLICY IF EXISTS "用户查看自己的推广通知" ON public.promotion_notifications;
DROP POLICY IF EXISTS "用户更新自己的通知状态" ON public.promotion_notifications;

DROP POLICY IF EXISTS "用户查看自己的推广订单" ON public.promotion_orders;
DROP POLICY IF EXISTS "用户创建推广订单" ON public.promotion_orders;
DROP POLICY IF EXISTS "用户更新自己的推广订单" ON public.promotion_orders;

DROP POLICY IF EXISTS "用户查看有效优惠券" ON public.promotion_coupons;

DROP POLICY IF EXISTS "用户查看自己的优惠券使用记录" ON public.promotion_coupon_usage;

DROP POLICY IF EXISTS "用户查看自己的推广金账户" ON public.promotion_wallets;

DROP POLICY IF EXISTS "用户查看自己的交易记录" ON public.promotion_wallet_transactions;

-- ==========================================================================
-- 重新创建策略
-- ==========================================================================

-- 推广用户申请表
ALTER TABLE public.promotion_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户查看自己的推广申请" ON public.promotion_applications
    FOR SELECT TO public
    USING (user_id = auth.uid());

CREATE POLICY "用户创建推广申请" ON public.promotion_applications
    FOR INSERT TO public
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "用户更新自己的推广申请" ON public.promotion_applications
    FOR UPDATE TO public
    USING (user_id = auth.uid() AND status = 'pending');

-- 推广用户审核记录表
ALTER TABLE public.promotion_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户查看自己的审核记录" ON public.promotion_audit_logs
    FOR SELECT TO public
    USING (user_id = auth.uid());

-- 推广用户统计表
ALTER TABLE public.promotion_user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户查看自己的推广统计" ON public.promotion_user_stats
    FOR SELECT TO public
    USING (user_id = auth.uid());

-- 推广用户通知表
ALTER TABLE public.promotion_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户查看自己的推广通知" ON public.promotion_notifications
    FOR SELECT TO public
    USING (user_id = auth.uid());

CREATE POLICY "用户更新自己的通知状态" ON public.promotion_notifications
    FOR UPDATE TO public
    USING (user_id = auth.uid());

-- 推广订单表
ALTER TABLE public.promotion_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户查看自己的推广订单" ON public.promotion_orders
    FOR SELECT TO public
    USING (user_id = auth.uid());

CREATE POLICY "用户创建推广订单" ON public.promotion_orders
    FOR INSERT TO public
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "用户更新自己的推广订单" ON public.promotion_orders
    FOR UPDATE TO public
    USING (user_id = auth.uid());

-- 优惠券表
ALTER TABLE public.promotion_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户查看有效优惠券" ON public.promotion_coupons
    FOR SELECT TO public
    USING (is_active = true);

-- 优惠券使用记录表
ALTER TABLE public.promotion_coupon_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户查看自己的优惠券使用记录" ON public.promotion_coupon_usage
    FOR SELECT TO public
    USING (user_id = auth.uid());

-- 推广金账户表
ALTER TABLE public.promotion_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户查看自己的推广金账户" ON public.promotion_wallets
    FOR SELECT TO public
    USING (user_id = auth.uid());

-- 交易记录表
ALTER TABLE public.promotion_wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户查看自己的交易记录" ON public.promotion_wallet_transactions
    FOR SELECT TO public
    USING (user_id = auth.uid());

-- ==========================================================================
-- 修复视图
-- ==========================================================================

-- 删除已存在的视图
DROP VIEW IF EXISTS promotion_orders_detail;
DROP VIEW IF EXISTS promotion_user_statistics;
DROP VIEW IF EXISTS promotion_applications_detail;
DROP VIEW IF EXISTS promotion_audit_stats;

-- 重新创建推广订单详情视图（兼容不同字段名）
CREATE OR REPLACE VIEW promotion_orders_detail AS
SELECT 
    po.*,
    u.username as user_username,
    u.email as user_email,
    u.avatar_url as user_avatar,
    w.title as work_title,
    COALESCE(w.thumbnail_url, w.thumbnail, w.cover_image, po.work_thumbnail) as work_thumbnail
FROM public.promotion_orders po
LEFT JOIN public.users u ON po.user_id = u.id
LEFT JOIN public.works w ON po.work_id = w.id;

-- 重新创建用户推广统计视图
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

-- 重新创建推广用户申请详情视图
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

-- 重新创建推广用户审核统计视图
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
