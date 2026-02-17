-- 修复 likes 和 bookmarks 表的 RLS 策略
-- 允许通过 user_id 文本匹配进行插入/删除操作

-- ============================================
-- 1. 修复 likes 表（社区帖子点赞）
-- ============================================

-- 删除旧策略
DROP POLICY IF EXISTS "Users can insert own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can view own likes" ON public.likes;

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
-- 2. 修复 bookmarks 表（社区帖子收藏）
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
-- 3. 修复 works_likes 表（广场作品点赞）
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
-- 4. 修复 works_bookmarks 表（广场作品收藏）
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
COMMENT ON TABLE public.likes IS '社区帖子点赞表（支持 user_id 文本匹配）';
COMMENT ON TABLE public.bookmarks IS '社区帖子收藏表（支持 user_id 文本匹配）';
COMMENT ON TABLE public.works_likes IS '广场作品点赞表（支持 user_id 文本匹配）';
COMMENT ON TABLE public.works_bookmarks IS '广场作品收藏表（支持 user_id 文本匹配）';
