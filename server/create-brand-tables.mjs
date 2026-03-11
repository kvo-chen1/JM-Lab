/**
 * 创建品牌相关的数据库表
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
  console.log('[Create Brand Tables] 已加载 .env.local 文件')
}

const connectionString = process.env.DATABASE_URL || 
                        process.env.POSTGRES_URL_NON_POOLING ||
                        process.env.POSTGRES_URL ||
                        process.env.NEON_DATABASE_URL

console.log('[Create Brand Tables] 数据库连接:', connectionString?.replace(/:[^:@]+@/, ':***@'))

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('localhost') ? false : { 
    rejectUnauthorized: false 
  }
})

async function createBrandTables() {
  const client = await pool.connect()
  
  try {
    console.log('[Create Brand Tables] 开始创建品牌相关表...')

    // 1. 创建 brands 表（品牌方表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS brands (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          logo TEXT,
          description TEXT,
          category VARCHAR(100),
          established_year INTEGER,
          location VARCHAR(255),
          contact_person VARCHAR(255),
          contact_phone VARCHAR(50),
          contact_email VARCHAR(255),
          website VARCHAR(500),
          status VARCHAR(50) DEFAULT 'pending',
          verification_docs JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id)
      )
    `)
    console.log('[Create Brand Tables] brands 表已创建或已存在')

    // 2. 创建 brand_authorizations 表（品牌授权申请表）
    await client.query(`
      CREATE TABLE IF NOT EXISTS brand_authorizations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          ip_asset_id UUID NOT NULL,
          brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
          applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          status VARCHAR(50) DEFAULT 'pending',
          application_reason TEXT,
          proposed_usage TEXT,
          proposed_duration INTEGER,
          proposed_price NUMERIC(10,2),
          brand_response TEXT,
          contract_url TEXT,
          certificate_url TEXT,
          started_at TIMESTAMPTZ,
          expired_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('[Create Brand Tables] brand_authorizations 表已创建或已存在')

    // 3. 创建 ip_assets 表（IP资产表，如果还不存在）
    await client.query(`
      CREATE TABLE IF NOT EXISTS ip_assets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          thumbnail TEXT,
          owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('[Create Brand Tables] ip_assets 表已创建或已存在')

    // 4. 创建索引
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_brands_user_id ON brands(user_id);
      CREATE INDEX IF NOT EXISTS idx_brands_status ON brands(status);
      CREATE INDEX IF NOT EXISTS idx_brand_authorizations_brand_id ON brand_authorizations(brand_id);
      CREATE INDEX IF NOT EXISTS idx_brand_authorizations_applicant_id ON brand_authorizations(applicant_id);
      CREATE INDEX IF NOT EXISTS idx_brand_authorizations_status ON brand_authorizations(status);
      CREATE INDEX IF NOT EXISTS idx_brand_authorizations_created_at ON brand_authorizations(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_ip_assets_owner_id ON ip_assets(owner_id);
    `)
    console.log('[Create Brand Tables] 索引已创建')

    console.log('[Create Brand Tables] 所有品牌相关表创建完成！')
    
  } catch (error) {
    console.error('[Create Brand Tables] 创建表失败:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

createBrandTables().catch(console.error)
