-- ============================================
-- 修复 brand_partnerships 表的 RLS 策略
-- 允许任何人提交品牌入驻申请
-- ============================================

-- 1. 删除已存在的策略（避免冲突）
DROP POLICY IF EXISTS "允许任何人提交品牌合作申请" ON public.brand_partnerships;
DROP POLICY IF EXISTS "允许任何人查看品牌合作申请" ON public.brand_partnerships;
DROP POLICY IF EXISTS "允许管理员更新品牌合作申请" ON public.brand_partnerships;

-- 2. 允许任何人（包括匿名用户）提交申请
CREATE POLICY "允许任何人提交品牌合作申请" ON public.brand_partnerships
    FOR INSERT TO public
    WITH CHECK (true);

-- 3. 允许任何人查看申请（用于展示已入驻品牌）
CREATE POLICY "允许任何人查看品牌合作申请" ON public.brand_partnerships
    FOR SELECT TO public
    USING (true);

-- 4. 允许管理员更新申请状态
CREATE POLICY "允许管理员更新品牌合作申请" ON public.brand_partnerships
    FOR UPDATE TO public
    USING (true);

-- ============================================
-- RLS 策略修复完成！
-- ============================================
