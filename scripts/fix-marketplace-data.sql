-- 修复文创商城和积分商城数据混淆问题
-- 执行前请备份数据

-- ============================================
-- 问题：虚拟商品（积分商品）错误地存入了 products 表
-- 解决方案：
-- 1. 将 products 表中的虚拟商品移动到 points_products 表
-- 2. 清空 products 表中的虚拟商品数据
-- 3. 确保商家上架的商品进入正确的表
-- ============================================

-- 第1步：将 products 表中的虚拟商品迁移到 points_products 表
-- 虚拟商品的标识：category 为 'virtual' 或 name 包含特定关键词
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
  CASE 
    WHEN images IS NOT NULL AND array_length(images, 1) > 0 THEN images[1]
    ELSE cover_image
  END as image_url,
  COALESCE(price, 1000) as points,  -- 使用 price 字段作为积分价格
  COALESCE(stock, 100) as stock,
  'virtual' as category,  -- 设置为虚拟商品分类
  CASE 
    WHEN status = 'active' THEN 'active'
    WHEN status = 'inactive' THEN 'inactive'
    ELSE 'active'
  END as status,
  0 as sort_order,
  created_at,
  updated_at
FROM products
WHERE 
  -- 识别虚拟商品的条件
  (
    name LIKE '%红包%' OR
    name LIKE '%徽章%' OR
    name LIKE '%贴纸%' OR
    name LIKE '%表情包%' OR
    name LIKE '%头像框%' OR
    name LIKE '%优惠券%' OR
    name LIKE '%会员%' OR
    name LIKE '%课程%' OR
    name LIKE '%虚拟%' OR
    category = 'virtual'
  )
  AND (seller_id IS NULL OR seller_id = '');  -- 确保不是商家上架的商品

-- 第2步：删除 products 表中的虚拟商品
DELETE FROM products
WHERE 
  (
    name LIKE '%红包%' OR
    name LIKE '%徽章%' OR
    name LIKE '%贴纸%' OR
    name LIKE '%表情包%' OR
    name LIKE '%头像框%' OR
    name LIKE '%优惠券%' OR
    name LIKE '%会员%' OR
    name LIKE '%课程%' OR
    name LIKE '%虚拟%' OR
    category = 'virtual'
  )
  AND (seller_id IS NULL OR seller_id = '');

-- 第3步：验证数据
-- 检查 products 表剩余的商品（应该是商家上架的实物商品）
SELECT 'products 表剩余商品' as check_point, COUNT(*) as count FROM products;

-- 检查 points_products 表的商品（应该是虚拟商品）
SELECT 'points_products 表商品' as check_point, COUNT(*) as count FROM points_products;

-- 查看 products 表剩余的商品详情
SELECT id, name, price, stock, status, seller_id 
FROM products 
LIMIT 10;

-- 查看 points_products 表的商品详情
SELECT id, name, points, stock, status, category 
FROM points_products 
LIMIT 10;
