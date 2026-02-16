-- 检查 submission_full_details 视图是否存在
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name = 'submission_full_details';
