-- ==========================================================================
-- 修复 promotion_orders 的 RLS 策略
-- 允许 public 角色进行 INSERT 操作
-- ==========================================================================

-- 1. 删除所有现有的 INSERT 策略
DROP POLICY IF EXISTS "用户创建推广订单" ON public.promotion_orders;
DROP POLICY IF EXISTS "用户创建自己的推广订单" ON public.promotion_orders;
DROP POLICY IF EXISTS "允许认证用户创建推广订单" ON public.promotion_orders;
DROP POLICY IF EXISTS "允许匿名用户创建推广订单" ON public.promotion_orders;
DROP POLICY IF EXISTS "promotion_orders_insert_policy" ON public.promotion_orders;

-- 2. 创建新的 INSERT 策略 - 允许所有用户（public）创建订单
-- 通过 WITH CHECK 确保只能插入自己的 user_id
CREATE POLICY "用户创建推广订单"
ON public.promotion_orders
FOR INSERT
TO public
WITH CHECK (user_id = auth.uid());

-- 3. 确保 SELECT 策略也存在（使用 public 角色）
DROP POLICY IF EXISTS "用户查看自己的推广订单" ON public.promotion_orders;
CREATE POLICY "用户查看自己的推广订单"
ON public.promotion_orders
FOR SELECT
TO public
USING (user_id = auth.uid());

-- 4. 确保 UPDATE 策略也存在（使用 public 角色）
DROP POLICY IF EXISTS "用户更新自己的推广订单" ON public.promotion_orders;
CREATE POLICY "用户更新自己的推广订单"
ON public.promotion_orders
FOR UPDATE
TO public
USING (user_id = auth.uid());

-- 5. 验证策略
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
