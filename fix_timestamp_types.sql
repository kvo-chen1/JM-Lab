-- 统一 event_submissions 表的时间戳列为 bigint 类型

-- 1. 修改 submitted_at 列为 bigint
ALTER TABLE public.event_submissions 
ALTER COLUMN submitted_at TYPE BIGINT USING EXTRACT(EPOCH FROM submitted_at)::BIGINT * 1000;

-- 2. 修改 updated_at 列为 bigint
ALTER TABLE public.event_submissions 
ALTER COLUMN updated_at TYPE BIGINT USING EXTRACT(EPOCH FROM updated_at)::BIGINT * 1000;

-- 3. 验证结果
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'event_submissions'
AND column_name IN ('created_at', 'updated_at', 'submitted_at', 'submission_date')
ORDER BY column_name;
