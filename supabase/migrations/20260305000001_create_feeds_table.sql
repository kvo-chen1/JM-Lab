-- 创建 Feeds 动态表
-- 用于存储用户发布的动态/朋友圈

-- 1. 创建 feeds 表
CREATE TABLE IF NOT EXISTS public.feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  community_id TEXT,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 创建索引
CREATE INDEX idx_feeds_user_id ON public.feeds(user_id);
CREATE INDEX idx_feeds_community_id ON public.feeds(community_id);
CREATE INDEX idx_feeds_created_at ON public.feeds(created_at DESC);

-- 3. 启用 RLS
ALTER TABLE public.feeds ENABLE ROW LEVEL SECURITY;

-- 4. 创建 RLS 策略
CREATE POLICY "Allow all operations on feeds"
  ON public.feeds FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. 创建触发器函数来更新 updated_at
CREATE OR REPLACE FUNCTION update_feeds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 创建触发器
DROP TRIGGER IF EXISTS trigger_update_feeds_updated_at ON public.feeds;

CREATE TRIGGER trigger_update_feeds_updated_at
BEFORE UPDATE ON public.feeds
FOR EACH ROW
EXECUTE FUNCTION update_feeds_updated_at();

-- 7. 将表添加到 realtime 发布
ALTER PUBLICATION supabase_realtime ADD TABLE public.feeds;

-- 8. 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';

-- ==========================================================================
-- 完成
-- ==========================================================================
