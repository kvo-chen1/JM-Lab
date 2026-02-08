-- 创建用于后端 API works 表的评论和评论点赞表

-- 1. 创建 work_comments 表
DROP TABLE IF EXISTS public.work_comment_likes CASCADE;
DROP TABLE IF EXISTS public.work_comments CASCADE;

CREATE TABLE IF NOT EXISTS public.work_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.work_comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_work_comments_work_id ON public.work_comments(work_id);
CREATE INDEX idx_work_comments_user_id ON public.work_comments(user_id);
CREATE INDEX idx_work_comments_parent_id ON public.work_comments(parent_id);
CREATE INDEX idx_work_comments_created_at ON public.work_comments(created_at DESC);

ALTER TABLE public.work_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on work_comments"
  ON public.work_comments FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. 创建 work_comment_likes 表
CREATE TABLE IF NOT EXISTS public.work_comment_likes (
  user_id TEXT NOT NULL,
  comment_id UUID NOT NULL REFERENCES public.work_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, comment_id)
);

CREATE INDEX idx_work_comment_likes_user_id ON public.work_comment_likes(user_id);
CREATE INDEX idx_work_comment_likes_comment_id ON public.work_comment_likes(comment_id);

ALTER TABLE public.work_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on work_comment_likes"
  ON public.work_comment_likes FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3. 创建触发器函数来更新 likes_count
CREATE OR REPLACE FUNCTION update_work_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.work_comments 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.work_comments 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. 创建触发器
DROP TRIGGER IF EXISTS trigger_update_work_comment_likes ON public.work_comment_likes;

CREATE TRIGGER trigger_update_work_comment_likes
AFTER INSERT OR DELETE ON public.work_comment_likes
FOR EACH ROW
EXECUTE FUNCTION update_work_comment_likes_count();

-- 5. 将表添加到 realtime 发布
ALTER PUBLICATION supabase_realtime ADD TABLE public.work_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.work_comment_likes;

-- 6. 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';

-- ==========================================================================
-- 完成
-- ==========================================================================
