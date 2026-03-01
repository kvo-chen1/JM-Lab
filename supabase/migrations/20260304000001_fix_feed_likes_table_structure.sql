-- 修复 feed_likes 和 feed_collects 表结构
-- 确保 feed_id 字段类型为 TEXT，且没有外键约束指向不存在的 feeds 表

-- 1. 检查并删除可能存在的外键约束
ALTER TABLE public.feed_likes 
DROP CONSTRAINT IF EXISTS feed_likes_feed_id_fkey;

ALTER TABLE public.feed_likes 
DROP CONSTRAINT IF EXISTS feed_likes_feed_id_foreign;

-- 2. 确保 feed_likes 表的 feed_id 字段为 TEXT 类型
ALTER TABLE public.feed_likes 
ALTER COLUMN feed_id TYPE TEXT;

-- 3. 确保 user_id 字段为 TEXT 类型
ALTER TABLE public.feed_likes 
ALTER COLUMN user_id TYPE TEXT;

-- 4. 检查并删除 feed_collects 可能存在的外键约束
ALTER TABLE public.feed_collects 
DROP CONSTRAINT IF EXISTS feed_collects_feed_id_fkey;

ALTER TABLE public.feed_collects 
DROP CONSTRAINT IF EXISTS feed_collects_feed_id_foreign;

-- 5. 确保 feed_collects 表的 feed_id 字段为 TEXT 类型
ALTER TABLE public.feed_collects 
ALTER COLUMN feed_id TYPE TEXT;

-- 6. 确保 user_id 字段为 TEXT 类型
ALTER TABLE public.feed_collects 
ALTER COLUMN user_id TYPE TEXT;

-- 7. 检查并删除 feed_comments 可能存在的外键约束
ALTER TABLE public.feed_comments 
DROP CONSTRAINT IF EXISTS feed_comments_feed_id_fkey;

ALTER TABLE public.feed_comments 
DROP CONSTRAINT IF EXISTS feed_comments_feed_id_foreign;

-- 8. 确保 feed_comments 表的 feed_id 字段为 TEXT 类型
ALTER TABLE public.feed_comments 
ALTER COLUMN feed_id TYPE TEXT;

-- 9. 确保 user_id 字段为 TEXT 类型
ALTER TABLE public.feed_comments 
ALTER COLUMN user_id TYPE TEXT;

-- 10. 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';

-- ==========================================================================
-- 完成
-- ==========================================================================
