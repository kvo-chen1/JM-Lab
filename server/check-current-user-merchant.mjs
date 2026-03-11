/**
 * 检查当前用户与商家的关联
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

async function checkUserMerchant() {
  const client = await pool.connect()
  
  try {
    console.log('========== 检查用户与商家关联 ==========\n')

    // 获取所有用户
    const users = await client.query('SELECT id, email, username FROM users LIMIT 10')
    console.log('用户列表:')
    users.rows.forEach(u => {
      console.log(`  - ${u.username} (${u.id}) - ${u.email}`)
    })

    // 获取商家关联的用户
    const merchants = await client.query(`
      SELECT m.id, m.store_name, m.user_id, m.status, u.email, u.username
      FROM merchants m
      LEFT JOIN users u ON m.user_id = u.id
    `)
    console.log('\n商家关联:')
    merchants.rows.forEach(m => {
      console.log(`  - ${m.store_name} -> 用户: ${m.username || '未知'} (${m.user_id}) - 状态: ${m.status}`)
    })

    console.log('\n========== 检查完成 ==========')
    
  } catch (error) {
    console.error('检查失败:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

checkUserMerchant().catch(console.error)
