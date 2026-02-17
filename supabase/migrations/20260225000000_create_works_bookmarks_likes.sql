-- 创建广场作品收藏和点赞表
-- 修复：我的收藏页面无法显示数据的问题

-- ============================================
-- 1. 创建 works_bookmarks 表（广场作品收藏）
-- ============================================
CREATE TABLE IF NOT EXISTS public.works_bookmarks (
  user_id TEXT NOT NULL,
  work_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, work_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_works_bookmarks_user_id ON public.works_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_works_bookmarks_work_id ON public.works_bookmarks(work_id);

-- 启用 RLS
ALTER TABLE public.works_bookmarks ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Allow all operations on works_bookmarks" ON public.works_bookmarks;
DROP POLICY IF EXISTS "Users can view own works bookmarks" ON public.works_bookmarks;
DROP POLICY IF EXISTS "Users can insert own works bookmarks" ON public.works_bookmarks;
DROP POLICY IF EXISTS "Users can delete own works bookmarks" ON public.works_bookmarks;

-- 创建新策略
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
-- 2. 创建 works_likes 表（广场作品点赞）
-- ============================================
CREATE TABLE IF NOT EXISTS public.works_likes (
  user_id TEXT NOT NULL,
  work_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, work_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_works_likes_user_id ON public.works_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_works_likes_work_id ON public.works_likes(work_id);

-- 启用 RLS
ALTER TABLE public.works_likes ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Allow all operations on works_likes" ON public.works_likes;
DROP POLICY IF EXISTS "Users can view own works likes" ON public.works_likes;
DROP POLICY IF EXISTS "Users can insert own works likes" ON public.works_likes;
DROP POLICY IF EXISTS "Users can delete own works likes" ON public.works_likes;

-- 创建新策略
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
COMMENT ON TABLE public.works_bookmarks IS '广场作品收藏表';
COMMENT ON TABLE public.works_likes IS '广场作品点赞表';
