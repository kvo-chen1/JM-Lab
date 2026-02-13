-- 检查并修复 event_submissions 表的所有时间戳列
-- 统一为 bigint 类型

-- 1. 检查当前列类型
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'event_submissions'
AND column_name IN ('created_at', 'updated_at', 'submitted_at', 'submission_date')
ORDER BY column_name;
