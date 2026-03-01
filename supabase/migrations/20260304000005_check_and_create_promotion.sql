-- ==========================================================================
-- 检查和创建推广数据
-- ==========================================================================

-- 1. 检查当前活跃推广
SELECT '当前活跃推广' as info;
SELECT 
  pw.id as promoted_work_id,
  pw.work_id,
  po.work_title,
  pw.status,
  pw.start_time,
  pw.end_time,
  pw.actual_views,
  pw.actual_clicks,
  (pw.end_time > NOW()) as is_not_expired
FROM promoted_works pw
JOIN promotion_orders po ON pw.order_id = po.id
WHERE pw.status = 'active'
ORDER BY pw.created_at DESC;

-- 2. 检查所有推广订单
SELECT '所有推广订单' as info;
SELECT 
  po.id as order_id,
  po.order_no,
  po.work_id,
  po.work_title,
  po.status as order_status,
  pw.status as work_status,
  pw.id as promoted_work_id
FROM promotion_orders po
LEFT JOIN promoted_works pw ON po.id = pw.order_id
ORDER BY po.created_at DESC
LIMIT 10;

-- 3. 如果没有活跃推广，创建测试数据
DO $$
DECLARE
  v_user_id UUID;
  v_work_id TEXT;
  v_order_id UUID;
  v_promoted_work_id UUID;
BEGIN
  -- 检查是否已有活跃推广
  IF EXISTS (SELECT 1 FROM promoted_works WHERE status = 'active' AND end_time > NOW()) THEN
    RAISE NOTICE '已有活跃推广，跳过创建';
    RETURN;
  END IF;

  -- 获取第一个用户
  SELECT id INTO v_user_id FROM users LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE NOTICE '没有找到用户';
    RETURN;
  END IF;

  -- 获取第一个已发布作品
  SELECT id::TEXT INTO v_work_id FROM works WHERE status = 'published' LIMIT 1;
  IF v_work_id IS NULL THEN
    RAISE NOTICE '没有找到已发布作品';
    RETURN;
  END IF;

  RAISE NOTICE '创建测试推广数据: user=%, work=%', v_user_id, v_work_id;

  -- 创建推广订单
  INSERT INTO promotion_orders (
    user_id,
    order_no,
    work_id,
    work_title,
    work_thumbnail,
    package_type,
    target_type,
    metric_type,
    original_price,
    discount_amount,
    final_price,
    status,
    payment_time,
    start_time,
    end_time,
    actual_views,
    actual_clicks
  ) VALUES (
    v_user_id,
    'TEST' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'),
    v_work_id,
    '测试推广作品',
    '',
    'standard',
    'account',
    'views',
    98,
    0,
    98,
    'active',
    NOW(),
    NOW(),
    NOW() + INTERVAL '24 hours',
    0,
    0
  )
  RETURNING id INTO v_order_id;

  -- 创建推广作品记录
  INSERT INTO promoted_works (
    order_id,
    work_id,
    user_id,
    package_type,
    target_type,
    metric_type,
    start_time,
    end_time,
    target_views,
    target_clicks,
    promotion_weight,
    priority_score,
    status,
    actual_views,
    actual_clicks
  ) VALUES (
    v_order_id,
    v_work_id,
    v_user_id,
    'standard',
    'account',
    'views',
    NOW(),
    NOW() + INTERVAL '24 hours',
    1000,
    50,
    1.0,
    100,
    'active',
    0,
    0
  )
  RETURNING id INTO v_promoted_work_id;

  RAISE NOTICE '成功创建测试推广数据: promoted_work_id=%', v_promoted_work_id;
END $$;

-- 4. 再次检查活跃推广
SELECT '创建后的活跃推广' as info;
SELECT 
  pw.id as promoted_work_id,
  pw.work_id,
  po.work_title,
  pw.status,
  pw.start_time,
  pw.end_time,
  pw.actual_views,
  pw.actual_clicks
FROM promoted_works pw
JOIN promotion_orders po ON pw.order_id = po.id
WHERE pw.status = 'active'
ORDER BY pw.created_at DESC;

NOTIFY pgrst, 'reload schema';
