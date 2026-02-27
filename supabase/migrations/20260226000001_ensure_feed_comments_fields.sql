-- 确保 feed_comments 表有所有必需的字段
-- 包括 author_name 和 author_avatar

-- 1. 添加 author_name 字段（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'feed_comments' AND column_name = 'author_name'
    ) THEN
        ALTER TABLE public.feed_comments ADD COLUMN author_name TEXT;
    END IF;
END $$;

-- 2. 添加 author_avatar 字段（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'feed_comments' AND column_name = 'author_avatar'
    ) THEN
        ALTER TABLE public.feed_comments ADD COLUMN author_avatar TEXT;
    END IF;
END $$;

-- 3. 确保 parent_id 字段存在
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'feed_comments' AND column_name = 'parent_id'
    ) THEN
        ALTER TABLE public.feed_comments ADD COLUMN parent_id UUID REFERENCES public.feed_comments(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';

-- ==========================================================================
-- 完成
-- ==========================================================================
