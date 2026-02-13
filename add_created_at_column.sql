-- 添加 created_at 列到 event_submissions 表

-- 1. 添加 created_at 列（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'event_submissions' 
                   AND column_name = 'created_at') THEN
        ALTER TABLE public.event_submissions 
        ADD COLUMN created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT * 1000);
        RAISE NOTICE 'Added created_at column';
    ELSE
        RAISE NOTICE 'created_at column already exists';
    END IF;
END $$;

-- 2. 验证结果
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'event_submissions'
ORDER BY ordinal_position;
