-- 商家申请表结构
-- 请在 Supabase SQL 编辑器中执行

-- 1. 创建 merchant_applications 表
CREATE TABLE IF NOT EXISTS merchant_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 店铺信息
  store_name VARCHAR(100) NOT NULL,
  store_description TEXT,
  store_logo VARCHAR(500),
  
  -- 联系人信息
  contact_name VARCHAR(50) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  contact_email VARCHAR(100),
  
  -- 资质文件
  business_license VARCHAR(500),
  id_card_front VARCHAR(500),
  id_card_back VARCHAR(500),
  
  -- 申请状态
  status VARCHAR(20) DEFAULT 'pending',
  rejection_reason TEXT,
  
  -- 审核信息
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP,
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- 约束
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_merchant_applications_user_id ON merchant_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_applications_status ON merchant_applications(status);
CREATE INDEX IF NOT EXISTS idx_merchant_applications_created_at ON merchant_applications(created_at);

-- 3. 修改 merchants 表，添加 application_id 字段
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES merchant_applications(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_merchants_application_id ON merchants(application_id);

-- 4. 启用 RLS
ALTER TABLE merchant_applications ENABLE ROW LEVEL SECURITY;

-- 5. 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Users can view own applications" ON merchant_applications;
DROP POLICY IF EXISTS "Users can insert own applications" ON merchant_applications;
DROP POLICY IF EXISTS "Users can update own applications" ON merchant_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON merchant_applications;
DROP POLICY IF EXISTS "Admins can update all applications" ON merchant_applications;

-- 6. 创建 RLS 策略
-- 用户可以查看自己的申请
CREATE POLICY "Users can view own applications"
  ON merchant_applications FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以提交自己的申请
CREATE POLICY "Users can insert own applications"
  ON merchant_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己待审核的申请
CREATE POLICY "Users can update own pending applications"
  ON merchant_applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- 管理员可以查看所有申请（使用 auth.users 的 email 来判断，假设管理员邮箱包含特定标识）
CREATE POLICY "Admins can view all applications"
  ON merchant_applications FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE email LIKE '%admin%' OR email LIKE '%@jinmai.com'
  ));

-- 管理员可以更新所有申请
CREATE POLICY "Admins can update all applications"
  ON merchant_applications FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE email LIKE '%admin%' OR email LIKE '%@jinmai.com'
  ));

-- 7. 创建触发器函数更新 updated_at
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
