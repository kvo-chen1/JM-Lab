-- ==========================================================================
-- 简单直接的修复方案
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

-- 复制数据（如果有的话）
INSERT INTO public.points_records_new (
  id, user_id, points, type, source, description, balance_after, created_at
)
SELECT 
  id, user_id, points, type, source, description, balance_after,
  CASE 
    WHEN created_at IS NULL THEN NOW()
    WHEN pg_typeof(created_at) = 'bigint'::regtype THEN to_timestamp(created_at::text::bigint / 1000.0)
    ELSE created_at::text::TIMESTAMPTZ
  END
FROM public.points_records
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
