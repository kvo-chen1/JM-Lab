#!/usr/bin/env node
/**
 * 在新 Supabase 中创建表结构
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('==========================================')
console.log('   创建 Supabase 表结构')
console.log('==========================================\n')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误: Supabase 配置不完整')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// 读取 database-schema.sql 文件
const schemaPath = path.join(process.cwd(), 'database-schema.sql')

if (!fs.existsSync(schemaPath)) {
  console.error('❌ 错误: 找不到 database-schema.sql 文件')
  process.exit(1)
}

const schemaSQL = fs.readFileSync(schemaPath, 'utf-8')

console.log('📄 读取 schema 文件:', schemaPath)
console.log('📊 SQL 长度:', schemaSQL.length, '字符\n')

async function createTables() {
  try {
    console.log('🔌 连接 Supabase...')
    
    // 分割 SQL 语句并执行
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`📋 发现 ${statements.length} 个 SQL 语句\n`)
    
    let successCount = 0
    let failCount = 0
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i]
      
      // 跳过 CREATE EXTENSION 和复杂的 DO 块
      if (stmt.includes('CREATE EXTENSION') || 
          stmt.includes('DO $$') ||
          stmt.includes('CREATE INDEX')) {
        console.log(`⏭️  跳过: ${stmt.substring(0, 50)}...`)
        continue
      }
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' })
        
        if (error) {
          // 尝试直接执行
          console.log(`⚠️  RPC 失败，尝试直接执行: ${stmt.substring(0, 50)}...`)
          failCount++
        } else {
          console.log(`✅ 成功: ${stmt.substring(0, 50)}...`)
          successCount++
        }
      } catch (err) {
        console.log(`❌ 失败: ${err.message}`)
        failCount++
      }
    }
    
    console.log('\n------------------------------------------')
    console.log(`✅ 成功: ${successCount} 个语句`)
    console.log(`❌ 失败: ${failCount} 个语句`)
    
    console.log('\n💡 提示: 如果大部分失败，请手动在 Supabase SQL Editor 中执行 database-schema.sql')
    
  } catch (error) {
    console.error('\n❌ 错误:', error.message)
  }
}

createTables()
