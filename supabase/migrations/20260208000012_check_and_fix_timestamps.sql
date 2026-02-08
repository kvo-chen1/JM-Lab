-- ==========================================================================
-- 检查和修复时间戳字段
-- ==========================================================================

-- 1. 先检查 points_records 表的 created_at 字段类型
DO $$
DECLARE
  v_column_type TEXT;
BEGIN
  SELECT data_type INTO v_column_type
  FROM information_schema.columns
  WHERE table_name = 'points_records' AND column_name = 'created_at';
  
  RAISE NOTICE 'points_records.created_at type: %', v_column_type;
  
  -- 如果类型不是 timestamp with time zone，则进行转换
  IF v_column_type != 'timestamp with time zone' THEN
    -- 删除旧的默认值
    ALTER TABLE public.points_records 
    ALTER COLUMN created_at DROP DEFAULT;
    
    -- 修改字段类型
    ALTER TABLE public.points_records 
    ALTER COLUMN created_at TYPE TIMESTAMPTZ 
    USING CASE 
      WHEN created_at IS NULL THEN NOW()
      WHEN pg_typeof(created_at) = 'bigint'::regtype THEN to_timestamp(created_at::bigint / 1000.0)
      ELSE created_at::TIMESTAMPTZ
    END;
    
    -- 设置新的默认值
    ALTER TABLE public.points_records 
    ALTER COLUMN created_at SET DEFAULT NOW();
    
    RAISE NOTICE 'points_records.created_at converted to TIMESTAMPTZ';
  ELSE
    -- 已经是正确类型，只需要确保有默认值
    ALTER TABLE public.points_records 
    ALTER COLUMN created_at SET DEFAULT NOW();
    RAISE NOTICE 'points_records.created_at already TIMESTAMPTZ, set default NOW()';
  END IF;
END
$$;

-- 2. 确保 user_points_balance 表的时间字段有正确的类型和默认值
DO $$
DECLARE
  v_column_type TEXT;
BEGIN
  -- 检查 created_at
  SELECT data_type INTO v_column_type
  FROM information_schema.columns
  WHERE table_name = 'user_points_balance' AND column_name = 'created_at';
  
  IF v_column_type != 'timestamp with time zone' THEN
    ALTER TABLE public.user_points_balance 
    ALTER COLUMN created_at TYPE TIMESTAMPTZ 
    USING CASE 
      WHEN created_at IS NULL THEN NOW()
      WHEN pg_typeof(created_at) = 'bigint'::regtype THEN to_timestamp(created_at::bigint / 1000.0)
      ELSE created_at::TIMESTAMPTZ
    END;
  END IF;
  
  -- 检查 updated_at
  SELECT data_type INTO v_column_type
  FROM information_schema.columns
  WHERE table_name = 'user_points_balance' AND column_name = 'updated_at';
  
  IF v_column_type != 'timestamp with time zone' THEN
    ALTER TABLE public.user_points_balance 
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ 
    USING CASE 
      WHEN updated_at IS NULL THEN NOW()
      WHEN pg_typeof(updated_at) = 'bigint'::regtype THEN to_timestamp(updated_at::bigint / 1000.0)
      ELSE updated_at::TIMESTAMPTZ
    END;
  END IF;
  
  -- 检查 last_updated_at
  SELECT data_type INTO v_column_type
  FROM information_schema.columns
  WHERE table_name = 'user_points_balance' AND column_name = 'last_updated_at';
  
  IF v_column_type != 'timestamp with time zone' THEN
    ALTER TABLE public.user_points_balance 
    ALTER COLUMN last_updated_at TYPE TIMESTAMPTZ 
    USING CASE 
      WHEN last_updated_at IS NULL THEN NOW()
      WHEN pg_typeof(last_updated_at) = 'bigint'::regtype THEN to_timestamp(last_updated_at::bigint / 1000.0)
      ELSE last_updated_at::TIMESTAMPTZ
    END;
  END IF;
END
$$;

-- 3. 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';

-- ==========================================================================
-- 完成
-- ==========================================================================
