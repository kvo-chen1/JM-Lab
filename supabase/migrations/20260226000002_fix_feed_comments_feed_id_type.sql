-- 修改 feed_comments 表的 feed_id 字段类型为 TEXT
-- 以支持非 UUID 格式的 feed ID（如 post_xxx, community_feed_xxx 等）

-- 1. 删除外键约束（如果有）
ALTER TABLE public.feed_comments
DROP CONSTRAINT IF EXISTS feed_comments_feed_id_fkey;

-- 2. 修改 feed_id 字段类型为 TEXT
ALTER TABLE public.feed_comments
ALTER COLUMN feed_id TYPE TEXT;

-- 3. 重新创建索引
DROP INDEX IF EXISTS idx_feed_comments_feed_id;
CREATE INDEX idx_feed_comments_feed_id ON public.feed_comments(feed_id);

-- 4. 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';

-- ==========================================================================
-- 完成
-- ==========================================================================
