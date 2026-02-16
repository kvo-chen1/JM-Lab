-- 检查 event_submissions 表的所有列
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'event_submissions'
ORDER BY ordinal_position;
