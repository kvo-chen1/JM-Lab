-- ==========================================================================
-- 修复 brand_tasks 表缺少 cover_image 和 cover_video 列的问题
-- ==========================================================================

-- 添加 cover_image 列（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'brand_tasks' AND column_name = 'cover_image'
    ) THEN
        ALTER TABLE public.brand_tasks ADD COLUMN cover_image TEXT;
        RAISE NOTICE '已添加 cover_image 列';
    ELSE
        RAISE NOTICE 'cover_image 列已存在';
    END IF;
END $$;

-- 添加 cover_video 列（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'brand_tasks' AND column_name = 'cover_video'
    ) THEN
        ALTER TABLE public.brand_tasks ADD COLUMN cover_video TEXT;
        RAISE NOTICE '已添加 cover_video 列';
    ELSE
        RAISE NOTICE 'cover_video 列已存在';
    END IF;
END $$;

-- 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';

-- ==========================================================================
-- 完成
-- ==========================================================================
