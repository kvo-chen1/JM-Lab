-- 修复 event_participants 表的时间戳列
-- 统一为 bigint 类型

-- 1. 检查当前列类型
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'event_participants'
AND column_name IN ('submission_date', 'updated_at', 'created_at')
ORDER BY column_name;
