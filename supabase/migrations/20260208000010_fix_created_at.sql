-- ==========================================================================
-- 修复 created_at 字段类型
-- ==========================================================================

-- 1. 修改 points_records 表的 created_at 字段类型为 TIMESTAMPTZ
-- 首先删除旧的默认值约束
ALTER TABLE public.points_records 
ALTER COLUMN created_at DROP DEFAULT;

-- 修改字段类型
ALTER TABLE public.points_records 
ALTER COLUMN created_at TYPE TIMESTAMPTZ 
USING to_timestamp(created_at / 1000.0);

-- 设置新的默认值
ALTER TABLE public.points_records 
ALTER COLUMN created_at SET DEFAULT NOW();

-- 2. 同样修复其他表的时间字段（如果需要）
-- user_points_balance 表
ALTER TABLE public.user_points_balance 
ALTER COLUMN created_at TYPE TIMESTAMPTZ 
USING to_timestamp(created_at / 1000.0);

ALTER TABLE public.user_points_balance 
ALTER COLUMN updated_at TYPE TIMESTAMPTZ 
USING to_timestamp(updated_at / 1000.0);

ALTER TABLE public.user_points_balance 
ALTER COLUMN last_updated_at TYPE TIMESTAMPTZ 
USING to_timestamp(last_updated_at / 1000.0);

-- 3. 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';

-- ==========================================================================
-- 完成
-- ==========================================================================
