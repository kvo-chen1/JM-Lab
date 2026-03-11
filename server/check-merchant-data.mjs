/**
 * 检查商家数据
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

async function checkMerchantData() {
  const client = await pool.connect()
  
  try {
    console.log('========== 检查商家表 ==========\n')

    // 检查 merchants 表是否存在
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'merchants'
      )
    `)
    console.log('merchants 表存在:', tableCheck.rows[0].exists)

    if (tableCheck.rows[0].exists) {
      // 检查表结构
      const columns = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'merchants'
        ORDER BY ordinal_position
      `)
      console.log('\nmerchants 表结构:')
      columns.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type}`)
      })

      // 检查现有商家数据
      const merchants = await client.query('SELECT * FROM merchants LIMIT 5')
      console.log('\n现有商家数量:', merchants.rowCount)
      if (merchants.rowCount > 0) {
        merchants.rows.forEach(m => {
          console.log(`  - ${m.store_name} (${m.id}) - 状态: ${m.status}`)
        })
      }
    }

    console.log('\n========== 检查完成 ==========')
    
  } catch (error) {
    console.error('检查失败:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

checkMerchantData().catch(console.error)
