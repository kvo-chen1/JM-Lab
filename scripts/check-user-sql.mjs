#!/usr/bin/env node
/**
 * 使用 SQL 检查用户
 */

import pg from 'pg'
const { Pool } = pg
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

console.log('==========================================')
console.log('   使用 SQL 检查用户')
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

async function checkUser() {
  try {
    // 查询 kvo1 用户
    console.log('🔍 查询 kvo1 用户...')
    const { rows: kvo1Rows } = await pool.query(
      'SELECT id, username, email, display_name FROM users WHERE id = $1',
      ['f3dedf79-5c5e-40fd-9513-d0fb0995d429']
    )
    
    if (kvo1Rows.length > 0) {
      console.log('kvo1 用户信息:')
      console.log('  ID:', kvo1Rows[0].id)
      console.log('  用户名:', kvo1Rows[0].username)
      console.log('  邮箱:', kvo1Rows[0].email)
      console.log('  显示名:', kvo1Rows[0].display_name)
    } else {
      console.log('未找到 kvo1 用户')
    }
    
    console.log('')
    
    // 查询 kvo7 用户
    console.log('🔍 查询 kvo7 用户...')
    const { rows: kvo7Rows } = await pool.query(
      'SELECT id, username, email FROM users WHERE username = $1',
      ['kvo7']
    )
    
    if (kvo7Rows.length > 0) {
      console.log('kvo7 用户信息:', kvo7Rows)
    } else {
      console.log('数据库中没有 kvo7 用户')
    }
    
    console.log('')
    
    // 查询所有包含 kvo 的用户名
    console.log('🔍 查询所有包含 kvo 的用户...')
    const { rows: kvoRows } = await pool.query(
      "SELECT id, username, email FROM users WHERE username LIKE 'kvo%'"
    )
    
    console.log(`找到 ${kvoRows.length} 个 kvo 用户:`)
    kvoRows.forEach(user => {
      console.log(`  - ${user.username} (${user.id})`)
    })
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message)
  } finally {
    await pool.end()
  }
}

checkUser()
