-- 修复 likes 表的 user_id 类型
-- 将 UUID 改为 TEXT 以支持后端登录用户的 user_id

-- ============================================
-- 1. 删除旧表并重新创建 likes 表
-- ============================================

-- 删除旧表（这会删除所有点赞数据）
DROP TABLE IF EXISTS public.likes CASCADE;

-- 重新创建 likes 表，使用 TEXT 类型的 user_id
CREATE TABLE IF NOT EXISTS public.likes (
  user_id TEXT NOT NULL,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);

-- 启用 RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "Users can view own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.likes;

-- 创建新策略 - 允许通过 user_id 文本匹配
CREATE POLICY "Users can view own likes"
  ON public.likes FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own likes"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own likes"
  ON public.likes FOR DELETE
  USING (auth.uid()::text = user_id);

-- ============================================
-- 2. 修复 bookmarks 表的 RLS 策略
-- ============================================

-- 删除旧策略
DROP POLICY IF EXISTS "Users can insert own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.bookmarks;

-- 创建新策略 - 允许通过 user_id 文本匹配
CREATE POLICY "Users can view own bookmarks"
  ON public.bookmarks FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON public.bookmarks FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON public.bookmarks FOR DELETE
  USING (auth.uid()::text = user_id);

-- ============================================
-- 3. 修复 works_likes 表的 RLS 策略
-- ============================================

-- 删除旧策略
DROP POLICY IF EXISTS "Users can insert own works likes" ON public.works_likes;
DROP POLICY IF EXISTS "Users can delete own works likes" ON public.works_likes;
DROP POLICY IF EXISTS "Users can view own works likes" ON public.works_likes;

-- 创建新策略 - 允许通过 user_id 文本匹配
CREATE POLICY "Users can view own works likes"
  ON public.works_likes FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own works likes"
  ON public.works_likes FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own works likes"
  ON public.works_likes FOR DELETE
  USING (auth.uid()::text = user_id);

-- ============================================
-- 4. 修复 works_bookmarks 表的 RLS 策略
-- ============================================

-- 删除旧策略
DROP POLICY IF EXISTS "Users can insert own works bookmarks" ON public.works_bookmarks;
DROP POLICY IF EXISTS "Users can delete own works bookmarks" ON public.works_bookmarks;
DROP POLICY IF EXISTS "Users can view own works bookmarks" ON public.works_bookmarks;

-- 创建新策略 - 允许通过 user_id 文本匹配
CREATE POLICY "Users can view own works bookmarks"
  ON public.works_bookmarks FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own works bookmarks"
  ON public.works_bookmarks FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own works bookmarks"
  ON public.works_bookmarks FOR DELETE
  USING (auth.uid()::text = user_id);

-- 添加注释
COMMENT ON TABLE public.likes IS '社区帖子点赞表（user_id 为 TEXT 类型，支持后端登录用户）';
COMMENT ON TABLE public.bookmarks IS '社区帖子收藏表（支持 user_id 文本匹配）';
COMMENT ON TABLE public.works_likes IS '广场作品点赞表（支持 user_id 文本匹配）';
COMMENT ON TABLE public.works_bookmarks IS '广场作品收藏表（支持 user_id 文本匹配）';
