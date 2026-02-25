-- 为 feed_comments 表添加作者信息字段
-- 用于存储评论作者的用户名和头像

-- 1. 添加 author_name 字段
ALTER TABLE public.feed_comments 
ADD COLUMN IF NOT EXISTS author_name TEXT;

-- 2. 添加 author_avatar 字段
ALTER TABLE public.feed_comments 
ADD COLUMN IF NOT EXISTS author_avatar TEXT;

-- 3. 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';

-- ==========================================================================
-- 完成
-- ==========================================================================
