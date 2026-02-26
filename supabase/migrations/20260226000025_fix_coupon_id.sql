-- ==========================================================================
-- 修复 coupon_id 列类型
-- ==========================================================================

-- 1. 检查当前 coupon_id 列类型
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'promotion_orders' 
AND column_name = 'coupon_id';

-- 2. 修改 coupon_id 列为 TEXT 类型
ALTER TABLE public.promotion_orders 
ALTER COLUMN coupon_id TYPE TEXT USING coupon_id::TEXT;

-- 3. 更新 create_promotion_order 函数的 coupon_id 参数类型为 TEXT
CREATE OR REPLACE FUNCTION create_promotion_order(
    p_user_id UUID,
    p_work_id TEXT,
    p_package_type TEXT,
    p_target_type TEXT,
    p_metric_type TEXT,
    p_original_price DECIMAL,
    p_discount_amount DECIMAL,
    p_final_price DECIMAL,
    p_coupon_id TEXT DEFAULT NULL,
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

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- 4. 验证修改结果
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'promotion_orders' 
AND column_name = 'coupon_id';
