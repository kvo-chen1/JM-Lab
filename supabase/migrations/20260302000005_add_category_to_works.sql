-- ==========================================================================
-- 为 works 表添加分类字段
-- ==========================================================================

-- 1. 添加分类字段
ALTER TABLE public.works
ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- 2. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_works_category ON public.works(category);

-- 3. 添加注释
COMMENT ON COLUMN public.works.category IS '作品分类: 国潮设计、品牌联名、校园活动、文旅推广等';

-- ==========================================================================
-- 完成
-- ==========================================================================
NOTIFY pgrst, 'reload schema';
