-- 检查 events 表结构
-- 在 Supabase SQL Editor 中执行

-- 查看 events 表的所有列
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
ORDER BY ordinal_position;

-- 查看表中的数据（只选几个关键字段）
SELECT 
    id,
    title,
    description,
    organizer_id,
    status,
    created_at
FROM events
LIMIT 5;
