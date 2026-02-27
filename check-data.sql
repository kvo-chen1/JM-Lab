-- 检查 reports 表中的数据
SELECT COUNT(*) as total FROM reports;

-- 查看所有数据
SELECT 
    id,
    report_type,
    status,
    LEFT(description, 30) as description_preview,
    created_at
FROM reports
ORDER BY created_at DESC;

-- 检查表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reports';
