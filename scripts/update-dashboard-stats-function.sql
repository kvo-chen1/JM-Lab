-- 更新 get_merchant_dashboard_stats 函数，添加昨日数据对比和更多统计字段

-- ============================================
-- 1. 更新 get_merchant_dashboard_stats 函数
-- ============================================
CREATE OR REPLACE FUNCTION get_merchant_dashboard_stats(merchant_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  -- 今日数据
  today_sales DECIMAL;
  today_orders INTEGER;
  today_visitors INTEGER;
  today_conversion_rate DECIMAL;
  -- 昨日数据
  yesterday_sales DECIMAL;
  yesterday_orders INTEGER;
  yesterday_visitors INTEGER;
  yesterday_conversion_rate DECIMAL;
  -- 待办事项
  pending_orders INTEGER;
  pending_aftersales INTEGER;
  pending_reviews INTEGER;
  low_stock_products INTEGER;
  -- 商品统计
  total_products INTEGER;
  active_products INTEGER;
  inactive_products INTEGER;
BEGIN
  -- ==================== 今日数据 ====================
  -- 获取今日销售额
  SELECT COALESCE(SUM(total_amount), 0) INTO today_sales
  FROM orders
  WHERE merchant_id = merchant_uuid 
    AND status IN ('completed', 'paid')
    AND created_at >= CURRENT_DATE;

  -- 获取今日订单数
  SELECT COUNT(*) INTO today_orders
  FROM orders
  WHERE merchant_id = merchant_uuid 
    AND created_at >= CURRENT_DATE;

  -- 获取今日访客数（从访问日志表，如果不存在则使用订单用户数作为估算）
  SELECT COALESCE(COUNT(DISTINCT user_id), 0) INTO today_visitors
  FROM orders
  WHERE merchant_id = merchant_uuid 
    AND created_at >= CURRENT_DATE;

  -- 计算今日转化率
  IF today_visitors > 0 THEN
    today_conversion_rate := (today_orders::DECIMAL / today_visitors * 100);
  ELSE
    today_conversion_rate := 0;
  END IF;

  -- ==================== 昨日数据 ====================
  -- 获取昨日销售额
  SELECT COALESCE(SUM(total_amount), 0) INTO yesterday_sales
  FROM orders
  WHERE merchant_id = merchant_uuid 
    AND status IN ('completed', 'paid')
    AND created_at >= CURRENT_DATE - INTERVAL '1 day'
    AND created_at < CURRENT_DATE;

  -- 获取昨日订单数
  SELECT COUNT(*) INTO yesterday_orders
  FROM orders
  WHERE merchant_id = merchant_uuid 
    AND created_at >= CURRENT_DATE - INTERVAL '1 day'
    AND created_at < CURRENT_DATE;

  -- 获取昨日访客数
  SELECT COALESCE(COUNT(DISTINCT user_id), 0) INTO yesterday_visitors
  FROM orders
  WHERE merchant_id = merchant_uuid 
    AND created_at >= CURRENT_DATE - INTERVAL '1 day'
    AND created_at < CURRENT_DATE;

  -- 计算昨日转化率
  IF yesterday_visitors > 0 THEN
    yesterday_conversion_rate := (yesterday_orders::DECIMAL / yesterday_visitors * 100);
  ELSE
    yesterday_conversion_rate := 0;
  END IF;

  -- ==================== 待办事项 ====================
  -- 获取待发货订单数（已支付但未发货）
  SELECT COUNT(*) INTO pending_orders
  FROM orders
  WHERE merchant_id = merchant_uuid AND status = 'paid';

  -- 获取待处理售后数
  SELECT COUNT(*) INTO pending_aftersales
  FROM after_sales_requests
  WHERE merchant_id = merchant_uuid AND status = 'pending';

  -- 获取待回复评价数
  SELECT COUNT(*) INTO pending_reviews
  FROM reviews r
  JOIN products p ON r.product_id = p.id
  WHERE p.merchant_id = merchant_uuid AND r.merchant_reply IS NULL;

  -- 获取库存预警商品数（库存少于20）
  SELECT COUNT(*) INTO low_stock_products
  FROM products
  WHERE merchant_id = merchant_uuid AND stock < 20;

  -- ==================== 商品统计 ====================
  -- 获取商品总数
  SELECT COUNT(*) INTO total_products
  FROM products
  WHERE merchant_id = merchant_uuid;

  -- 获取上架商品数
  SELECT COUNT(*) INTO active_products
  FROM products
  WHERE merchant_id = merchant_uuid AND status = 'active';

  -- 获取下架商品数
  SELECT COUNT(*) INTO inactive_products
  FROM products
  WHERE merchant_id = merchant_uuid AND status = 'inactive';

  -- 构建返回结果
  result := json_build_object(
    -- 今日数据
    'today_sales', today_sales,
    'today_orders', today_orders,
    'today_visitors', today_visitors,
    'today_conversion_rate', ROUND(today_conversion_rate, 2),
    -- 昨日数据（用于计算环比）
    'yesterday_sales', yesterday_sales,
    'yesterday_orders', yesterday_orders,
    'yesterday_visitors', yesterday_visitors,
    'yesterday_conversion_rate', ROUND(yesterday_conversion_rate, 2),
    -- 待办事项
    'pending_orders', pending_orders,
    'pending_aftersales', pending_aftersales,
    'pending_reviews', pending_reviews,
    'low_stock_products', low_stock_products,
    -- 商品统计
    'total_products', total_products,
    'active_products', active_products,
    'inactive_products', inactive_products
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. 验证函数更新
-- ============================================
SELECT 'get_merchant_dashboard_stats 函数已更新' as status;

-- 测试函数（如果有测试商家ID的话，取消下面注释进行测试）
-- SELECT get_merchant_dashboard_stats('your-merchant-uuid-here'::UUID);
