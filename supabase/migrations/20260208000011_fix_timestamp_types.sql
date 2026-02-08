-- ==========================================================================
-- 修复时间戳字段类型（添加显式类型转换）
-- ==========================================================================

-- 1. 修改 points_records 表的 created_at 字段类型为 TIMESTAMPTZ
ALTER TABLE public.points_records 
ALTER COLUMN created_at DROP DEFAULT;

ALTER TABLE public.points_records 
ALTER COLUMN created_at TYPE TIMESTAMPTZ 
USING to_timestamp(created_at::bigint / 1000.0);

ALTER TABLE public.points_records 
ALTER COLUMN created_at SET DEFAULT NOW();

-- 2. 修复 user_points_balance 表的时间字段
ALTER TABLE public.user_points_balance 
ALTER COLUMN created_at TYPE TIMESTAMPTZ 
USING to_timestamp(created_at::bigint / 1000.0);

ALTER TABLE public.user_points_balance 
ALTER COLUMN updated_at TYPE TIMESTAMPTZ 
USING to_timestamp(updated_at::bigint / 1000.0);

ALTER TABLE public.user_points_balance 
ALTER COLUMN last_updated_at TYPE TIMESTAMPTZ 
USING to_timestamp(last_updated_at::bigint / 1000.0);

-- 3. 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';

-- ==========================================================================
-- 完成
-- ==========================================================================
