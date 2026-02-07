-- 修复 users 表外键约束问题（使用 CASCADE）
-- 错误：无法删除约束 users_pkey，因为其他对象依赖于它

-- 方法：先删除依赖于 users 表的外键约束，然后修改 users 表

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. 删除所有依赖于 users 表的外键约束
    FOR r IN (
        SELECT tc.constraint_name, tc.table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu 
            ON tc.constraint_name = ccu.constraint_name
        WHERE ccu.table_name = 'users' 
        AND tc.constraint_type = 'FOREIGN KEY'
    ) LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', r.table_name, r.constraint_name);
        RAISE NOTICE 'Dropped foreign key constraint: % on table %', r.constraint_name, r.table_name;
    END LOOP;
    
    -- 2. 删除 users 表的外键约束（引用 auth.users）
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
    
    -- 3. 删除主键约束（使用 CASCADE 删除所有依赖）
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_pkey CASCADE;
    
    -- 4. 重新创建主键（不带外键）
    ALTER TABLE public.users ADD PRIMARY KEY (id);
    
    RAISE NOTICE 'Successfully removed foreign key constraint from users table';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
END $$;

-- 5. 重新创建外键约束（引用 users 表，但不强制 auth.users）
DO $$
DECLARE
    r RECORD;
BEGIN
    -- 重新创建外键约束（如果不存在）
    -- 注意：这里只重新创建那些引用 users 表的外键，不重新创建 users 表引用 auth.users 的外键
    
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
    
    RAISE NOTICE 'Successfully recreated foreign key constraints';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error recreating constraints: %', SQLERRM;
END $$;

-- 6. 验证结果
DO $$
DECLARE
    fk_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints 
    WHERE table_name = 'users' 
    AND constraint_type = 'FOREIGN KEY';
    
    IF fk_count = 0 THEN
        RAISE NOTICE 'Success: No foreign key constraints on users table';
    ELSE
        RAISE NOTICE 'Warning: % foreign key constraints still exist on users table', fk_count;
    END IF;
END $$;
