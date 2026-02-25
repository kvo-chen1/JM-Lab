-- 创建 Feed 动态点赞和收藏表
-- 用于存储 Feed 页面动态的点赞和收藏数据

-- 1. 创建 feed_likes 表（动态点赞）
CREATE TABLE IF NOT EXISTS public.feed_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(feed_id, user_id)
);

CREATE INDEX idx_feed_likes_feed_id ON public.feed_likes(feed_id);
CREATE INDEX idx_feed_likes_user_id ON public.feed_likes(user_id);
CREATE INDEX idx_feed_likes_created_at ON public.feed_likes(created_at DESC);

ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on feed_likes"
  ON public.feed_likes FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. 创建 feed_collects 表（动态收藏）
CREATE TABLE IF NOT EXISTS public.feed_collects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(feed_id, user_id)
);

CREATE INDEX idx_feed_collects_feed_id ON public.feed_collects(feed_id);
CREATE INDEX idx_feed_collects_user_id ON public.feed_collects(user_id);
CREATE INDEX idx_feed_collects_created_at ON public.feed_collects(created_at DESC);

ALTER TABLE public.feed_collects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on feed_collects"
  ON public.feed_collects FOR ALL
  USING (true)
  WITH CHECK (true);

-- 注意：由于 Feed 数据存储在内存中（mock 数据），没有对应的 feeds 表
-- 所以不需要创建触发器来更新 feeds 表的计数
-- 点赞数和收藏数由前端通过查询 feed_likes 和 feed_collects 表来统计

-- 3. 将表添加到 realtime 发布
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_collects;

-- 4. 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';

-- ==========================================================================
-- 完成
-- ==========================================================================
