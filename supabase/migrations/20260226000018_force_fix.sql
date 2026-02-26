-- ==========================================================================
-- 强制修复 - 删除并重新创建所有相关内容
-- ==========================================================================

-- 1. 强制删除函数（使用 CASCADE）
DROP FUNCTION IF EXISTS public.create_promotion_order CASCADE;

-- 2. 检查表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'promotion_orders' AND column_name = 'work_id';

-- 3. 如果 work_id 还是 uuid 类型，强制修改
ALTER TABLE public.promotion_orders 
DROP CONSTRAINT IF EXISTS promotion_orders_work_id_fkey;

-- 使用 USING 子句强制转换
ALTER TABLE public.promotion_orders 
ALTER COLUMN work_id TYPE TEXT USING work_id::TEXT;

-- 4. 确认修改后的类型
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'promotion_orders' AND column_name = 'work_id';

-- 5. 重新创建函数（明确使用 TEXT 类型）
CREATE OR REPLACE FUNCTION public.create_promotion_order(
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
RETURNS UUID 
LANGUAGE plpgsql
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
$$;

-- 6. 验证函数参数
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'create_promotion_order';

-- 7. 刷新缓存
NOTIFY pgrst, 'reload schema';
