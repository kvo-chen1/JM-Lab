-- 创建用于后端 API works 表的点赞和收藏表

-- 1. 创建 works_likes 表
DROP TABLE IF EXISTS public.works_likes CASCADE;

CREATE TABLE IF NOT EXISTS public.works_likes (
  user_id TEXT NOT NULL,
  work_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, work_id)
);

CREATE INDEX idx_works_likes_user_id ON public.works_likes(user_id);
CREATE INDEX idx_works_likes_work_id ON public.works_likes(work_id);

ALTER TABLE public.works_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on works_likes"
  ON public.works_likes FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. 创建 works_bookmarks 表
DROP TABLE IF EXISTS public.works_bookmarks CASCADE;

CREATE TABLE IF NOT EXISTS public.works_bookmarks (
  user_id TEXT NOT NULL,
  work_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, work_id)
);

CREATE INDEX idx_works_bookmarks_user_id ON public.works_bookmarks(user_id);
CREATE INDEX idx_works_bookmarks_work_id ON public.works_bookmarks(work_id);

ALTER TABLE public.works_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on works_bookmarks"
  ON public.works_bookmarks FOR ALL
  USING (true)
  WITH CHECK (true);
