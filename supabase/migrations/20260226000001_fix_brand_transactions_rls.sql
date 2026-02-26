-- ==========================================================================
-- 修复 brand_transactions 表的 RLS 策略 - 允许用户创建交易记录
-- ==========================================================================

-- 删除旧的交易相关策略（如果存在）
DROP POLICY IF EXISTS "查看自己的交易记录" ON public.brand_transactions;
DROP POLICY IF EXISTS "创建自己的交易记录" ON public.brand_transactions;
DROP POLICY IF EXISTS "管理自己的交易记录" ON public.brand_transactions;

-- 1. 用户可以查看自己的交易记录
CREATE POLICY "查看自己的交易记录" ON public.brand_transactions
    FOR SELECT TO public
    USING (user_id = auth.uid());

-- 2. 用户可以创建自己的交易记录（关键修复 - 充值需要）
CREATE POLICY "创建自己的交易记录" ON public.brand_transactions
    FOR INSERT TO public
    WITH CHECK (user_id = auth.uid());

-- 3. 用户可以更新自己的交易记录（用于更新交易状态）
CREATE POLICY "更新自己的交易记录" ON public.brand_transactions
    FOR UPDATE TO public
    USING (user_id = auth.uid());

-- 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';

-- ==========================================================================
-- 完成
-- ==========================================================================
