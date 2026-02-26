-- ==========================================================================
-- 核选项 - 完全重置函数
-- ==========================================================================

-- 1. 完全删除所有相关函数（使用多种方式确保删除）
DROP FUNCTION IF EXISTS public.create_promotion_order(UUID, UUID, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, UUID, JSONB);
DROP FUNCTION IF EXISTS public.create_promotion_order(UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, UUID, JSONB);
DROP FUNCTION IF EXISTS public.create_promotion_order(USER_ID UUID, WORK_ID UUID);
DROP FUNCTION IF EXISTS public.create_promotion_order(USER_ID UUID, WORK_ID TEXT);
DROP FUNCTION IF EXISTS public.create_promotion_order CASCADE;

-- 2. 使用新的函数名避免缓存问题
DROP FUNCTION IF EXISTS public.create_promo_order(UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, UUID, JSONB);
DROP FUNCTION IF EXISTS public.create_promo_order CASCADE;

-- 3. 创建全新的函数（使用新名称）
CREATE OR REPLACE FUNCTION public.create_promo_order(
    p_user_id UUID,
    p_work_id TEXT,
    p_package_type TEXT,
    p_target_type TEXT,
    p_metric_type TEXT,
    p_original_price NUMERIC,
    p_discount_amount NUMERIC,
    p_final_price NUMERIC,
    p_coupon_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id UUID;
    v_order_no TEXT;
BEGIN
    -- 生成订单号
    v_order_no := 'PRO' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- 插入订单
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
        status,
        created_at
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
        'pending',
        NOW()
    )
    RETURNING id INTO v_order_id;
    
    -- 返回 JSON 对象
    RETURN jsonb_build_object(
        'order_id', v_order_id,
        'order_no', v_order_no
    );
END;
$$;

-- 4. 授予权限
GRANT EXECUTE ON FUNCTION public.create_promo_order TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_promo_order TO anon;
GRANT EXECUTE ON FUNCTION public.create_promo_order TO service_role;

-- 5. 同时尝试修复原函数名（如果可能）
-- 先检查当前函数定义
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname LIKE '%promotion%';
