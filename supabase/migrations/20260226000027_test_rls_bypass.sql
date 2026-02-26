-- ==========================================================================
-- 临时测试：完全开放 promotion_orders 的 INSERT 权限
-- 用于诊断 RLS 问题
-- ==========================================================================

-- 1. 删除所有现有的 INSERT 策略
DROP POLICY IF EXISTS "用户创建推广订单" ON public.promotion_orders;
DROP POLICY IF EXISTS "用户创建自己的推广订单" ON public.promotion_orders;
DROP POLICY IF EXISTS "允许认证用户创建推广订单" ON public.promotion_orders;
DROP POLICY IF EXISTS "允许匿名用户创建推广订单" ON public.promotion_orders;
DROP POLICY IF EXISTS "promotion_orders_insert_policy" ON public.promotion_orders;

-- 2. 创建一个完全开放的 INSERT 策略（仅用于测试）
CREATE POLICY "用户创建推广订单"
ON public.promotion_orders
FOR INSERT
TO public
WITH CHECK (true);

-- 3. 验证策略
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
WHERE tablename = 'promotion_orders'
ORDER BY cmd, policyname;
