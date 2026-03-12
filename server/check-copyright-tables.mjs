/**
 * 检查版权相关表结构
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

async function checkCopyrightTables() {
  const client = await pool.connect()
  
  try {
    console.log('========== 检查版权相关表 ==========\n')

    // 检查 copyright_applications 表
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'copyright_applications'
      ORDER BY ordinal_position
    `)
    
    console.log('copyright_applications 表列:')
    result.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`)
    })

    // 检查需要的列是否存在
    const requiredColumns = [
      'status',
      'actual_license_fee',
      'revenue_share_rate',
      'license_start_date',
      'license_end_date',
      'brand_response',
      'reviewed_at'
    ]
    
    const existingColumns = result.rows.map(r => r.column_name)
    console.log('\n需要的列检查:')
    requiredColumns.forEach(col => {
      const exists = existingColumns.includes(col)
      console.log(`  ${col}: ${exists ? '✓' : '✗ 缺失'}`)
    })

    console.log('\n========== 检查完成 ==========')
    
  } catch (error) {
    console.error('检查失败:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

checkCopyrightTables().catch(console.error)
