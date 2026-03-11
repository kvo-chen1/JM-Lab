-- 清理 products 表中的数据
-- 将所有积分商品移动到 points_products 表

-- ============================================
-- 步骤1：将 products 表中的所有数据迁移到 points_products 表
-- ============================================
INSERT INTO points_products (
  name,
  description,
  image_url,
  points,
  stock,
  category,
  status,
  sort_order,
  created_at,
  updated_at
)
SELECT 
  name,
  description,
  image_url,
  points,
  stock,
  COALESCE(category, 'virtual'),
  status,
  sort_order,
  created_at,
  updated_at
FROM products
WHERE NOT EXISTS (
  SELECT 1 FROM points_products WHERE points_products.name = products.name
);

-- ============================================
-- 步骤2：清空 products 表
-- ============================================
DELETE FROM products;

-- ============================================
-- 步骤3：验证清理结果
-- ============================================
SELECT 'products 表（已清空）' as check_point, COUNT(*) as count FROM products;
SELECT 'points_products 表' as check_point, COUNT(*) as count FROM points_products;
SELECT 'product_details 视图' as check_point, COUNT(*) as count FROM product_details;
