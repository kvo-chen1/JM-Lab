-- 添加 created_at 列到 event_submissions 表（简化版）

-- 添加 created_at 列（如果不存在）
ALTER TABLE public.event_submissions 
ADD COLUMN IF NOT EXISTS created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT * 1000);

-- 验证结果
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'event_submissions'
ORDER BY ordinal_position;
