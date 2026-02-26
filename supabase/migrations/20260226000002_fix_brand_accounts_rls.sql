-- ==========================================================================
-- 修复 brand_accounts 表的 RLS 策略 - 确保用户有完整权限
-- ==========================================================================

-- 删除旧的品牌账户相关策略（如果存在）
DROP POLICY IF EXISTS "查看自己的品牌账户" ON public.brand_accounts;
DROP POLICY IF EXISTS "管理自己的品牌账户" ON public.brand_accounts;
DROP POLICY IF EXISTS "创建自己的品牌账户" ON public.brand_accounts;
DROP POLICY IF EXISTS "更新自己的品牌账户" ON public.brand_accounts;

-- 确保 RLS 已启用
ALTER TABLE public.brand_accounts ENABLE ROW LEVEL SECURITY;

-- 1. 用户可以查看自己的品牌账户
CREATE POLICY "查看自己的品牌账户" ON public.brand_accounts
    FOR SELECT TO public
    USING (user_id = auth.uid());

-- 2. 用户可以创建自己的品牌账户
CREATE POLICY "创建自己的品牌账户" ON public.brand_accounts
    FOR INSERT TO public
    WITH CHECK (user_id = auth.uid());

-- 3. 用户可以更新自己的品牌账户
CREATE POLICY "更新自己的品牌账户" ON public.brand_accounts
    FOR UPDATE TO public
    USING (user_id = auth.uid());

-- 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';

-- ==========================================================================
-- 完成
-- ==========================================================================
