-- ==========================================================================
-- 修复 brand_tasks 表的 RLS 策略 - 允许发布者创建任务
-- ==========================================================================

-- 删除旧的策略（如果存在）
DROP POLICY IF EXISTS "发布者管理自己的任务" ON public.brand_tasks;
DROP POLICY IF EXISTS "发布者可以创建任务" ON public.brand_tasks;
DROP POLICY IF EXISTS "发布者可以查看自己的任务" ON public.brand_tasks;
DROP POLICY IF EXISTS "发布者可以更新自己的任务" ON public.brand_tasks;
DROP POLICY IF EXISTS "发布者可以删除自己的任务" ON public.brand_tasks;

-- 1. 任何人可以查看已发布的任务
DROP POLICY IF EXISTS "查看已发布品牌任务" ON public.brand_tasks;
CREATE POLICY "查看已发布品牌任务" ON public.brand_tasks
    FOR SELECT TO public
    USING (status = 'published');

-- 2. 发布者可以查看自己的所有任务（包括草稿）
CREATE POLICY "发布者查看自己的任务" ON public.brand_tasks
    FOR SELECT TO public
    USING (publisher_id = auth.uid());

-- 3. 发布者可以创建任务（关键修复）
CREATE POLICY "发布者创建任务" ON public.brand_tasks
    FOR INSERT TO public
    WITH CHECK (publisher_id = auth.uid());

-- 4. 发布者可以更新自己的任务
CREATE POLICY "发布者更新自己的任务" ON public.brand_tasks
    FOR UPDATE TO public
    USING (publisher_id = auth.uid());

-- 5. 发布者可以删除自己的任务
CREATE POLICY "发布者删除自己的任务" ON public.brand_tasks
    FOR DELETE TO public
    USING (publisher_id = auth.uid());

-- 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';

-- ==========================================================================
-- 完成
-- ==========================================================================
