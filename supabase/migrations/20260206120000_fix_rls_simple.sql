-- 修复 community_members 表的 RLS 策略问题
-- 在 Supabase SQL Editor 中执行

-- 先禁用 RLS 再重新启用（清理旧策略）
ALTER TABLE public.community_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- 删除所有现有策略
DROP POLICY IF EXISTS "Users can join communities" ON public.community_members;
DROP POLICY IF EXISTS "Community members are viewable by everyone" ON public.community_members;
DROP POLICY IF EXISTS "Users can leave communities" ON public.community_members;
DROP POLICY IF EXISTS "Users can update own membership" ON public.community_members;

-- 重新创建策略
-- 1. 查看策略：所有人可读
CREATE POLICY "Community members are viewable by everyone" 
ON public.community_members 
FOR SELECT 
USING (true);

-- 2. 插入策略：已认证用户可插入（修复加入社群问题）
CREATE POLICY "Users can join communities" 
ON public.community_members 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 3. 删除策略：用户可删除自己的记录
CREATE POLICY "Users can leave communities" 
ON public.community_members 
FOR DELETE 
USING (auth.uid() = user_id);

-- 4. 更新策略：用户可更新自己的记录
CREATE POLICY "Users can update own membership" 
ON public.community_members 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 同样修复 communities 表的策略
ALTER TABLE public.communities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Communities are viewable by everyone" ON public.communities;
DROP POLICY IF EXISTS "Users can create communities" ON public.communities;

CREATE POLICY "Communities are viewable by everyone" 
ON public.communities 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create communities" 
ON public.communities 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');
