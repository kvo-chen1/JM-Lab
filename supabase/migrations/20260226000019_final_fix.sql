-- ==========================================================================
-- 最终修复 - 完全删除并重新创建函数
-- ==========================================================================

-- 1. 首先完全删除函数（包括所有重载版本）
DROP FUNCTION IF EXISTS public.create_promotion_order(UUID, UUID, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, UUID, JSONB);
DROP FUNCTION IF EXISTS public.create_promotion_order(UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, UUID, JSONB);
DROP FUNCTION IF EXISTS public.create_promotion_order CASCADE;

-- 2. 确保表结构正确
DO $$
BEGIN
    -- 检查 work_id 列的类型
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'promotion_orders' 
        AND column_name = 'work_id' 
        AND data_type = 'uuid'
    ) THEN
        -- 删除外键约束（如果存在）
        ALTER TABLE public.promotion_orders 
        DROP CONSTRAINT IF EXISTS promotion_orders_work_id_fkey;
        
        -- 修改列类型为 TEXT
        ALTER TABLE public.promotion_orders 
        ALTER COLUMN work_id TYPE TEXT USING work_id::TEXT;
    END IF;
END $$;

-- 3. 创建新函数 - 使用 TEXT 类型的 work_id
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
RETURNS TABLE(order_id UUID, order_no TEXT) 
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
    
    RETURN QUERY SELECT v_order_id, v_order_no;
END;
$$;

-- 4. 授予执行权限
GRANT EXECUTE ON FUNCTION public.create_promotion_order TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_promotion_order TO anon;
GRANT EXECUTE ON FUNCTION public.create_promotion_order TO service_role;

-- 5. 验证函数创建成功
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'create_promotion_order';

-- 6. 验证表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'promotion_orders' 
AND column_name = 'work_id';
