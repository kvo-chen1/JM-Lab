-- 修复 event_submissions 表的时间戳列类型
-- 将 bigint 类型改为 timestamptz

-- 1. 修改 created_at 列
ALTER TABLE public.event_submissions 
ALTER COLUMN created_at TYPE TIMESTAMPTZ USING to_timestamp(created_at / 1000.0);

-- 2. 修改 updated_at 列
ALTER TABLE public.event_submissions 
ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING to_timestamp(updated_at / 1000.0);

-- 3. 修改 submitted_at 列（如果存在且是 bigint）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'event_submissions' 
               AND column_name = 'submitted_at' 
               AND data_type = 'bigint') THEN
        ALTER TABLE public.event_submissions 
        ALTER COLUMN submitted_at TYPE TIMESTAMPTZ USING to_timestamp(submitted_at / 1000.0);
    END IF;
END $$;

-- 4. 验证结果
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'event_submissions'
AND column_name IN ('created_at', 'updated_at', 'submitted_at')
ORDER BY column_name;
