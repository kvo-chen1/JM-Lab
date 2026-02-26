-- 立即修复 RLS 策略
-- 在 Supabase Studio SQL Editor 中执行

-- 1. 先禁用 RLS 测试
ALTER TABLE public.promotion_orders DISABLE ROW LEVEL SECURITY;

-- 2. 重新启用 RLS
ALTER TABLE public.promotion_orders ENABLE ROW LEVEL SECURITY;

-- 3. 删除所有现有策略
DROP POLICY IF EXISTS "用户创建推广订单" ON public.promotion_orders;
DROP POLICY IF EXISTS "用户创建自己的推广订单" ON public.promotion_orders;
DROP POLICY IF EXISTS "允许认证用户创建推广订单" ON public.promotion_orders;
DROP POLICY IF EXISTS "允许匿名用户创建推广订单" ON public.promotion_orders;
DROP POLICY IF EXISTS "promotion_orders_insert_policy" ON public.promotion_orders;
DROP POLICY IF EXISTS "用户查看自己的推广订单" ON public.promotion_orders;
DROP POLICY IF EXISTS "用户更新自己的推广订单" ON public.promotion_orders;

-- 4. 创建完全开放的策略（先测试用）
CREATE POLICY "允许所有操作"
ON public.promotion_orders
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 5. 验证
SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'promotion_orders';
