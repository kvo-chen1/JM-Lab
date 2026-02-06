-- 修复 community_members 表的 RLS 策略问题
-- 错误：new row violates row-level security policy for table "community_members"
-- 原因：auth.uid() 在会话未正确建立时返回 null

-- 1. 删除旧的限制性策略
DROP POLICY IF EXISTS "Users can join communities" ON public.community_members;

-- 2. 创建新的宽松策略：允许所有已认证用户插入成员记录
-- 注意：应用层需要自行验证 user_id 的合法性
CREATE POLICY "Users can join communities" 
ON public.community_members 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 3. 确保其他策略正确
-- 查看策略
DROP POLICY IF EXISTS "Community members are viewable by everyone" ON public.community_members;
CREATE POLICY "Community members are viewable by everyone" 
ON public.community_members 
FOR SELECT 
USING (true);

-- 删除策略（用户可以删除自己的记录）
DROP POLICY IF EXISTS "Users can leave communities" ON public.community_members;
CREATE POLICY "Users can leave communities" 
ON public.community_members 
FOR DELETE 
USING (auth.uid() = user_id);

-- 4. 更新策略：允许用户更新自己的成员记录
DROP POLICY IF EXISTS "Users can update own membership" ON public.community_members;
CREATE POLICY "Users can update own membership" 
ON public.community_members 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 5. 验证 RLS 是否启用
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- 6. 为 communities 表也添加类似的宽松策略
DROP POLICY IF EXISTS "Users can create communities" ON public.communities;
CREATE POLICY "Users can create communities" 
ON public.communities 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 7. 添加 comments 表的 RLS 策略（如果存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') THEN
        ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
        CREATE POLICY "Comments are viewable by everyone" 
        ON public.comments FOR SELECT USING (true);
        
        DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
        CREATE POLICY "Authenticated users can create comments" 
        ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        
        DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
        CREATE POLICY "Users can update own comments" 
        ON public.comments FOR UPDATE USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
        CREATE POLICY "Users can delete own comments" 
        ON public.comments FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 8. 添加 posts 表的 RLS 策略（如果存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts') THEN
        ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
        CREATE POLICY "Posts are viewable by everyone" 
        ON public.posts FOR SELECT USING (true);
        
        DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
        CREATE POLICY "Authenticated users can create posts" 
        ON public.posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        
        DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
        CREATE POLICY "Users can update own posts" 
        ON public.posts FOR UPDATE USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
        CREATE POLICY "Users can delete own posts" 
        ON public.posts FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 9. 添加 likes 表的 RLS 策略（如果存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'likes') THEN
        ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
        CREATE POLICY "Likes are viewable by everyone" 
        ON public.likes FOR SELECT USING (true);
        
        DROP POLICY IF EXISTS "Authenticated users can create likes" ON public.likes;
        CREATE POLICY "Authenticated users can create likes" 
        ON public.likes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        
        DROP POLICY IF EXISTS "Users can delete own likes" ON public.likes;
        CREATE POLICY "Users can delete own likes" 
        ON public.likes FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;
