-- 创建 Feed 动态评论表
-- 用于存储 Feed 页面动态的评论

-- 1. 创建 feed_comments 表
CREATE TABLE IF NOT EXISTS public.feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.feed_comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feed_comments_feed_id ON public.feed_comments(feed_id);
CREATE INDEX idx_feed_comments_user_id ON public.feed_comments(user_id);
CREATE INDEX idx_feed_comments_parent_id ON public.feed_comments(parent_id);
CREATE INDEX idx_feed_comments_created_at ON public.feed_comments(created_at DESC);

ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on feed_comments"
  ON public.feed_comments FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. 创建 feed_comment_likes 表
CREATE TABLE IF NOT EXISTS public.feed_comment_likes (
  user_id TEXT NOT NULL,
  comment_id UUID NOT NULL REFERENCES public.feed_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, comment_id)
);

CREATE INDEX idx_feed_comment_likes_user_id ON public.feed_comment_likes(user_id);
CREATE INDEX idx_feed_comment_likes_comment_id ON public.feed_comment_likes(comment_id);

ALTER TABLE public.feed_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on feed_comment_likes"
  ON public.feed_comment_likes FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3. 创建触发器函数来更新 likes_count
CREATE OR REPLACE FUNCTION update_feed_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed_comments 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed_comments 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. 创建触发器
DROP TRIGGER IF EXISTS trigger_update_feed_comment_likes ON public.feed_comment_likes;

CREATE TRIGGER trigger_update_feed_comment_likes
AFTER INSERT OR DELETE ON public.feed_comment_likes
FOR EACH ROW
EXECUTE FUNCTION update_feed_comment_likes_count();

-- 5. 将表添加到 realtime 发布
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_comment_likes;

-- 6. 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';

-- ==========================================================================
-- 完成
-- ==========================================================================
