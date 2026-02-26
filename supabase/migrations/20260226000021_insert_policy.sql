-- ==========================================================================
-- 添加 INSERT 权限策略
-- ==========================================================================

-- 1. 确保表存在且有正确的列
DO $$
BEGIN
    -- 检查表是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'promotion_orders'
    ) THEN
        RAISE EXCEPTION 'promotion_orders table does not exist';
    END IF;
END $$;

-- 2. 删除旧的 INSERT 策略（如果存在）
DROP POLICY IF EXISTS "用户创建自己的推广订单" ON public.promotion_orders;
DROP POLICY IF EXISTS "允许认证用户创建推广订单" ON public.promotion_orders;
DROP POLICY IF EXISTS "promotion_orders_insert_policy" ON public.promotion_orders;

-- 3. 创建新的 INSERT 策略 - 允许认证用户创建自己的订单
CREATE POLICY "允许认证用户创建推广订单"
ON public.promotion_orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. 也允许匿名用户创建（如果需要）
CREATE POLICY "允许匿名用户创建推广订单"
ON public.promotion_orders
FOR INSERT
TO anon
WITH CHECK (true);

-- 5. 确保 SELECT 策略也存在
DROP POLICY IF EXISTS "用户查看自己的推广订单" ON public.promotion_orders;
CREATE POLICY "用户查看自己的推广订单"
ON public.promotion_orders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 6. 验证策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'promotion_orders';
