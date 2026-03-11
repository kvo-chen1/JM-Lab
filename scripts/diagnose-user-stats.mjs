#!/usr/bin/env node
/**
 * 诊断用户统计数据问题
 */

import pg from 'pg'
const { Pool } = pg
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

console.log('==========================================')
console.log('   诊断用户统计数据问题')
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

async function diagnose() {
  try {
    // 获取 kvo1 用户的完整信息
    const { rows: users } = await pool.query(
      `SELECT id, username, email, followers_count, following_count, posts_count, works_count 
       FROM users WHERE username = 'kvo1'`
    )
    
    if (users.length === 0) {
      console.log('❌ 未找到 kvo1 用户')
      return
    }
    
    const user = users[0]
    console.log('✅ 找到 kvo1 用户:')
    console.log('  ID:', user.id)
    console.log('  用户名:', user.username)
    console.log('  邮箱:', user.email)
    console.log('  数据库中的 followers_count:', user.followers_count)
    console.log('  数据库中的 following_count:', user.following_count)
    console.log('  数据库中的 posts_count:', user.posts_count)
    console.log('  数据库中的 works_count:', user.works_count)
    console.log('')
    
    // 查询实际的关注数量
    const { rows: following } = await pool.query(
      'SELECT COUNT(*) as count FROM follows WHERE follower_id = $1',
      [user.id]
    )
    console.log('  实际关注数量:', following[0].count)
    
    // 查询实际的粉丝数量
    const { rows: followers } = await pool.query(
      'SELECT COUNT(*) as count FROM follows WHERE following_id = $1',
      [user.id]
    )
    console.log('  实际粉丝数量:', followers[0].count)
    
    // 查询实际的作品数量
    const { rows: works } = await pool.query(
      'SELECT COUNT(*) as count FROM works WHERE creator_id = $1',
      [user.id]
    )
    console.log('  实际作品数量:', works[0].count)
    console.log('')
    
    console.log('📋 浏览器调试信息:')
    console.log('  请在浏览器控制台运行以下代码检查 localStorage:')
    console.log('  ```javascript')
    console.log('  const user = JSON.parse(localStorage.getItem("user") || "{}");')
    console.log(`  console.log("localStorage user ID:", user.id);`)
    console.log(`  console.log("Expected user ID:", "${user.id}");`)
    console.log(`  console.log("Match:", user.id === "${user.id}");`)
    console.log('  ```')
    
  } catch (error) {
    console.error('❌ 诊断失败:', error.message)
  } finally {
    await pool.end()
  }
}

diagnose()
