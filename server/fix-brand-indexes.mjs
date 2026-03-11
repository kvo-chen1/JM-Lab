/**
 * 修复品牌表索引
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
  console.log('[Fix Brand Indexes] 已加载 .env.local 文件')
}

const connectionString = process.env.DATABASE_URL || 
                        process.env.POSTGRES_URL_NON_POOLING ||
                        process.env.POSTGRES_URL ||
                        process.env.NEON_DATABASE_URL

console.log('[Fix Brand Indexes] 数据库连接:', connectionString?.replace(/:[^:@]+@/, ':***@'))

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('localhost') ? false : { 
    rejectUnauthorized: false 
  }
})

async function fixBrandIndexes() {
  const client = await pool.connect()
  
  try {
    console.log('[Fix Brand Indexes] 开始修复品牌表索引...')

    // 检查 ip_assets 表结构
    const result = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'ip_assets'
    `)
    const columns = result.rows.map(r => r.column_name)
    console.log('[Fix Brand Indexes] ip_assets 表列:', columns)

    // 创建索引（使用正确的列名）
    if (columns.includes('owner_id')) {
      await client.query(`CREATE INDEX IF NOT EXISTS idx_ip_assets_owner_id ON ip_assets(owner_id)`)
      console.log('[Fix Brand Indexes] idx_ip_assets_owner_id 索引已创建')
    } else if (columns.includes('user_id')) {
      await client.query(`CREATE INDEX IF NOT EXISTS idx_ip_assets_user_id ON ip_assets(user_id)`)
      console.log('[Fix Brand Indexes] idx_ip_assets_user_id 索引已创建')
    }

    // 创建其他索引
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_brands_user_id ON brands(user_id);
      CREATE INDEX IF NOT EXISTS idx_brands_status ON brands(status);
      CREATE INDEX IF NOT EXISTS idx_brand_authorizations_brand_id ON brand_authorizations(brand_id);
      CREATE INDEX IF NOT EXISTS idx_brand_authorizations_applicant_id ON brand_authorizations(applicant_id);
      CREATE INDEX IF NOT EXISTS idx_brand_authorizations_status ON brand_authorizations(status);
      CREATE INDEX IF NOT EXISTS idx_brand_authorizations_created_at ON brand_authorizations(created_at DESC);
    `)
    console.log('[Fix Brand Indexes] 所有索引已创建')

    console.log('[Fix Brand Indexes] 修复完成！')
    
  } catch (error) {
    console.error('[Fix Brand Indexes] 修复失败:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

fixBrandIndexes().catch(console.error)
