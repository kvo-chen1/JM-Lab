-- 商家申请表 - 简化版
-- 请完整执行此文件

-- 1. 先创建表
CREATE TABLE IF NOT EXISTS merchant_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name VARCHAR(100) NOT NULL,
  store_description TEXT,
  store_logo VARCHAR(500),
  contact_name VARCHAR(50) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  contact_email VARCHAR(100),
  business_license VARCHAR(500),
  id_card_front VARCHAR(500),
  id_card_back VARCHAR(500),
  status VARCHAR(20) DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_merchant_applications_user_id ON merchant_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_applications_status ON merchant_applications(status);

-- 3. 启用 RLS
ALTER TABLE merchant_applications ENABLE ROW LEVEL SECURITY;

-- 4. 删除旧策略
DROP POLICY IF EXISTS "Users can view own applications" ON merchant_applications;
DROP POLICY IF EXISTS "Users can insert own applications" ON merchant_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON merchant_applications;
DROP POLICY IF EXISTS "Admins can update all applications" ON merchant_applications;

-- 5. 创建新策略
CREATE POLICY "Users can view own applications"
  ON merchant_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON merchant_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications"
  ON merchant_applications FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE email LIKE '%admin%' OR email LIKE '%@jinmai.com'
  ));

CREATE POLICY "Admins can update all applications"
  ON merchant_applications FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE email LIKE '%admin%' OR email LIKE '%@jinmai.com'
  ));

-- 6. 创建触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_merchant_applications_updated_at ON merchant_applications;

CREATE TRIGGER update_merchant_applications_updated_at
  BEFORE UPDATE ON merchant_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
