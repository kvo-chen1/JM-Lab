-- 修复积分系统 RLS 策略
-- 问题：user_points_balance 表的外键关联到 auth.users，但查询时可能遇到 RLS 问题

-- 1. 先禁用 RLS 进行测试（临时）
-- ALTER TABLE public.user_points_balance DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.points_records DISABLE ROW LEVEL SECURITY;

-- 2. 删除现有策略
DROP POLICY IF EXISTS "Users can view own balance" ON public.user_points_balance;
DROP POLICY IF EXISTS "Users can update own balance" ON public.user_points_balance;
DROP POLICY IF EXISTS "Users can insert own balance" ON public.user_points_balance;
DROP POLICY IF EXISTS "Users can view own points records" ON public.points_records;
DROP POLICY IF EXISTS "Users can insert own points records" ON public.points_records;

-- 3. 创建更宽松的策略（允许已认证用户查看所有数据，用于调试）
-- 生产环境应该使用更严格的策略
CREATE POLICY "Users can view own balance" ON public.user_points_balance
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own balance" ON public.user_points_balance
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own balance" ON public.user_points_balance
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own points records" ON public.points_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own points records" ON public.points_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. 确保表已启用 RLS
ALTER TABLE public.user_points_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_records ENABLE ROW LEVEL SECURITY;

-- 5. 验证数据
SELECT 'user_points_balance 记录数:' as info, COUNT(*) as count FROM public.user_points_balance
UNION ALL
SELECT 'points_records 记录数:', COUNT(*) FROM public.points_records
UNION ALL
SELECT 'users 表记录数:', COUNT(*) FROM public.users;
