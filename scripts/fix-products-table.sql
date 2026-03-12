-- 修复 products 表结构，添加商家商品所需的列

-- ============================================
-- 1. 添加缺失的列
-- ============================================

-- 添加 price 列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'price'
  ) THEN
    ALTER TABLE products ADD COLUMN price DECIMAL(10, 2);
  END IF;
END $$;

-- 添加 original_price 列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'original_price'
  ) THEN
    ALTER TABLE products ADD COLUMN original_price DECIMAL(10, 2);
  END IF;
END $$;

-- 添加 stock 列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'stock'
  ) THEN
    ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0;
  END IF;
END $$;

-- 添加 category 列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'category'
  ) THEN
    ALTER TABLE products ADD COLUMN category VARCHAR(100);
  END IF;
END $$;

-- 添加 images 列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'images'
  ) THEN
    ALTER TABLE products ADD COLUMN images TEXT[];
  END IF;
END $$;

-- 添加 sales_count 列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'sales_count'
  ) THEN
    ALTER TABLE products ADD COLUMN sales_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- 添加 rating 列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'rating'
  ) THEN
    ALTER TABLE products ADD COLUMN rating DECIMAL(3, 2) DEFAULT 5.0;
  END IF;
END $$;

-- 添加 review_count 列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'review_count'
  ) THEN
    ALTER TABLE products ADD COLUMN review_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- 添加 merchant_id 列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'merchant_id'
  ) THEN
    ALTER TABLE products ADD COLUMN merchant_id UUID REFERENCES merchants(id);
    CREATE INDEX idx_products_merchant_id ON products(merchant_id);
  END IF;
END $$;

-- ============================================
-- 2. 验证表结构
-- ============================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products'
ORDER BY ordinal_position;
