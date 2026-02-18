-- 创建活动收藏和点赞表
-- 支持活动的收藏和点赞功能

-- ============================================
-- 1. 创建 event_bookmarks 表（活动收藏）
-- ============================================
CREATE TABLE IF NOT EXISTS public.event_bookmarks (
  user_id TEXT NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_event_bookmarks_user_id ON public.event_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_event_bookmarks_event_id ON public.event_bookmarks(event_id);

-- 启用 RLS
ALTER TABLE public.event_bookmarks ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Allow all operations on event_bookmarks" ON public.event_bookmarks;
DROP POLICY IF EXISTS "Users can view own event bookmarks" ON public.event_bookmarks;
DROP POLICY IF EXISTS "Users can insert own event bookmarks" ON public.event_bookmarks;
DROP POLICY IF EXISTS "Users can delete own event bookmarks" ON public.event_bookmarks;

-- 创建新策略 - 允许所有操作（因为我们在应用层控制权限）
CREATE POLICY "Allow all operations on event_bookmarks"
  ON public.event_bookmarks FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 2. 创建 event_likes 表（活动点赞）
-- ============================================
CREATE TABLE IF NOT EXISTS public.event_likes (
  user_id TEXT NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_event_likes_user_id ON public.event_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_event_likes_event_id ON public.event_likes(event_id);

-- 启用 RLS
ALTER TABLE public.event_likes ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Allow all operations on event_likes" ON public.event_likes;
DROP POLICY IF EXISTS "Users can view own event likes" ON public.event_likes;
DROP POLICY IF EXISTS "Users can insert own event likes" ON public.event_likes;
DROP POLICY IF EXISTS "Users can delete own event likes" ON public.event_likes;

-- 创建新策略 - 允许所有操作（因为我们在应用层控制权限）
CREATE POLICY "Allow all operations on event_likes"
  ON public.event_likes FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 3. 添加注释
-- ============================================
COMMENT ON TABLE public.event_bookmarks IS '活动收藏表';
COMMENT ON TABLE public.event_likes IS '活动点赞表';
