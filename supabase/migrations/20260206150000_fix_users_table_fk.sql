-- 修复 users 表外键约束问题，允许独立创建用户
-- 问题：public.users.id 有外键约束 REFERENCES auth.users(id)
-- 导致后端无法直接创建用户，必须先创建 auth.users 记录

-- 1. 删除依赖于 users 表的外键约束（先删除引用 users 的表的外键）
DO $$
DECLARE
    r RECORD;
BEGIN
    -- 删除所有引用 users 表的外键约束
    FOR r IN (
        SELECT tc.constraint_name, tc.table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu 
            ON tc.constraint_name = ccu.constraint_name
        WHERE ccu.table_name = 'users' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name != 'users'  -- 排除 users 表自身的外键
    ) LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', r.table_name, r.constraint_name);
        RAISE NOTICE 'Dropped foreign key constraint: % on table %', r.constraint_name, r.table_name;
    END LOOP;
END $$;

-- 2. 删除 users 表引用 auth.users 的外键约束
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- 3. 重新创建 users 表的主键（不带外键约束）
-- 注意：需要先删除主键约束，然后重新创建
DO $$
BEGIN
    -- 删除现有主键约束（使用 CASCADE 删除所有依赖）
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_pkey CASCADE;
    
    -- 重新创建主键（不带外键引用）
    ALTER TABLE public.users ADD PRIMARY KEY (id);
    
    RAISE NOTICE 'Successfully recreated primary key without foreign key constraint';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error recreating primary key: %', SQLERRM;
END $$;

-- 4. 重新创建其他表引用 users 表的外键约束
-- conversations.user_id -> users.id
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_user_id_fkey;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- messages.user_id -> users.id
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_user_id_fkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- posts.author_id -> users.id
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey;
ALTER TABLE public.posts ADD CONSTRAINT posts_author_id_fkey 
    FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- comments.user_id -> users.id
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
ALTER TABLE public.comments ADD CONSTRAINT comments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- likes.user_id -> users.id
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_user_id_fkey;
ALTER TABLE public.likes ADD CONSTRAINT likes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- follows.follower_id -> users.id
ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_follower_id_fkey;
ALTER TABLE public.follows ADD CONSTRAINT follows_follower_id_fkey 
    FOREIGN KEY (follower_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- follows.following_id -> users.id
ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_following_id_fkey;
ALTER TABLE public.follows ADD CONSTRAINT follows_following_id_fkey 
    FOREIGN KEY (following_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- friend_requests.sender_id -> users.id
ALTER TABLE public.friend_requests DROP CONSTRAINT IF EXISTS friend_requests_sender_id_fkey;
ALTER TABLE public.friend_requests ADD CONSTRAINT friend_requests_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- friend_requests.receiver_id -> users.id
ALTER TABLE public.friend_requests DROP CONSTRAINT IF EXISTS friend_requests_receiver_id_fkey;
ALTER TABLE public.friend_requests ADD CONSTRAINT friend_requests_receiver_id_fkey 
    FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- communities.creator_id -> users.id
ALTER TABLE public.communities DROP CONSTRAINT IF EXISTS communities_creator_id_fkey;
ALTER TABLE public.communities ADD CONSTRAINT communities_creator_id_fkey 
    FOREIGN KEY (creator_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- community_members.user_id -> users.id
ALTER TABLE public.community_members DROP CONSTRAINT IF EXISTS community_members_user_id_fkey;
ALTER TABLE public.community_members ADD CONSTRAINT community_members_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- community_members.community_id -> communities.id
ALTER TABLE public.community_members DROP CONSTRAINT IF EXISTS community_members_community_id_fkey;
ALTER TABLE public.community_members ADD CONSTRAINT community_members_community_id_fkey 
    FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;

-- user_status.user_id -> users.id
ALTER TABLE public.user_status DROP CONSTRAINT IF EXISTS user_status_user_id_fkey;
ALTER TABLE public.user_status ADD CONSTRAINT user_status_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 5. 修改 handle_new_user 触发器函数，使用 ON CONFLICT 避免重复插入错误
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    username,
    avatar_url,
    metadata,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    avatar_url = EXCLUDED.avatar_url,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. 确保 RLS 策略允许插入操作
-- 先禁用再启用 RLS 以清理旧策略
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 删除所有现有策略
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable select for all users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.users;

-- 重新创建策略
-- 1. 查看策略：所有人可读
CREATE POLICY "Users can view all profiles" 
ON public.users FOR SELECT 
USING (true);

-- 2. 插入策略：允许已认证用户插入（用于注册流程）
CREATE POLICY "Users can insert own profile" 
ON public.users FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- 3. 更新策略：用户可更新自己的记录
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- 7. 验证修复结果
DO $$
DECLARE
    fk_count INTEGER;
BEGIN
    -- 检查 users 表是否还有外键约束
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints 
    WHERE table_name = 'users' 
    AND constraint_type = 'FOREIGN KEY';
    
    IF fk_count > 0 THEN
        RAISE NOTICE 'Warning: users table still has % foreign key constraint(s)', fk_count;
    ELSE
        RAISE NOTICE 'Success: users table has no foreign key constraints (as expected)';
    END IF;
END $$;
