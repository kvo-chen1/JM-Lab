-- 检查订单数据
SELECT 
    id,
    work_id,
    work_title,
    work_thumbnail,
    package_name,
    expected_views,
    final_price,
    status,
    created_at
FROM promotion_orders
ORDER BY created_at DESC
LIMIT 5;
