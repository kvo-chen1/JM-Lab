/**
 * 检查 Supabase 数据库连接和数据
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

console.log('[Check Supabase] 数据库连接:', connectionString?.replace(/:[^:@]+@/, ':***@'))

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('localhost') ? false : { 
    rejectUnauthorized: false 
  }
})

async function checkSupabaseData() {
  const client = await pool.connect()
  
  try {
    console.log('\n========== Supabase 数据库检查 ==========\n')

    // 1. 检查核心表
    const coreTables = ['users', 'works', 'events', 'posts', 'comments']
    console.log('【核心表】')
    for (const table of coreTables) {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`)
      console.log(`  ${table}: ${result.rows[0].count} 条记录`)
    }

    // 2. 检查后台管理相关表
    console.log('\n【后台管理相关表】')
    const adminTables = [
      'brand_partnerships',
      'commercial_applications', 
      'points_rules',
      'user_feedback',
      'exchange_records',
      'profiles',
      'content_moderation',
      'ip_assets',
      'knowledge_base'
    ]
    
    for (const table of adminTables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`)
        console.log(`  ${table}: ${result.rows[0].count} 条记录`)
      } catch (e) {
        console.log(`  ${table}: ❌ 表不存在或查询失败`)
      }
    }

    // 3. 检查 works 表的状态分布
    console.log('\n【作品状态分布】')
    const workStatusResult = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM works 
      GROUP BY status
    `)
    workStatusResult.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`)
    })

    // 4. 检查 events 表的状态分布
    console.log('\n【活动状态分布】')
    const eventStatusResult = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM events 
      GROUP BY status
    `)
    if (eventStatusResult.rows.length > 0) {
      eventStatusResult.rows.forEach(row => {
        console.log(`  ${row.status}: ${row.count}`)
      })
    } else {
      console.log('  暂无活动数据')
    }

    // 5. 检查 brand_partnerships 表
    console.log('\n【品牌合作申请】')
    try {
      const bpResult = await client.query(`
        SELECT status, COUNT(*) as count 
        FROM brand_partnerships 
        GROUP BY status
      `)
      if (bpResult.rows.length > 0) {
        bpResult.rows.forEach(row => {
          console.log(`  ${row.status}: ${row.count}`)
        })
      } else {
        console.log('  暂无品牌合作申请')
      }
    } catch (e) {
      console.log('  ❌ brand_partnerships 表查询失败')
    }

    // 6. 检查最近创建的用户
    console.log('\n【最近创建的5个用户】')
    const recentUsers = await client.query(`
      SELECT id, email, username, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `)
    recentUsers.rows.forEach(user => {
      console.log(`  - ${user.username || user.email} (${user.id.substring(0, 8)}...) 创建于 ${new Date(user.created_at).toLocaleDateString()}`)
    })

    // 7. 检查最近创建的作品
    console.log('\n【最近创建的5个作品】')
    const recentWorks = await client.query(`
      SELECT id, title, status, created_at 
      FROM works 
      ORDER BY created_at DESC 
      LIMIT 5
    `)
    recentWorks.rows.forEach(work => {
      console.log(`  - ${work.title} [${work.status}] 创建于 ${new Date(work.created_at).toLocaleDateString()}`)
    })

    // 8. 检查表结构 - created_at 字段类型
    console.log('\n【关键字段类型检查】')
    const columnCheck = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('users', 'works', 'events') 
      AND column_name IN ('created_at', 'updated_at')
      ORDER BY table_name, column_name
    `)
    columnCheck.rows.forEach(row => {
      console.log(`  ${row.table_name}.${row.column_name}: ${row.data_type}`)
    })

    console.log('\n========== 检查完成 ==========')
    
  } catch (error) {
    console.error('检查失败:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

checkSupabaseData().catch(console.error)
