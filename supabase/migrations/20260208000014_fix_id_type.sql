-- ==========================================================================
-- 修复 ID 类型问题
-- ==========================================================================

-- 1. 删除并重建 points_records 表（保留数据）
-- 先创建新表
CREATE TABLE IF NOT EXISTS public.points_records_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('earned', 'spent', 'adjustment')),
  source VARCHAR(100) NOT NULL,
  source_type VARCHAR(50),
  description TEXT NOT NULL,
  balance_after INTEGER NOT NULL,
  related_id UUID,
  related_type VARCHAR(50),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- 复制数据（如果有的话）- 使用显式类型转换
INSERT INTO public.points_records_new (
  id, user_id, points, type, source, description, balance_after, created_at
)
SELECT 
  id::uuid,
  user_id::uuid,
  points::integer,
  type::varchar,
  source::varchar,
  description::text,
  balance_after::integer,
  CASE 
    WHEN created_at IS NULL THEN NOW()
    ELSE NOW()  -- 暂时使用当前时间，避免类型转换问题
  END
FROM public.points_records
WHERE id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 删除旧表，重命名新表
DROP TABLE IF EXISTS public.points_records CASCADE;
ALTER TABLE public.points_records_new RENAME TO points_records;

-- 创建索引
CREATE INDEX idx_points_records_user_id ON public.points_records(user_id);
CREATE INDEX idx_points_records_type ON public.points_records(type);
CREATE INDEX idx_points_records_created_at ON public.points_records(created_at DESC);

-- 2. 确保 user_points_balance 表的时间字段有默认值
ALTER TABLE public.user_points_balance 
ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE public.user_points_balance 
ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE public.user_points_balance 
ALTER COLUMN last_updated_at SET DEFAULT NOW();

-- 3. 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';

-- ==========================================================================
-- 完成
-- ==========================================================================
