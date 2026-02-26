-- 测试收入数据查询
-- 请替换 'YOUR_USER_ID' 为实际的用户ID

-- 1. 查询 creator_revenue 表
SELECT 'creator_revenue' as table_name, *
FROM public.creator_revenue
WHERE user_id = 'YOUR_USER_ID';

-- 2. 查询 revenue_records 表
SELECT 'revenue_records' as table_name, *
FROM public.revenue_records
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;

-- 3. 查询 creator_earnings 表（品牌任务收益）
SELECT 'creator_earnings' as table_name, *
FROM public.creator_earnings
WHERE creator_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;

-- 4. 查询 brand_task_participants 表
SELECT 'brand_task_participants' as table_name, *
FROM public.brand_task_participants
WHERE creator_id = 'YOUR_USER_ID';

-- 5. 统计各表的总金额
SELECT 
    'creator_revenue.total_revenue' as metric,
    COALESCE(total_revenue, 0) as value
FROM public.creator_revenue
WHERE user_id = 'YOUR_USER_ID'
UNION ALL
SELECT 
    'revenue_records.sum' as metric,
    COALESCE(SUM(amount), 0) as value
FROM public.revenue_records
WHERE user_id = 'YOUR_USER_ID'
UNION ALL
SELECT 
    'creator_earnings.sum' as metric,
    COALESCE(SUM(amount), 0) as value
FROM public.creator_earnings
WHERE creator_id = 'YOUR_USER_ID'
AND status IN ('pending', 'approved', 'paid');
