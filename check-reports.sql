-- 检查 reports 表中的数据
SELECT 
    id,
    reporter_id,
    target_type,
    target_id,
    report_type,
    status,
    description,
    created_at
FROM reports
ORDER BY created_at DESC
LIMIT 10;

-- 检查表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reports'
ORDER BY ordinal_position;

-- 检查约束
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'reports'::regclass;
