-- 为 works 表添加浏览量字段
-- 用于统计每个作品的浏览次数

-- 1. 添加 view_count 字段
ALTER TABLE public.works
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 2. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_works_view_count ON public.works(view_count DESC);

-- 3. 创建增加浏览量的函数
CREATE OR REPLACE FUNCTION increment_work_view_count(work_id UUID)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE public.works
    SET view_count = view_count + 1
    WHERE id = work_id
    RETURNING view_count INTO new_count;
    
    RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 添加注释
COMMENT ON COLUMN public.works.view_count IS '作品浏览量统计';
COMMENT ON FUNCTION increment_work_view_count(UUID) IS '增加指定作品的浏览量并返回新的浏览量';

-- 5. 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';

-- ==========================================================================
-- 完成
-- ==========================================================================
