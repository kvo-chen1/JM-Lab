import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '.env') });
const envLocalPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

// 获取连接字符串
function getConnectionString() {
  return process.env.POSTGRES_URL_NON_POOLING || 
         process.env.DATABASE_URL || 
         process.env.POSTGRES_URL ||
         process.env.NEON_DATABASE_URL;
}

async function createTables() {
  const connectionString = getConnectionString();
  
  if (!connectionString) {
    console.error('❌ 未找到数据库连接字符串');
    process.exit(1);
  }
  
  console.log('=================================');
  console.log('  创建版权授权相关表');
  console.log('=================================\n');
  
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
      requestCert: true,
      agent: false
    }
  });
  
  try {
    // 1. 创建版权授权需求表
    console.log('1. 创建 copyright_license_requests 表...');
    await pool.query(`
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
    await pool.query(`
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
    await pool.query(`
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
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_license_requests_brand_id ON copyright_license_requests(brand_id);
      CREATE INDEX IF NOT EXISTS idx_license_requests_status ON copyright_license_requests(status);
      CREATE INDEX IF NOT EXISTS idx_license_requests_created_at ON copyright_license_requests(created_at);
      CREATE INDEX IF NOT EXISTS idx_license_requests_valid_until ON copyright_license_requests(valid_until);
      
      CREATE INDEX IF NOT EXISTS idx_copyright_applications_request_id ON copyright_applications(request_id);
      CREATE INDEX IF NOT EXISTS idx_copyright_applications_applicant_id ON copyright_applications(applicant_id);
      CREATE INDEX IF NOT EXISTS idx_copyright_applications_status ON copyright_applications(status);
      CREATE INDEX IF NOT EXISTS idx_copyright_applications_created_at ON copyright_applications(created_at);
      
      CREATE INDEX IF NOT EXISTS idx_licensed_products_application_id ON licensed_ip_products(application_id);
      CREATE INDEX IF NOT EXISTS idx_licensed_products_brand_id ON licensed_ip_products(brand_id);
      CREATE INDEX IF NOT EXISTS idx_licensed_products_creator_id ON licensed_ip_products(creator_id);
      CREATE INDEX IF NOT EXISTS idx_licensed_products_status ON licensed_ip_products(status);
      CREATE INDEX IF NOT EXISTS idx_licensed_products_created_at ON licensed_ip_products(created_at);
    `);
    console.log('   ✓ 索引创建成功');

    // 5. 创建触发器函数
    console.log('5. 创建触发器...');
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_license_requests_updated_at ON copyright_license_requests;
      CREATE TRIGGER update_license_requests_updated_at 
        BEFORE UPDATE ON copyright_license_requests
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_copyright_applications_updated_at ON copyright_applications;
      CREATE TRIGGER update_copyright_applications_updated_at 
        BEFORE UPDATE ON copyright_applications
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_licensed_products_updated_at ON licensed_ip_products;
      CREATE TRIGGER update_licensed_products_updated_at 
        BEFORE UPDATE ON licensed_ip_products
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('   ✓ 触发器创建成功');

    // 6. 插入示例数据
    console.log('6. 插入示例数据...');
    await pool.query(`
      INSERT INTO copyright_license_requests (
        brand_id, brand_name, brand_logo, title, description, requirements,
        license_type, license_scope, license_fee_min, license_fee_max, revenue_share_rate,
        ip_categories, status, valid_until, contact_email, contact_phone
      ) VALUES 
      (
        'f3dedf79-5c5e-40fd-9513-d0fb0995d429',
        '天津文旅集团',
        'https://example.com/logos/tianjin-culture.png',
        '天津城市文创IP授权合作',
        '诚邀优秀创作者使用天津城市元素进行文创产品设计，包括但不限于：天津之眼、意式风情区、古文化街等标志性景点。',
        '1. 作品需体现天津文化特色；2. 设计风格不限，鼓励创新；3. 需提供完整设计方案；4. 有文创产品设计经验者优先。',
        'non_exclusive',
        '{"regions": ["中国大陆", "港澳台"], "channels": ["线上电商", "线下门店", "景区合作"], "duration": "2年"}',
        5000,
        50000,
        15.00,
        '["illustration", "pattern", "design", "3d_model"]',
        'open',
        NOW() + INTERVAL '3 months',
        'license@tianjinculture.com',
        '022-12345678'
      ),
      (
        'f3dedf79-5c5e-40fd-9513-d0fb0995d429',
        '海河传媒',
        'https://example.com/logos/haihe-media.png',
        '海河主题插画授权征集',
        '为海河传媒旗下产品线征集海河主题插画作品，用于文创产品开发。',
        '1. 需展现海河风光或沿岸建筑；2. 风格可为写实或艺术化；3. 分辨率不低于300dpi；4. 需提供源文件。',
        'non_exclusive',
        '{"regions": ["中国大陆"], "channels": ["线上电商", "媒体合作"], "duration": "1年"}',
        3000,
        20000,
        12.00,
        '["illustration", "pattern"]',
        'open',
        NOW() + INTERVAL '2 months',
        'creative@haihemedia.com',
        '022-87654321'
      )
      ON CONFLICT DO NOTHING;
    `);
    console.log('   ✓ 示例数据插入成功');

    await pool.end();
    
    console.log('\n=================================');
    console.log('  ✅ 所有表创建完成！');
    console.log('=================================');
    
  } catch (error) {
    console.error('\n❌ 创建失败!');
    console.error(`   错误信息: ${error.message}`);
    await pool.end();
    process.exit(1);
  }
}

createTables();
