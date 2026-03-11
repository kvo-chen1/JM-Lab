#!/usr/bin/env node
/**
 * 修复用户统计数据
 */

import pg from 'pg'
const { Pool } = pg
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

console.log('==========================================')
console.log('   修复用户统计数据')
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

async function fixStats() {
  try {
    const kvo1Id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429'
    
    // 查询实际统计数据
    const { rows: following } = await pool.query(
      'SELECT COUNT(*) as count FROM follows WHERE follower_id = $1',
      [kvo1Id]
    )
    const followingCount = parseInt(following[0].count)
    
    const { rows: followers } = await pool.query(
      'SELECT COUNT(*) as count FROM follows WHERE following_id = $1',
      [kvo1Id]
    )
    const followersCount = parseInt(followers[0].count)
    
    const { rows: works } = await pool.query(
      'SELECT COUNT(*) as count FROM works WHERE creator_id = $1',
      [kvo1Id]
    )
    const worksCount = parseInt(works[0].count)
    
    console.log('📊 实际统计数据:')
    console.log('  关注:', followingCount)
    console.log('  粉丝:', followersCount)
    console.log('  作品:', worksCount)
    console.log('')
    
    // 更新 users 表中的统计字段
    console.log('🔧 更新 users 表...')
    await pool.query(
      `UPDATE users 
       SET following_count = $1, 
           followers_count = $2, 
           works_count = $3 
       WHERE id = $4`,
      [followingCount, followersCount, worksCount, kvo1Id]
    )
    
    console.log('✅ 用户统计数据已更新')
    
    // 验证更新结果
    const { rows: updated } = await pool.query(
      'SELECT following_count, followers_count, works_count FROM users WHERE id = $1',
      [kvo1Id]
    )
    
    console.log('\n📋 更新后的数据:')
    console.log('  following_count:', updated[0].following_count)
    console.log('  followers_count:', updated[0].followers_count)
    console.log('  works_count:', updated[0].works_count)
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message)
  } finally {
    await pool.end()
  }
}

fixStats()
