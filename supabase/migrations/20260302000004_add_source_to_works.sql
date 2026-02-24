-- ==========================================================================
-- 为 works 表添加来源字段，用于区分津脉广场作品
-- ==========================================================================

-- 1. 添加来源字段
ALTER TABLE public.works
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT '津脉广场' CHECK (source IN ('津脉广场', '活动', '品牌任务', '其他'));

-- 2. 为现有数据设置默认来源为津脉广场
UPDATE public.works
SET source = '津脉广场'
WHERE source IS NULL;

-- 3. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_works_source ON public.works(source);

-- 4. 添加注释
COMMENT ON COLUMN public.works.source IS '作品来源: 津脉广场、活动、品牌任务、其他';

-- ==========================================================================
-- 完成
-- ==========================================================================
NOTIFY pgrst, 'reload schema';
