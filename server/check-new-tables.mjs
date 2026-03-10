/**
 * 检查新创建的表
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

async function checkNewTables() {
  const client = await pool.connect()
  
  try {
    console.log('========== 检查新创建的表 ==========\n')

    const tables = [
      'promoted_works',
      'brand_task_submissions',
      'cultural_knowledge',
      'active_promotions',
      'pending_tasks'
    ]

    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`)
        console.log(`✅ ${table}: ${result.rows[0].count} 条记录`)
      } catch (e) {
        console.log(`❌ ${table}: 查询失败 - ${e.message}`)
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

checkNewTables().catch(console.error)
