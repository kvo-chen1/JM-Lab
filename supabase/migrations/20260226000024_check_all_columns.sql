-- ==========================================================================
-- 检查 promotion_orders 表的所有列类型
-- ==========================================================================

SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'promotion_orders'
ORDER BY ordinal_position;
