#!/usr/bin/env node
/**
 * 检查 kvo1 用户的关注和粉丝数据
 */

import pg from 'pg'
const { Pool } = pg
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

console.log('==========================================')
console.log('   检查 kvo1 用户的关注和粉丝数据')
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

async function checkFollows() {
  try {
    const kvo1Id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429'
    
    // 查询关注列表
    console.log('🔍 查询 kvo1 的关注列表...')
    const { rows: following } = await pool.query(`
      SELECT u.id, u.username
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = $1
    `, [kvo1Id])
    
    console.log(`关注数量: ${following.length}`)
    following.forEach((user, idx) => {
      console.log(`  ${idx + 1}. ${user.username} (${user.id})`)
    })
    
    console.log('')
    
    // 查询粉丝列表
    console.log('🔍 查询 kvo1 的粉丝列表...')
    const { rows: followers } = await pool.query(`
      SELECT u.id, u.username
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = $1
    `, [kvo1Id])
    
    console.log(`粉丝数量: ${followers.length}`)
    followers.forEach((user, idx) => {
      console.log(`  ${idx + 1}. ${user.username} (${user.id})`)
    })
    
    console.log('')
    
    // 查询作品数量
    console.log('🔍 查询 kvo1 的作品数量...')
    const { rows: works } = await pool.query(`
      SELECT COUNT(*) as count FROM works WHERE creator_id = $1
    `, [kvo1Id])
    
    console.log(`作品数量: ${works[0].count}`)
    
    console.log('')
    console.log('📊 统计汇总:')
    console.log(`  关注: ${following.length}`)
    console.log(`  粉丝: ${followers.length}`)
    console.log(`  作品: ${works[0].count}`)
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message)
  } finally {
    await pool.end()
  }
}

checkFollows()
