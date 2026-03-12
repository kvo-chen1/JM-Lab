-- 检查 user_favorites 表的结构
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'user_favorites' 
ORDER BY 
    ordinal_position;

-- 或者使用 PostgreSQL 的 describe 方式
\d user_favorites

-- 检查表是否存在以及其约束
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM 
    information_schema.table_constraints tc
LEFT JOIN 
    information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE 
    tc.table_name = 'user_favorites';
