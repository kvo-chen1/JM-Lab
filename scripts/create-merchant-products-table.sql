-- 创建商家商品表和修复架构
-- 解决文创商城和积分商城数据混淆问题

-- ============================================
-- 步骤1：创建商家商品表
-- ============================================
CREATE TABLE IF NOT EXISTS merchant_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  stock INTEGER DEFAULT 0,
  sold_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, sold_out
  category_id UUID,
  tags TEXT[],
  cover_image VARCHAR(500),
  images TEXT[],
  is_featured BOOLEAN DEFAULT false,
  is_hot BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_merchant_products_merchant_id ON merchant_products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_products_status ON merchant_products(status);
CREATE INDEX IF NOT EXISTS idx_merchant_products_category ON merchant_products(category_id);

-- 启用 RLS
ALTER TABLE merchant_products ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
DROP POLICY IF EXISTS "Anyone can view merchant products" ON merchant_products;
DROP POLICY IF EXISTS "Merchants can manage own products" ON merchant_products;

CREATE POLICY "Anyone can view merchant products"
  ON merchant_products FOR SELECT
  USING (true);

CREATE POLICY "Merchants can manage own products"
  ON merchant_products FOR ALL
  USING (auth.uid() = merchant_id);

-- ============================================
-- 步骤2：创建商家商品详情视图（供文创商城使用）
-- ============================================
DROP VIEW IF EXISTS merchant_product_details;

CREATE VIEW merchant_product_details AS
SELECT 
  mp.*,
  m.store_name as merchant_name,
  m.store_logo as merchant_logo,
  m.rating as merchant_rating
FROM merchant_products mp
LEFT JOIN merchants m ON mp.merchant_id = m.id
WHERE mp.status = 'active';

-- ============================================
-- 步骤3：修改 product_details 视图，只显示积分商品
-- ============================================
-- 先删除旧的视图
DROP VIEW IF EXISTS product_details;

-- 创建新的 product_details 视图，专门用于积分商城
CREATE VIEW product_details AS
SELECT 
  id,
  name,
  description,
  points as price,
  points as original_price,
  stock,
  0 as sold_count,
  0 as view_count,
  status,
  category as category_id,
  tags,
  image_url as cover_image,
  is_featured,
  false as is_hot,
  false as is_new,
  merchant_id as seller_id,
  null as brand_id,
  created_at,
  updated_at
FROM products
WHERE status = 'active';

-- ============================================
-- 步骤4：将 products 表中的数据迁移到 points_products 表
-- ============================================
-- 先清空 points_products 表
DELETE FROM points_products;

-- 迁移数据
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
FROM products;

-- ============================================
-- 步骤5：验证数据
-- ============================================
-- 检查新创建的表
SELECT 'merchant_products 表' as check_point, COUNT(*) as count FROM merchant_products;

-- 检查积分商品表
SELECT 'products 表（积分商品）' as check_point, COUNT(*) as count FROM products;
SELECT 'points_products 表' as check_point, COUNT(*) as count FROM points_products;

-- 检查视图
SELECT 'product_details 视图（积分商城）' as check_point, COUNT(*) as count FROM product_details;
SELECT 'merchant_product_details 视图（文创商城）' as check_point, COUNT(*) as count FROM merchant_product_details;
