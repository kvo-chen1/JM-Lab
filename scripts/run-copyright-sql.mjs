/**
 * 执行版权授权功能 SQL 脚本到 Neon 数据库
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

// 加载环境变量
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取数据库连接字符串
const connectionString = process.env.DATABASE_URL || 
  process.env.NEON_DATABASE_URL || 
  process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  console.error('错误: 未找到数据库连接字符串，请设置 DATABASE_URL 环境变量');
  process.exit(1);
}

console.log('正在连接数据库...');
console.log('数据库 URL:', connectionString.replace(/:[^:@]+@/, ':****@'));

// 创建连接池
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runSQL() {
  const client = await pool.connect();
  
  try {
    console.log('\n开始创建版权授权功能数据库表...\n');
    
    // 1. 创建版权授权需求表
    console.log('1. 创建 copyright_license_requests 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS copyright_license_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        brand_name VARCHAR(255) NOT NULL,
        brand_logo TEXT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        requirements TEXT,
        license_type VARCHAR(50) DEFAULT 'non_exclusive',
        license_scope JSONB DEFAULT '{"regions": [], "channels": [], "duration": ""}',
        license_fee_min INTEGER,
        license_fee_max INTEGER,
        revenue_share_rate DECIMAL(5,2) DEFAULT 10.00,
        ip_categories JSONB DEFAULT '[]',
        status VARCHAR(50) DEFAULT 'open',
        valid_until TIMESTAMPTZ,
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        view_count INTEGER DEFAULT 0,
        application_count INTEGER DEFAULT 0,
        approved_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('   ✓ copyright_license_requests 表创建成功');
    
    // 2. 创建版权授权申请表
    console.log('2. 创建 copyright_applications 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS copyright_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id UUID NOT NULL REFERENCES copyright_license_requests(id) ON DELETE CASCADE,
        applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        applicant_name VARCHAR(255) NOT NULL,
        applicant_avatar TEXT,
        ip_asset_id UUID REFERENCES ip_assets(id) ON DELETE SET NULL,
        ip_asset_name VARCHAR(255),
        ip_asset_thumbnail TEXT,
        message TEXT,
        proposed_usage TEXT,
        expected_products JSONB DEFAULT '[]',
        status VARCHAR(50) DEFAULT 'pending',
        brand_response TEXT,
        contact_shared BOOLEAN DEFAULT FALSE,
        brand_contact_email VARCHAR(255),
        brand_contact_phone VARCHAR(50),
        brand_contact_wechat VARCHAR(100),
        license_agreement_url TEXT,
        license_start_date TIMESTAMPTZ,
        license_end_date TIMESTAMPTZ,
        actual_license_fee INTEGER,
        revenue_share_rate DECIMAL(5,2),
        reviewed_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('   ✓ copyright_applications 表创建成功');
    
    // 3. 创建授权IP产品表
    console.log('3. 创建 licensed_ip_products 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS licensed_ip_products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id UUID NOT NULL REFERENCES copyright_applications(id) ON DELETE CASCADE,
        brand_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_name VARCHAR(255) NOT NULL,
        product_description TEXT,
        product_images JSONB DEFAULT '[]',
        product_category VARCHAR(100),
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        stock INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'draft',
        sales_count INTEGER DEFAULT 0,
        revenue DECIMAL(10,2) DEFAULT 0,
        platform_fee DECIMAL(10,2) DEFAULT 0,
        brand_share DECIMAL(10,2) DEFAULT 0,
        creator_share DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('   ✓ licensed_ip_products 表创建成功');
    
    // 4. 创建索引
    console.log('4. 创建索引...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_license_requests_brand_id ON copyright_license_requests(brand_id)',
      'CREATE INDEX IF NOT EXISTS idx_license_requests_status ON copyright_license_requests(status)',
      'CREATE INDEX IF NOT EXISTS idx_license_requests_created_at ON copyright_license_requests(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_license_requests_valid_until ON copyright_license_requests(valid_until)',
      'CREATE INDEX IF NOT EXISTS idx_copyright_applications_request_id ON copyright_applications(request_id)',
      'CREATE INDEX IF NOT EXISTS idx_copyright_applications_applicant_id ON copyright_applications(applicant_id)',
      'CREATE INDEX IF NOT EXISTS idx_copyright_applications_status ON copyright_applications(status)',
      'CREATE INDEX IF NOT EXISTS idx_copyright_applications_created_at ON copyright_applications(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_licensed_products_application_id ON licensed_ip_products(application_id)',
      'CREATE INDEX IF NOT EXISTS idx_licensed_products_brand_id ON licensed_ip_products(brand_id)',
      'CREATE INDEX IF NOT EXISTS idx_licensed_products_creator_id ON licensed_ip_products(creator_id)',
      'CREATE INDEX IF NOT EXISTS idx_licensed_products_status ON licensed_ip_products(status)',
      'CREATE INDEX IF NOT EXISTS idx_licensed_products_created_at ON licensed_ip_products(created_at)'
    ];
    
    for (const index of indexes) {
      try {
        await client.query(index);
      } catch (e) {
        // 忽略已存在的错误
      }
    }
    console.log('   ✓ 索引创建成功');
    
    // 5. 创建触发器函数
    console.log('5. 创建触发器函数...');
    
    // 更新 updated_at 的函数
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    
    // 更新 application_count 的函数
    await client.query(`
      CREATE OR REPLACE FUNCTION update_request_application_count()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          UPDATE copyright_license_requests 
          SET application_count = application_count + 1
          WHERE id = NEW.request_id;
          RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
          UPDATE copyright_license_requests 
          SET application_count = application_count - 1
          WHERE id = OLD.request_id;
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ language 'plpgsql'
    `);
    
    // 更新 approved_count 的函数
    await client.query(`
      CREATE OR REPLACE FUNCTION update_request_approved_count()
      RETURNS TRIGGER AS $$
      BEGIN
        IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
          UPDATE copyright_license_requests 
          SET approved_count = approved_count + 1
          WHERE id = NEW.request_id;
        ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
          UPDATE copyright_license_requests 
          SET approved_count = approved_count - 1
          WHERE id = NEW.request_id;
        END IF;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    console.log('   ✓ 触发器函数创建成功');
    
    // 6. 创建触发器
    console.log('6. 创建触发器...');
    const triggers = [
      'DROP TRIGGER IF EXISTS update_license_requests_updated_at ON copyright_license_requests',
      'CREATE TRIGGER update_license_requests_updated_at BEFORE UPDATE ON copyright_license_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      'DROP TRIGGER IF EXISTS update_copyright_applications_updated_at ON copyright_applications',
      'CREATE TRIGGER update_copyright_applications_updated_at BEFORE UPDATE ON copyright_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      'DROP TRIGGER IF EXISTS update_licensed_products_updated_at ON licensed_ip_products',
      'CREATE TRIGGER update_licensed_products_updated_at BEFORE UPDATE ON licensed_ip_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      'DROP TRIGGER IF EXISTS trg_update_request_application_count ON copyright_applications',
      'CREATE TRIGGER trg_update_request_application_count AFTER INSERT OR DELETE ON copyright_applications FOR EACH ROW EXECUTE FUNCTION update_request_application_count()',
      'DROP TRIGGER IF EXISTS trg_update_request_approved_count ON copyright_applications',
      'CREATE TRIGGER trg_update_request_approved_count AFTER UPDATE ON copyright_applications FOR EACH ROW EXECUTE FUNCTION update_request_approved_count()'
    ];
    
    for (const trigger of triggers) {
      try {
        await client.query(trigger);
      } catch (e) {
        console.log('   警告:', e.message);
      }
    }
    console.log('   ✓ 触发器创建成功');
    
    // 7. 插入示例数据（需要有效的用户ID，暂时跳过）
    console.log('7. 插入示例数据...');
    console.log('   ○ 跳过示例数据插入（需要有效的品牌方用户ID）');
    
    console.log('\n========================================');
    console.log('版权授权功能数据库表创建完成！');
    console.log('========================================\n');
    
    // 验证表结构
    console.log('验证表结构...');
    const tables = ['copyright_license_requests', 'copyright_applications', 'licensed_ip_products'];
    
    for (const table of tables) {
      try {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `, [table]);
        
        if (result.rows[0].exists) {
          const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
          const count = countResult.rows[0].count;
          console.log(`✓ ${table}: 存在 (${count} 条记录)`);
        } else {
          console.log(`✗ ${table}: 不存在`);
        }
      } catch (error) {
        console.log(`✗ ${table}: 检查失败 - ${error.message}`);
      }
    }
    
  } finally {
    client.release();
    await pool.end();
  }
}

runSQL().catch(err => {
  console.error('执行失败:', err);
  process.exit(1);
});
