-- 检查 event_participants 表的 updated_at 触发器
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table = 'event_participants'
AND (trigger_name ILIKE '%update%' OR action_statement ILIKE '%update%');

-- 检查所有触发器
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('event_submissions', 'event_participants');

-- 检查表结构
SELECT 
    table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name IN ('event_submissions', 'event_participants')
AND column_name IN ('created_at', 'updated_at', 'submitted_at', 'submission_date')
ORDER BY table_name, column_name;
