-- ==========================================================================
-- 修复所有 UUID 类型问题
-- 将 work_id 相关的所有地方都改为 TEXT 类型
-- ==========================================================================

-- 1. 先删除函数（因为函数参数依赖于表结构）
DROP FUNCTION IF EXISTS create_promotion_order(UUID, UUID, TEXT, TEXT, TEXT, DECIMAL, DECIMAL, DECIMAL, UUID, JSONB);
DROP FUNCTION IF EXISTS create_promotion_order(UUID, TEXT, TEXT, TEXT, TEXT, DECIMAL, DECIMAL, DECIMAL, UUID, JSONB);

-- 2. 删除视图
DROP VIEW IF EXISTS promotion_orders_detail;
DROP VIEW IF EXISTS promotion_user_statistics;

-- 3. 修改表字段类型
ALTER TABLE public.promotion_orders 
ALTER COLUMN work_id DROP NOT NULL;

-- 如果字段类型还是 UUID，改为 TEXT
DO $$
BEGIN
    -- 检查字段类型
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'promotion_orders' 
        AND column_name = 'work_id' 
        AND data_type = 'uuid'
    ) THEN
        -- 先删除外键约束
        ALTER TABLE public.promotion_orders 
        DROP CONSTRAINT IF EXISTS promotion_orders_work_id_fkey;
        
        -- 修改字段类型为 TEXT
        ALTER TABLE public.promotion_orders 
        ALTER COLUMN work_id TYPE TEXT USING work_id::TEXT;
    END IF;
END $$;

-- 4. 删除外键约束（如果还存在）
ALTER TABLE public.promotion_orders 
DROP CONSTRAINT IF EXISTS promotion_orders_work_id_fkey;

-- 5. 修改约束
ALTER TABLE public.promotion_orders 
DROP CONSTRAINT IF EXISTS promotion_orders_metric_type_check;

ALTER TABLE public.promotion_orders 
ADD CONSTRAINT promotion_orders_metric_type_check 
CHECK (metric_type IN ('views', 'fans', 'interactions', 'hot', 'followers', 'engagement', 'heat'));

ALTER TABLE public.promotion_orders 
DROP CONSTRAINT IF EXISTS promotion_orders_target_type_check;

ALTER TABLE public.promotion_orders 
ADD CONSTRAINT promotion_orders_target_type_check 
CHECK (target_type IN ('account', 'transaction', 'live', 'product'));

-- 6. 重新创建视图
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

-- 7. 重新创建函数
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
    v_order_no := 'PRO' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

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

-- 8. 刷新缓存
NOTIFY pgrst, 'reload schema';
