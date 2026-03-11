/**
 * 创建商家申请表 merchant_applications
 * 用于商家入驻申请流程
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMerchantApplicationsTable() {
  console.log('🔧 创建商家申请表...\n');

  try {
    // 1. 创建 merchant_applications 表
    console.log('📋 创建 merchant_applications 表...');
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
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
        
        -- 创建索引
        CREATE INDEX IF NOT EXISTS idx_merchant_applications_user_id ON merchant_applications(user_id);
        CREATE INDEX IF NOT EXISTS idx_merchant_applications_status ON merchant_applications(status);
        CREATE INDEX IF NOT EXISTS idx_merchant_applications_created_at ON merchant_applications(created_at);
      `
    });

    if (tableError) {
      console.error('❌ 创建表失败:', tableError.message);
      
      // 尝试直接执行 SQL
      console.log('尝试使用 REST API 创建表...');
      const { error: sqlError } = await supabase.from('merchant_applications').select('count').limit(1);
      
      if (sqlError && sqlError.code === '42P01') {
        console.log('表不存在，需要手动创建');
        console.log('\n请在 Supabase SQL 编辑器中执行以下 SQL:');
        console.log(`
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

CREATE INDEX IF NOT EXISTS idx_merchant_applications_user_id ON merchant_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_applications_status ON merchant_applications(status);
        `);
      }
    } else {
      console.log('✅ merchant_applications 表创建成功');
    }

    // 2. 添加 merchants 表的 application_id 字段
    console.log('\n📋 修改 merchants 表...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE merchants 
        ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES merchant_applications(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_merchants_application_id ON merchants(application_id);
      `
    });

    if (alterError) {
      console.error('❌ 修改 merchants 表失败:', alterError.message);
    } else {
      console.log('✅ merchants 表修改成功');
    }

    // 3. 设置 RLS 策略
    console.log('\n🔒 设置 RLS 策略...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- 启用 RLS
        ALTER TABLE merchant_applications ENABLE ROW LEVEL SECURITY;
        
        -- 删除现有策略
        DROP POLICY IF EXISTS "Users can view own applications" ON merchant_applications;
        DROP POLICY IF EXISTS "Users can insert own applications" ON merchant_applications;
        DROP POLICY IF EXISTS "Users can update own applications" ON merchant_applications;
        DROP POLICY IF EXISTS "Admins can view all applications" ON merchant_applications;
        DROP POLICY IF EXISTS "Admins can update all applications" ON merchant_applications;
        
        -- 创建策略
        CREATE POLICY "Users can view own applications"
          ON merchant_applications FOR SELECT
          USING (auth.uid() = user_id);
          
        CREATE POLICY "Users can insert own applications"
          ON merchant_applications FOR INSERT
          WITH CHECK (auth.uid() = user_id);
          
        CREATE POLICY "Users can update own pending applications"
          ON merchant_applications FOR UPDATE
          USING (auth.uid() = user_id AND status = 'pending');
          
        CREATE POLICY "Admins can view all applications"
          ON merchant_applications FOR SELECT
          USING (EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
          ));
          
        CREATE POLICY "Admins can update all applications"
          ON merchant_applications FOR UPDATE
          USING (EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
          ));
      `
    });

    if (rlsError) {
      console.error('❌ 设置 RLS 策略失败:', rlsError.message);
    } else {
      console.log('✅ RLS 策略设置成功');
    }

    // 4. 创建触发器函数更新 updated_at
    console.log('\n⏰ 创建触发器...');
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (triggerError) {
      console.error('❌ 创建触发器失败:', triggerError.message);
    } else {
      console.log('✅ 触发器创建成功');
    }

    console.log('\n✨ 数据库设置完成！');

  } catch (error) {
    console.error('\n❌ 执行失败:', error.message);
    process.exit(1);
  }
}

createMerchantApplicationsTable();
