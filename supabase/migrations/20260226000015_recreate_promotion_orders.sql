-- ==========================================================================
-- 重新创建 promotion_orders 表
-- 使用 TEXT 类型的 work_id 以支持非UUID格式的作品ID
-- ==========================================================================

-- 1. 先删除依赖的对象
DROP VIEW IF EXISTS promotion_orders_detail;
DROP VIEW IF EXISTS promotion_user_statistics;
DROP FUNCTION IF EXISTS create_promotion_order(UUID, UUID, TEXT, TEXT, TEXT, DECIMAL, DECIMAL, DECIMAL, UUID, JSONB);
DROP FUNCTION IF EXISTS create_promotion_order(UUID, TEXT, TEXT, TEXT, TEXT, DECIMAL, DECIMAL, DECIMAL, UUID, JSONB);

-- 2. 保存现有数据（如果有）
CREATE TEMP TABLE IF NOT EXISTS temp_promotion_orders AS 
SELECT * FROM public.promotion_orders WHERE 1=0;

-- 3. 删除旧表
DROP TABLE IF EXISTS public.promotion_orders CASCADE;

-- 4. 重新创建表
CREATE TABLE public.promotion_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    order_no TEXT NOT NULL UNIQUE,
    work_id TEXT, -- 改为 TEXT 类型以支持非UUID格式的作品ID
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

-- 5. 创建索引
CREATE INDEX idx_promotion_orders_user ON public.promotion_orders(user_id);
CREATE INDEX idx_promotion_orders_status ON public.promotion_orders(status);
CREATE INDEX idx_promotion_orders_package ON public.promotion_orders(package_type);
CREATE INDEX idx_promotion_orders_created ON public.promotion_orders(created_at DESC);

-- 6. 启用 RLS
ALTER TABLE public.promotion_orders ENABLE ROW LEVEL SECURITY;

-- 7. 创建 RLS 策略
DROP POLICY IF EXISTS "用户查看自己的推广订单" ON public.promotion_orders;
DROP POLICY IF EXISTS "用户创建推广订单" ON public.promotion_orders;
DROP POLICY IF EXISTS "用户更新自己的推广订单" ON public.promotion_orders;

CREATE POLICY "用户查看自己的推广订单" ON public.promotion_orders FOR SELECT TO public USING (user_id = auth.uid());
CREATE POLICY "用户创建推广订单" ON public.promotion_orders FOR INSERT TO public WITH CHECK (user_id = auth.uid());
CREATE POLICY "用户更新自己的推广订单" ON public.promotion_orders FOR UPDATE TO public USING (user_id = auth.uid());

-- 8. 创建触发器
CREATE OR REPLACE FUNCTION update_promotion_order_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_promotion_orders_updated_at ON public.promotion_orders;
CREATE TRIGGER update_promotion_orders_updated_at
    BEFORE UPDATE ON public.promotion_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_promotion_order_updated_at_column();

-- 9. 创建视图
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

-- 10. 创建函数
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
    v_order_no := generate_promotion_order_no();

    INSERT INTO public.promotion_orders (
        user_id, order_no, work_id, package_type, target_type, metric_type,
        original_price, discount_amount, final_price, coupon_id, metadata, status
    ) VALUES (
        p_user_id, v_order_no, p_work_id, p_package_type, p_target_type, p_metric_type,
        p_original_price, p_discount_amount, p_final_price, p_coupon_id, p_metadata, 'pending'
    )
    RETURNING id INTO v_order_id;

    IF p_coupon_id IS NOT NULL THEN
        INSERT INTO public.promotion_coupon_usage (user_id, coupon_id, order_id, discount_amount)
        VALUES (p_user_id, p_coupon_id, v_order_id, p_discount_amount);

        UPDATE public.promotion_coupons
        SET used_quantity = used_quantity + 1
        WHERE id = p_coupon_id;
    END IF;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION pay_promotion_order(
    p_order_id UUID,
    p_payment_method TEXT,
    p_transaction_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_order RECORD;
BEGIN
    SELECT * INTO v_order FROM public.promotion_orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    IF v_order.status != 'pending' THEN
        RETURN false;
    END IF;

    UPDATE public.promotion_orders
    SET status = 'paid', payment_method = p_payment_method,
        payment_time = NOW(), transaction_id = p_transaction_id, updated_at = NOW()
    WHERE id = p_order_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 11. 刷新缓存
NOTIFY pgrst, 'reload schema';
