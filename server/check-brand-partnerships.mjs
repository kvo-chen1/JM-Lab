/**
 * 检查 brand_partnerships 表是否存在
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

async function checkTables() {
  const client = await pool.connect()
  
  try {
    console.log('========== 检查表是否存在 ==========\n')

    const tables = [
      'brand_partnerships',
      'commercial_applications',
      'points_rules',
      'user_feedback',
      'exchange_records'
    ]

    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )
      `, [table])
      
      const exists = result.rows[0].exists
      console.log(`${exists ? '✅' : '❌'} ${table}: ${exists ? '存在' : '不存在'}`)
      
      if (exists) {
        const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`)
        console.log(`   记录数: ${countResult.rows[0].count}`)
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

checkTables().catch(console.error)
