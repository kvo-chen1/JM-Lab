#!/usr/bin/env node
/**
 * 使用 PostgreSQL 连接直接迁移数据
 * 从旧 Supabase 到新 Supabase
 */

import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

console.log('==========================================')
console.log('   Supabase 数据迁移工具 (PostgreSQL)')
console.log('   从旧项目 → 新项目')
console.log('==========================================\n')

// 旧 Supabase 连接配置（金边实验室）
const oldPool = new Pool({
  host: 'db.pptqdicaaewtnaiflfcs.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'csh200506207837',
  ssl: { rejectUnauthorized: false }
})

// 新 Supabase 连接配置（超珊瑚蓝）
// 使用 AWS Pooler 地址（从 Vercel 环境变量获取）
const newPool = new Pool({
  host: 'aws-1-ap-southeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.kizgwttrsmkjelddotup',
  password: '7XpgH64EZXLhMhBX',
  ssl: { rejectUnauthorized: false }
})

// 需要迁移的表列表
const tablesToMigrate = [
  'users',
  'works',
  'posts',
  'events',
  'comments',
  'likes',
  'bookmarks',
  'follows',
  'messages',
  'notifications',
  'communities',
  'community_members',
  'products',
  'points_records',
  'checkin_records'
]

async function migrateTable(oldClient, newClient, tableName) {
  try {
    console.log(`\n📋 迁移表: ${tableName}`)
    
    // 从旧数据库读取数据
    const result = await oldClient.query(`SELECT * FROM "${tableName}"`)
    
    if (result.rows.length === 0) {
      console.log(`   ℹ️ 表为空，跳过`)
      return { success: true, count: 0 }
    }
    
    console.log(`   读取了 ${result.rows.length} 条记录`)
    
    // 获取列名
    const columns = Object.keys(result.rows[0])
    const columnList = columns.join(', ')
    
    // 清空新表（如果存在）
    try {
      await newClient.query(`TRUNCATE TABLE "${tableName}" CASCADE`)
    } catch (e) {
      // 表可能不存在，继续尝试创建
    }
    
    // 批量插入
    let insertedCount = 0
    const batchSize = 100
    
    for (let i = 0; i < result.rows.length; i += batchSize) {
      const batch = result.rows.slice(i, i + batchSize)
      
      for (const row of batch) {
        const values = columns.map((col, idx) => {
          const val = row[col]
          if (val === null || val === undefined) return 'NULL'
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`
          return val
        }).join(', ')
        
        const insertSQL = `INSERT INTO "${tableName}" (${columnList}) VALUES (${values}) ON CONFLICT (id) DO NOTHING`
        
        try {
          await newClient.query(insertSQL)
          insertedCount++
        } catch (err) {
          // 忽略个别插入错误
        }
      }
      
      process.stdout.write(`   进度: ${insertedCount}/${result.rows.length}\r`)
    }
    
    console.log(`   ✅ 成功迁移 ${insertedCount} 条记录`)
    return { success: true, count: insertedCount }
    
  } catch (error) {
    console.error(`   ❌ 迁移失败: ${error.message}`)
    return { success: false, count: 0, error: error.message }
  }
}

async function migrate() {
  const oldClient = await oldPool.connect()
  const newClient = await newPool.connect()
  
  try {
    console.log('✅ 已连接到两个数据库\n')
    
    console.log('【开始迁移数据】')
    console.log('------------------------------------------')
    
    let totalRecords = 0
    let successTables = 0
    let failedTables = 0
    
    for (const table of tablesToMigrate) {
      const result = await migrateTable(oldClient, newClient, table)
      
      if (result.success) {
        totalRecords += result.count
        if (result.count > 0) successTables++
      } else {
        failedTables++
      }
    }
    
    console.log('\n------------------------------------------')
    console.log('【迁移完成】')
    console.log(`✅ 成功: ${successTables} 个表`)
    console.log(`❌ 失败: ${failedTables} 个表`)
    console.log(`📊 总记录数: ${totalRecords}`)
    
  } catch (error) {
    console.error('\n❌ 错误:', error.message)
  } finally {
    oldClient.release()
    newClient.release()
    await oldPool.end()
    await newPool.end()
  }
}

migrate()
