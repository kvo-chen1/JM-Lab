#!/usr/bin/env node
/**
 * 从旧 Supabase 迁移数据到新 Supabase
 * 使用 PostgreSQL 连接直接导出导入
 */

import { Pool } from 'pg'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

console.log('==========================================')
console.log('   Supabase 数据迁移工具')
console.log('   从旧项目 → 新项目')
console.log('==========================================\n')

// 旧 Supabase 连接配置（金边实验室）
const oldSupabaseConfig = {
  host: 'db.pptqdicaaewtnaiflfcs.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'csh200506207837',
  ssl: { rejectUnauthorized: false }
}

// 新 Supabase 连接配置（超珊瑚蓝）
const newSupabaseUrl = process.env.VITE_SUPABASE_URL
const newSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!newSupabaseUrl || !newSupabaseKey) {
  console.error('❌ 错误: 新 Supabase 配置不完整')
  console.error('请检查 VITE_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

console.log('新 Supabase URL:', newSupabaseUrl)

// 创建新 Supabase 客户端
const newSupabase = createClient(newSupabaseUrl, newSupabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// 需要迁移的表列表（按依赖顺序）
const tablesToMigrate = [
  'users',
  'user_profiles',
  'works',
  'posts',
  'events',
  'comments',
  'likes',
  'favorites',
  'bookmarks',
  'follows',
  'messages',
  'conversations',
  'notifications',
  'communities',
  'community_members',
  'products',
  'orders',
  'points_records',
  'checkin_records'
]

async function migrateData() {
  console.log('\n【1】连接旧 Supabase 数据库')
  console.log('------------------------------------------')
  
  const oldPool = new Pool(oldSupabaseConfig)
  
  try {
    const client = await oldPool.connect()
    console.log('✅ 已连接到旧数据库')
    
    console.log('\n【2】开始迁移数据')
    console.log('------------------------------------------')
    
    let totalRecords = 0
    let successTables = 0
    let failedTables = 0
    
    for (const table of tablesToMigrate) {
      try {
        console.log(`\n📋 迁移表: ${table}`)
        
        // 从旧数据库读取数据
        const result = await client.query(`SELECT * FROM "${table}"`)
        
        if (result.rows.length === 0) {
          console.log(`   ℹ️ 表为空，跳过`)
          continue
        }
        
        console.log(`   读取了 ${result.rows.length} 条记录`)
        
        // 插入到新 Supabase
        const { error } = await newSupabase
          .from(table)
          .upsert(result.rows, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          })
        
        if (error) {
          console.error(`   ❌ 插入失败: ${error.message}`)
          failedTables++
        } else {
          console.log(`   ✅ 成功迁移 ${result.rows.length} 条记录`)
          totalRecords += result.rows.length
          successTables++
        }
        
      } catch (error) {
        console.error(`   ❌ 迁移失败: ${error.message}`)
        failedTables++
      }
    }
    
    console.log('\n【3】迁移完成')
    console.log('------------------------------------------')
    console.log(`✅ 成功: ${successTables} 个表`)
    console.log(`❌ 失败: ${failedTables} 个表`)
    console.log(`📊 总记录数: ${totalRecords}`)
    
    client.release()
    
  } catch (error) {
    console.error('\n❌ 连接失败:', error.message)
    console.log('\n💡 可能原因:')
    console.log('   1. 旧 Supabase 项目已超出配额')
    console.log('   2. 密码不正确')
    console.log('   3. 网络连接问题')
  } finally {
    await oldPool.end()
  }
}

// 导出为 SQL 文件的替代方案
async function exportToSQL() {
  console.log('\n【备用方案】导出为 SQL 文件')
  console.log('------------------------------------------')
  
  const exportDir = path.join(process.cwd(), 'supabase_export')
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true })
  }
  
  console.log('请手动在 Supabase 控制台中执行以下操作：')
  console.log('1. 打开旧 Supabase 项目')
  console.log('2. 进入 SQL Editor')
  console.log('3. 执行以下查询导出数据：\n')
  
  tablesToMigrate.forEach(table => {
    console.log(`-- 导出 ${table} 表`)
    console.log(`COPY (SELECT * FROM ${table}) TO '/tmp/${table}.csv' WITH CSV HEADER;`)
  })
  
  console.log('\n或者使用 pg_dump:')
  console.log(`pg_dump "postgresql://postgres:PASSWORD@db.pptqdicaaewtnaiflfcs.supabase.co:5432/postgres" > old_supabase_backup.sql`)
}

// 主函数
async function main() {
  console.log('\n请选择操作：')
  console.log('1. 直接迁移（需要旧数据库密码）')
  console.log('2. 导出 SQL 文件（备用方案）')
  
  // 默认尝试直接迁移
  await migrateData()
}

main()
