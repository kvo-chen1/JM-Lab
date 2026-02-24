-- ==========================================================================
-- 为 works 表添加审核状态字段
-- ==========================================================================

-- 1. 添加状态字段
ALTER TABLE public.works
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));

-- 2. 为现有数据设置默认状态为 approved（已发布的内容视为已通过）
UPDATE public.works
SET status = 'approved'
WHERE status IS NULL;

-- 3. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_works_status ON public.works(status);

-- 4. 添加注释
COMMENT ON COLUMN public.works.status IS '内容审核状态: pending-待审核, approved-已通过, rejected-已拒绝';

-- ==========================================================================
-- 完成
-- ==========================================================================
NOTIFY pgrst, 'reload schema';
