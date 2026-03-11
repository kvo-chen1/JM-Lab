-- 创建商家店铺表
-- 用于存储商家的店铺信息

-- ============================================
-- 创建 merchant_stores 表
-- ============================================
CREATE TABLE IF NOT EXISTS merchant_stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 基本信息
  store_name VARCHAR(100) NOT NULL,
  store_logo VARCHAR(500),
  store_description TEXT,
  categories TEXT[], -- 经营类目
  
  -- 联系信息
  contact_name VARCHAR(50) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  contact_email VARCHAR(100),
  store_address TEXT,
  
  -- 资质信息
  business_license VARCHAR(500),
  id_card_front VARCHAR(500),
  id_card_back VARCHAR(500),
  other_documents TEXT[],
  
  -- 状态
  status VARCHAR(20) DEFAULT 'active', -- active, inactive
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_merchant_stores_user_id ON merchant_stores(user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_stores_status ON merchant_stores(status);

-- 启用 RLS
ALTER TABLE merchant_stores ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Users can view own store" ON merchant_stores;
DROP POLICY IF EXISTS "Users can insert own store" ON merchant_stores;
DROP POLICY IF EXISTS "Users can update own store" ON merchant_stores;

-- 创建 RLS 策略
-- 用户可以查看自己的店铺
CREATE POLICY "Users can view own store"
  ON merchant_stores FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以创建自己的店铺
CREATE POLICY "Users can insert own store"
  ON merchant_stores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己的店铺
CREATE POLICY "Users can update own store"
  ON merchant_stores FOR UPDATE
  USING (auth.uid() = user_id);

-- 创建触发器函数更新 updated_at
CREATE OR REPLACE FUNCTION update_merchant_stores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_merchant_stores_updated_at_trigger ON merchant_stores;

CREATE TRIGGER update_merchant_stores_updated_at_trigger
  BEFORE UPDATE ON merchant_stores
  FOR EACH ROW
  EXECUTE FUNCTION update_merchant_stores_updated_at();

-- ============================================
-- 验证创建结果
-- ============================================
SELECT 'merchant_stores 表创建成功' as status, COUNT(*) as count FROM merchant_stores;
