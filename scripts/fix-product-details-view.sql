-- 修复 product_details 视图，正确显示商家商品

-- 先删除旧的视图
DROP VIEW IF EXISTS product_details;

-- 创建新的 product_details 视图，从 products 表获取商家商品
CREATE VIEW product_details AS
SELECT 
  p.id,
  p.name,
  p.description,
  p.price,
  p.original_price,
  p.stock,
  COALESCE(p.sales_count, 0) as sales_count,
  0 as view_count,
  p.status,
  p.category as category_id,
  NULL as tags,
  p.images as cover_image,
  FALSE as is_featured,
  FALSE as is_hot,
  FALSE as is_new,
  p.merchant_id as seller_id,
  NULL as brand_id,
  p.created_at,
  p.updated_at
FROM products p
WHERE p.status = 'active';

-- 验证视图
SELECT 'product_details 视图已更新' as status;
SELECT COUNT(*) as total_products FROM product_details;

-- ============================================
-- 修复 get_merchant_dashboard_stats 函数 - 将 user_id 改为 buyer_id
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
  SELECT COALESCE(SUM(final_amount), 0) INTO today_sales
  FROM orders
  WHERE seller_id = merchant_uuid 
    AND status IN ('completed', 'paid')
    AND created_at >= CURRENT_DATE;

  -- 获取今日订单数
  SELECT COUNT(*) INTO today_orders
  FROM orders
  WHERE seller_id = merchant_uuid 
    AND created_at >= CURRENT_DATE;

  -- 获取今日访客数（从访问日志表，如果不存在则使用订单用户数作为估算）
  SELECT COALESCE(COUNT(DISTINCT buyer_id), 0) INTO today_visitors
  FROM orders
  WHERE seller_id = merchant_uuid 
    AND created_at >= CURRENT_DATE;

  -- 计算今日转化率
  IF today_visitors > 0 THEN
    today_conversion_rate := (today_orders::DECIMAL / today_visitors * 100);
  ELSE
    today_conversion_rate := 0;
  END IF;

  -- ==================== 昨日数据 ====================
  -- 获取昨日销售额
  SELECT COALESCE(SUM(final_amount), 0) INTO yesterday_sales
  FROM orders
  WHERE seller_id = merchant_uuid 
    AND status IN ('completed', 'paid')
    AND created_at >= CURRENT_DATE - INTERVAL '1 day'
    AND created_at < CURRENT_DATE;

  -- 获取昨日订单数
  SELECT COUNT(*) INTO yesterday_orders
  FROM orders
  WHERE seller_id = merchant_uuid 
    AND created_at >= CURRENT_DATE - INTERVAL '1 day'
    AND created_at < CURRENT_DATE;

  -- 获取昨日访客数
  SELECT COALESCE(COUNT(DISTINCT buyer_id), 0) INTO yesterday_visitors
  FROM orders
  WHERE seller_id = merchant_uuid 
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
  WHERE seller_id = merchant_uuid AND status = 'paid';

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

-- 验证函数更新
SELECT 'get_merchant_dashboard_stats 函数已修复 (user_id -> buyer_id)' as status;
