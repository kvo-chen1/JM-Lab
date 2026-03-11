#!/usr/bin/env node
/**
 * 检查 kvo1 用户的 metadata
 */

import pg from 'pg'
const { Pool } = pg
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

console.log('==========================================')
console.log('   检查 kvo1 用户的 metadata')
console.log('==========================================\n')

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ 错误: 数据库连接字符串未设置')
  process.exit(1)
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
})

async function checkMetadata() {
  try {
    // 查询 kvo1 用户的 metadata
    const { rows } = await pool.query(
      'SELECT id, username, email, metadata FROM users WHERE id = $1',
      ['f3dedf79-5c5e-40fd-9513-d0fb0995d429']
    )
    
    if (rows.length === 0) {
      console.log('未找到用户')
      return
    }
    
    const user = rows[0]
    console.log('用户 ID:', user.id)
    console.log('用户名 (username):', user.username)
    console.log('邮箱:', user.email)
    console.log('')
    console.log('Metadata:')
    console.log(JSON.stringify(user.metadata, null, 2))
    
    // 检查 metadata 中是否有 username
    if (user.metadata && user.metadata.username) {
      console.log('')
      console.log('⚠️ Metadata 中的 username:', user.metadata.username)
      
      if (user.metadata.username !== user.username) {
        console.log('❌ 不一致！数据库 username 是', user.username, '但 metadata 中是', user.metadata.username)
      }
    }
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message)
  } finally {
    await pool.end()
  }
}

checkMetadata()
