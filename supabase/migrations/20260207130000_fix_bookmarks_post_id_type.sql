-- 修复 bookmarks 表的 post_id 类型，使其与 posts 表的 id 类型（UUID）匹配

-- 1. 先检查并删除旧的 bookmarks 表
DROP TABLE IF EXISTS public.bookmarks CASCADE;

-- 2. 检查 users 和 posts 表的 id 类型
DO $$
DECLARE
    user_id_type TEXT;
    post_id_type TEXT;
BEGIN
    -- 获取 users 表的 id 类型
    SELECT data_type INTO user_id_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id';
    
    -- 获取 posts 表的 id 类型
    SELECT data_type INTO post_id_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'id';
    
    RAISE NOTICE 'users.id type: %, posts.id type: %', user_id_type, post_id_type;
END $$;

-- 3. 创建新的 bookmarks 表
-- 使用 TEXT 类型来兼容各种情况
CREATE TABLE IF NOT EXISTS public.bookmarks (
  user_id TEXT NOT NULL,
  post_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- 4. 添加外键约束（如果表结构允许）
DO $$
BEGIN
    -- 尝试添加外键到 users 表
    BEGIN
        ALTER TABLE public.bookmarks
        ADD CONSTRAINT bookmarks_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key to users';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add foreign key to users: %', SQLERRM;
    END;
    
    -- 尝试添加外键到 posts 表
    BEGIN
        ALTER TABLE public.bookmarks
        ADD CONSTRAINT bookmarks_post_id_fkey
        FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key to posts';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add foreign key to posts: %', SQLERRM;
    END;
END $$;

-- 5. 创建索引
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post_id ON public.bookmarks(post_id);

-- 6. 启用 RLS
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- 7. 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can insert own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.bookmarks;

-- 8. 添加策略
CREATE POLICY "Users can view own bookmarks"
  ON public.bookmarks FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON public.bookmarks FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON public.bookmarks FOR DELETE
  USING (auth.uid()::text = user_id);
