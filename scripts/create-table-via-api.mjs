/**
 * 通过 REST API 创建 merchant_applications 表
 */

const API_URL = 'http://localhost:3030/api/db/rest/v1';
const API_KEY = 'local-proxy-key';

async function createTable() {
  console.log('🔧 尝试通过 REST API 创建表...\n');

  // 首先尝试直接插入数据到 merchant_applications
  // 如果表不存在会返回错误
  const testData = {
    user_id: '00000000-0000-0000-0000-000000000000',
    store_name: '测试店铺',
    contact_name: '测试',
    contact_phone: '13800138000',
    status: 'pending'
  };

  try {
    console.log('📋 检查 merchant_applications 表是否存在...');
    const response = await fetch(`${API_URL}/merchant_applications?limit=1`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    if (response.status === 404) {
      console.log('❌ 表不存在，需要通过 SQL 创建');
      console.log('\n请手动执行以下 SQL：');
      console.log(`
-- 1. 创建 merchant_applications 表
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

-- 4. 创建 RLS 策略
CREATE POLICY "Users can view own applications"
  ON merchant_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON merchant_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications"
  ON merchant_applications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));
      `);
    } else if (response.ok) {
      console.log('✅ merchant_applications 表已存在');
      
      // 检查是否需要添加列
      const data = await response.json();
      console.log('表数据:', data);
    } else {
      console.error('❌ 检查表失败:', await response.text());
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
}

createTable();
