/**
 * 检查 promotion_orders 表是否存在
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
}

const connectionString = process.env.DATABASE_URL || 
                        process.env.POSTGRES_URL_NON_POOLING ||
                        process.env.POSTGRES_URL ||
                        process.env.NEON_DATABASE_URL

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('localhost') ? false : { 
    rejectUnauthorized: false 
  }
})

async function checkPromotionOrders() {
  const client = await pool.connect()
  
  try {
    console.log('检查 promotion_orders 表...')
    
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'promotion_orders'
      )
    `)
    
    if (result.rows[0].exists) {
      console.log('✅ promotion_orders 表存在')
      const countResult = await client.query('SELECT COUNT(*) FROM promotion_orders')
      console.log(`   记录数: ${countResult.rows[0].count}`)
    } else {
      console.log('❌ promotion_orders 表不存在')
      
      // 创建表
      console.log('创建 promotion_orders 表...')
      await client.query(`
        CREATE TABLE IF NOT EXISTS promotion_orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          work_id UUID REFERENCES works(id) ON DELETE SET NULL,
          order_type VARCHAR(50) DEFAULT 'promotion',
          status VARCHAR(50) DEFAULT 'pending',
          amount INTEGER DEFAULT 0,
          start_date TIMESTAMP WITH TIME ZONE,
          end_date TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)
      console.log('✅ promotion_orders 表已创建')
    }
    
    // 检查其他可能缺失的表
    const otherTables = [
      'active_promotions',
      'brand_tasks',
      'pending_tasks'
    ]
    
    console.log('\n检查其他表...')
    for (const table of otherTables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )
      `, [table])
      
      if (result.rows[0].exists) {
        console.log(`✅ ${table} 表存在`)
      } else {
        console.log(`❌ ${table} 表不存在`)
      }
    }
    
  } catch (error) {
    console.error('检查失败:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

checkPromotionOrders().catch(console.error)
