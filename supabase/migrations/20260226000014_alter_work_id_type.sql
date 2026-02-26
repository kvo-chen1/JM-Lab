-- ==========================================================================
-- 修改 promotion_orders 表的 work_id 字段类型
-- 从 UUID 改为 TEXT，以支持非UUID格式的作品ID
-- ==========================================================================

-- 先删除依赖的视图
DROP VIEW IF EXISTS promotion_orders_detail;
DROP VIEW IF EXISTS promotion_user_statistics;

-- 删除外键约束（如果存在）
ALTER TABLE public.promotion_orders 
DROP CONSTRAINT IF EXISTS promotion_orders_work_id_fkey;

-- 修改 work_id 字段类型
ALTER TABLE public.promotion_orders 
ALTER COLUMN work_id TYPE TEXT;

CREATE OR REPLACE VIEW promotion_orders_detail AS
SELECT 
    po.*,
    u.username as user_username,
    u.email as user_email,
    u.avatar_url as user_avatar
FROM public.promotion_orders po
LEFT JOIN public.users u ON po.user_id = u.id;

-- 更新函数参数类型
CREATE OR REPLACE FUNCTION create_promotion_order(
    p_user_id UUID,
    p_work_id TEXT,
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

-- 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';
