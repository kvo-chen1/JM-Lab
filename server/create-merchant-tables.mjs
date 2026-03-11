/**
 * 创建商家相关的数据库表
 */

import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const { Pool } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

dotenv.config({ path: path.join(projectRoot, '.env') })

const envLocalPath = path.join(projectRoot, '.env.local')
if (fs.existsSync(envLocalPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envLocalPath))
  for (const k in envConfig) {
    process.env[k] = envConfig[k]
  }
  console.log('[Create Merchant Tables] 已加载 .env.local 文件')
}

const connectionString = process.env.DATABASE_URL || 
                        process.env.POSTGRES_URL_NON_POOLING ||
                        process.env.POSTGRES_URL ||
                        process.env.NEON_DATABASE_URL

console.log('[Create Merchant Tables] 数据库连接:', connectionString?.replace(/:[^:@]+@/, ':***@'))

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('localhost') ? false : { 
    rejectUnauthorized: false 
  }
})

async function createMerchantTables() {
  const client = await pool.connect()
  
  try {
    console.log('[Create Merchant Tables] 开始创建商家相关表...')

    // 1. 创建 merchants 表（商家表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS merchants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          store_name VARCHAR(255) NOT NULL,
          store_logo TEXT,
          store_description TEXT,
          contact_name VARCHAR(255),
          contact_phone VARCHAR(50),
          contact_email VARCHAR(255),
          business_license TEXT,
          id_card_front TEXT,
          id_card_back TEXT,
          status VARCHAR(50) DEFAULT 'pending',
          rating NUMERIC(3,2) DEFAULT 5.0,
          total_sales INTEGER DEFAULT 0,
          total_products INTEGER DEFAULT 0,
          rejection_reason TEXT,
          reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
          reviewed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id)
      )
    `)
    console.log('[Create Merchant Tables] merchants 表已创建或已存在')

    // 2. 创建 merchant_applications 表（商家申请表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS merchant_applications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          store_name VARCHAR(255) NOT NULL,
          store_logo TEXT,
          store_description TEXT,
          contact_name VARCHAR(255),
          contact_phone VARCHAR(50),
          contact_email VARCHAR(255),
          business_license TEXT,
          id_card_front TEXT,
          id_card_back TEXT,
          status VARCHAR(50) DEFAULT 'pending',
          rejection_reason TEXT,
          reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
          reviewed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('[Create Merchant Tables] merchant_applications 表已创建或已存在')

    // 3. 创建 merchant_products 表（商家商品表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS merchant_products (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price NUMERIC(10,2) NOT NULL,
          original_price NUMERIC(10,2),
          stock INTEGER DEFAULT 0,
          sold_count INTEGER DEFAULT 0,
          view_count INTEGER DEFAULT 0,
          status VARCHAR(50) DEFAULT 'active',
          category_id UUID,
          tags TEXT[],
          cover_image TEXT,
          images TEXT[],
          is_featured BOOLEAN DEFAULT false,
          is_hot BOOLEAN DEFAULT false,
          is_new BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('[Create Merchant Tables] merchant_products 表已创建或已存在')

    // 4. 创建 merchant_orders 表（商家订单表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS merchant_orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_no VARCHAR(100) UNIQUE NOT NULL,
          merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          product_id UUID NOT NULL REFERENCES merchant_products(id) ON DELETE CASCADE,
          product_name VARCHAR(255),
          product_image TEXT,
          price NUMERIC(10,2) NOT NULL,
          quantity INTEGER DEFAULT 1,
          total_amount NUMERIC(10,2) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          recipient_name VARCHAR(255),
          recipient_phone VARCHAR(50),
          recipient_address TEXT,
          tracking_number VARCHAR(100),
          logistics_company VARCHAR(100),
          paid_at TIMESTAMPTZ,
          shipped_at TIMESTAMPTZ,
          delivered_at TIMESTAMPTZ,
          completed_at TIMESTAMPTZ,
          cancelled_at TIMESTAMPTZ,
          cancel_reason TEXT,
          remark TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('[Create Merchant Tables] merchant_orders 表已创建或已存在')

    // 5. 创建索引
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_merchants_user_id ON merchants(user_id);
      CREATE INDEX IF NOT EXISTS idx_merchants_status ON merchants(status);
      CREATE INDEX IF NOT EXISTS idx_merchant_applications_user_id ON merchant_applications(user_id);
      CREATE INDEX IF NOT EXISTS idx_merchant_applications_status ON merchant_applications(status);
      CREATE INDEX IF NOT EXISTS idx_merchant_products_merchant_id ON merchant_products(merchant_id);
      CREATE INDEX IF NOT EXISTS idx_merchant_products_status ON merchant_products(status);
      CREATE INDEX IF NOT EXISTS idx_merchant_products_category ON merchant_products(category_id);
      CREATE INDEX IF NOT EXISTS idx_merchant_orders_merchant_id ON merchant_orders(merchant_id);
      CREATE INDEX IF NOT EXISTS idx_merchant_orders_user_id ON merchant_orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_merchant_orders_status ON merchant_orders(status);
      CREATE INDEX IF NOT EXISTS idx_merchant_orders_created_at ON merchant_orders(created_at DESC);
    `)
    console.log('[Create Merchant Tables] 索引已创建')

    console.log('[Create Merchant Tables] 所有商家相关表创建完成！')
    
  } catch (error) {
    console.error('[Create Merchant Tables] 创建表失败:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

createMerchantTables().catch(console.error)
