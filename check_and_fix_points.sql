-- 检查并修复积分系统问题
-- 1. 检查 user_points_balance 表中的 user_id 是否存在于 auth.users

-- 查看当前积分数据
SELECT 
    upb.user_id,
    upb.balance,
    upb.total_earned,
    upb.total_spent,
    u.username,
    u.email
FROM public.user_points_balance upb
LEFT JOIN public.users u ON upb.user_id = u.id;

-- 2. 检查 auth.users 中的用户（通过 RPC 或手动检查）
-- 注意：需要管理员权限才能查询 auth.users

-- 3. 如果存在不匹配，可能需要同步数据
-- 以下 SQL 用于修复可能的外键问题

-- 临时禁用外键检查（仅用于诊断）
-- SET session_replication_role = 'replica';

-- 4. 重新启用 RLS 并确保策略正确
ALTER TABLE public.user_points_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_records ENABLE ROW LEVEL SECURITY;

-- 5. 创建或更新 RLS 策略
DROP POLICY IF EXISTS "Users can view own balance" ON public.user_points_balance;
DROP POLICY IF EXISTS "Users can update own balance" ON public.user_points_balance;
DROP POLICY IF EXISTS "Users can insert own balance" ON public.user_points_balance;

CREATE POLICY "Users can view own balance" 
ON public.user_points_balance FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own balance" 
ON public.user_points_balance FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own balance" 
ON public.user_points_balance FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 6. 验证结果
SELECT '修复完成' as status, 
       (SELECT COUNT(*) FROM public.user_points_balance) as balance_count,
       (SELECT COUNT(*) FROM public.points_records) as records_count;
