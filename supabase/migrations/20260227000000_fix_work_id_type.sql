-- 修复 works_bookmarks 和 works_likes 表的 work_id 类型
-- 将 INTEGER 改为 UUID 以匹配 works 表的 id 类型

-- ============================================
-- 1. 修复 works_bookmarks 表
-- ============================================

-- 删除旧表（如果存在数据，需要先备份）
-- 注意：这会删除所有收藏数据，请确保已经备份或可以接受数据丢失
DROP TABLE IF EXISTS public.works_bookmarks CASCADE;

-- 重新创建 works_bookmarks 表，使用正确的类型
CREATE TABLE IF NOT EXISTS public.works_bookmarks (
  user_id TEXT NOT NULL,
  work_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, work_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_works_bookmarks_user_id ON public.works_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_works_bookmarks_work_id ON public.works_bookmarks(work_id);

-- 启用 RLS
ALTER TABLE public.works_bookmarks ENABLE ROW LEVEL SECURITY;

-- 创建策略
DROP POLICY IF EXISTS "Users can view own works bookmarks" ON public.works_bookmarks;
DROP POLICY IF EXISTS "Users can insert own works bookmarks" ON public.works_bookmarks;
DROP POLICY IF EXISTS "Users can delete own works bookmarks" ON public.works_bookmarks;

CREATE POLICY "Users can view own works bookmarks"
  ON public.works_bookmarks FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own works bookmarks"
  ON public.works_bookmarks FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own works bookmarks"
  ON public.works_bookmarks FOR DELETE
  USING (auth.uid()::text = user_id);

-- ============================================
-- 2. 修复 works_likes 表
-- ============================================

-- 删除旧表（如果存在数据，需要先备份）
-- 注意：这会删除所有点赞数据，请确保已经备份或可以接受数据丢失
DROP TABLE IF EXISTS public.works_likes CASCADE;

-- 重新创建 works_likes 表，使用正确的类型
CREATE TABLE IF NOT EXISTS public.works_likes (
  user_id TEXT NOT NULL,
  work_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, work_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_works_likes_user_id ON public.works_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_works_likes_work_id ON public.works_likes(work_id);

-- 启用 RLS
ALTER TABLE public.works_likes ENABLE ROW LEVEL SECURITY;

-- 创建策略
DROP POLICY IF EXISTS "Users can view own works likes" ON public.works_likes;
DROP POLICY IF EXISTS "Users can insert own works likes" ON public.works_likes;
DROP POLICY IF EXISTS "Users can delete own works likes" ON public.works_likes;

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
-- 3. 添加注释
-- ============================================
COMMENT ON TABLE public.works_bookmarks IS '广场作品收藏表（work_id 为 UUID 类型）';
COMMENT ON TABLE public.works_likes IS '广场作品点赞表（work_id 为 UUID 类型）';
