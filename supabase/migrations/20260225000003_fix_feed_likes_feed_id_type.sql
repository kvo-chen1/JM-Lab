-- 修复 feed_likes 和 feed_collects 表的 feed_id 字段类型
-- 将 UUID 改为 TEXT，以支持非 UUID 格式的 feed ID（如 community_feed_xxx）

-- 1. 修改 feed_likes 表的 feed_id 字段类型
ALTER TABLE public.feed_likes 
DROP CONSTRAINT IF EXISTS feed_likes_feed_id_fkey;

ALTER TABLE public.feed_likes 
ALTER COLUMN feed_id TYPE TEXT;

-- 2. 修改 feed_collects 表的 feed_id 字段类型
ALTER TABLE public.feed_collects 
DROP CONSTRAINT IF EXISTS feed_collects_feed_id_fkey;

ALTER TABLE public.feed_collects 
ALTER COLUMN feed_id TYPE TEXT;

-- 3. 修改 feed_comments 表的 feed_id 字段类型
ALTER TABLE public.feed_comments 
ALTER COLUMN feed_id TYPE TEXT;

-- 4. 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';

-- ==========================================================================
-- 完成
-- ==========================================================================
