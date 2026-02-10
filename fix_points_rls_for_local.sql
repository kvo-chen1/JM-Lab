-- 修复积分系统 RLS 策略，支持本地开发环境
-- 本地开发使用自定义认证，没有 Supabase auth session

-- 1. 删除现有的 RLS 策略
DROP POLICY IF EXISTS "Users can view own balance" ON public.user_points_balance;
DROP POLICY IF EXISTS "Users can update own balance" ON public.user_points_balance;
DROP POLICY IF EXISTS "Users can insert own balance" ON public.user_points_balance;
DROP POLICY IF EXISTS "Users can view own points records" ON public.points_records;
DROP POLICY IF EXISTS "Users can insert own points records" ON public.points_records;

-- 2. 创建允许所有已认证用户查看的宽松策略（仅用于开发环境）
-- 生产环境应该使用更严格的策略
CREATE POLICY "Allow all authenticated users to view balance" 
ON public.user_points_balance FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow all authenticated users to update balance" 
ON public.user_points_balance FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Allow all authenticated users to insert balance" 
ON public.user_points_balance FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to view points records" 
ON public.points_records FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow all authenticated users to insert points records" 
ON public.points_records FOR INSERT 
TO authenticated
WITH CHECK (true);

-- 3. 为 anon 用户也创建策略（如果需要）
CREATE POLICY "Allow anon users to view balance" 
ON public.user_points_balance FOR SELECT 
TO anon
USING (true);

CREATE POLICY "Allow anon users to view points records" 
ON public.points_records FOR SELECT 
TO anon
USING (true);

-- 4. 验证结果
SELECT 'RLS 策略已更新' as status;

-- 查看当前策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('user_points_balance', 'points_records')
ORDER BY tablename, policyname;
