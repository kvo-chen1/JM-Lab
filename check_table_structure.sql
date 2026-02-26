-- 检查 promotion_orders 表结构
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'promotion_orders'
ORDER BY ordinal_position;
