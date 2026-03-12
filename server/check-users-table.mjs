/**
 * 检查 users 表结构
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

async function checkUsersTable() {
  const client = await pool.connect()
  
  try {
    console.log('========== 检查 users 表结构 ==========\n')

    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `)
    
    console.log('users 表列:')
    result.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`)
    })

    // 检查是否有 nickname 列
    const hasNickname = result.rows.some(col => col.column_name === 'nickname')
    console.log('\n是否有 nickname 列:', hasNickname)

    console.log('\n========== 检查完成 ==========')
    
  } catch (error) {
    console.error('检查失败:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

checkUsersTable().catch(console.error)
