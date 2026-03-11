/**
 * 修复商家 user_id 关联
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

async function fixMerchantUserId() {
  const client = await pool.connect()
  
  try {
    console.log('========== 修复商家 user_id ==========\n')

    // 获取 kvo1 用户的 ID
    const userResult = await client.query(
      "SELECT id FROM users WHERE username = 'kvo1' OR email = '153059246369kvo@gmail.com' LIMIT 1"
    )
    
    if (userResult.rowCount === 0) {
      console.log('未找到 kvo1 用户')
      return
    }
    
    const userId = userResult.rows[0].id
    console.log('找到用户 kvo1，ID:', userId)

    // 更新商家的 user_id
    const updateResult = await client.query(
      `UPDATE merchants 
       SET user_id = $1, 
           contact_name = '店主',
           contact_email = '153059246369kvo@gmail.com'
       WHERE user_id IS NULL 
       RETURNING *`,
      [userId]
    )
    
    if (updateResult.rowCount > 0) {
      console.log('\n成功更新商家:')
      updateResult.rows.forEach(m => {
        console.log(`  - ${m.store_name} -> 用户ID: ${m.user_id}`)
      })
    } else {
      console.log('\n没有需要更新的商家（所有商家都已有关联的用户）')
    }

    // 验证更新
    const verifyResult = await client.query(`
      SELECT m.id, m.store_name, m.user_id, u.username, u.email
      FROM merchants m
      LEFT JOIN users u ON m.user_id = u.id
    `)
    
    console.log('\n更新后的商家关联:')
    verifyResult.rows.forEach(m => {
      console.log(`  - ${m.store_name} -> 用户: ${m.username || '未知'} (${m.user_id})`)
    })

    console.log('\n========== 修复完成 ==========')
    
  } catch (error) {
    console.error('修复失败:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

fixMerchantUserId().catch(console.error)
