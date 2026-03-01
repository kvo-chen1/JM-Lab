-- 检查转盘活动数据
-- 查询活动和奖品

SELECT 'lottery_activities' as table_name, COUNT(*) as count FROM lottery_activities
UNION ALL
SELECT 'lottery_prizes' as table_name, COUNT(*) as count FROM lottery_prizes
UNION ALL
SELECT 'lottery_spin_records' as table_name, COUNT(*) as count FROM lottery_spin_records;

-- 查看活动详情
SELECT * FROM lottery_activities;

-- 查看奖品详情
SELECT 
    p.id,
    p.name,
    p.points,
    p.probability,
    p.stock,
    p.sort_order,
    p.is_enabled,
    p.activity_id,
    a.name as activity_name
FROM lottery_prizes p
JOIN lottery_activities a ON p.activity_id = a.id
ORDER BY p.sort_order;
