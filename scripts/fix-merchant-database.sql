-- 修复商家工作台相关的数据库问题

-- ============================================
-- 1. 创建 get_merchant_dashboard_stats 函数
-- ============================================
CREATE OR REPLACE FUNCTION get_merchant_dashboard_stats(merchant_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  total_sales DECIMAL;
  total_orders INTEGER;
  today_sales DECIMAL;
  today_orders INTEGER;
  pending_orders INTEGER;
  product_count INTEGER;
BEGIN
  -- 获取总销售额
  SELECT COALESCE(SUM(total_amount), 0) INTO total_sales
  FROM orders
  WHERE merchant_id = merchant_uuid AND status IN ('completed', 'paid');

  -- 获取总订单数
  SELECT COUNT(*) INTO total_orders
  FROM orders
  WHERE merchant_id = merchant_uuid;

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

  -- 获取待处理订单数
  SELECT COUNT(*) INTO pending_orders
  FROM orders
  WHERE merchant_id = merchant_uuid AND status = 'pending';

  -- 获取商品数量
  SELECT COUNT(*) INTO product_count
  FROM merchant_products
  WHERE merchant_id = merchant_uuid;

  result := json_build_object(
    'total_sales', total_sales,
    'total_orders', total_orders,
    'today_sales', today_sales,
    'today_orders', today_orders,
    'pending_orders', pending_orders,
    'product_count', product_count
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. 检查并添加 reviews 表的 merchant_id 列
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'merchant_id'
  ) THEN
    ALTER TABLE reviews ADD COLUMN merchant_id UUID REFERENCES merchants(id);
    CREATE INDEX idx_reviews_merchant_id ON reviews(merchant_id);
  END IF;
END $$;

-- ============================================
-- 3. 检查 orders 表结构
-- ============================================
-- 确保 orders 表有 merchant_id 列
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'merchant_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN merchant_id UUID REFERENCES merchants(id);
    CREATE INDEX idx_orders_merchant_id ON orders(merchant_id);
  END IF;
END $$;

-- ============================================
-- 4. 验证创建结果
-- ============================================
SELECT 'get_merchant_dashboard_stats 函数' as check_item, 
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_proc WHERE proname = 'get_merchant_dashboard_stats'
       ) THEN '已创建' ELSE '未创建' END as status;

SELECT 'reviews.merchant_id 列' as check_item,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns 
         WHERE table_name = 'reviews' AND column_name = 'merchant_id'
       ) THEN '已存在' ELSE '不存在' END as status;

SELECT 'orders.merchant_id 列' as check_item,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns 
         WHERE table_name = 'orders' AND column_name = 'merchant_id'
       ) THEN '已存在' ELSE '不存在' END as status;
