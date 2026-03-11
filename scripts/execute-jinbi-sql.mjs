#!/usr/bin/env node
/**
 * 执行津币系统SQL脚本
 */

import pg from 'pg'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

const { Pool } = pg

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

// 使用直接PostgreSQL连接
const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL

console.log('==========================================')
console.log('   执行津币系统SQL脚本')
console.log('==========================================\n')

if (!connectionString) {
  console.error('❌ 错误: 数据库连接字符串未设置')
  process.exit(1)
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
})

async function executeSQL() {
  try {
    // 读取SQL文件
    const sqlFilePath = path.join(process.cwd(), 'create_jinbi_tables.sql')
    console.log('📄 SQL文件路径:', sqlFilePath)
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ SQL文件不存在:', sqlFilePath)
      process.exit(1)
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8')
    console.log('📊 SQL文件大小:', sqlContent.length, '字符')
    
    // 连接数据库
    console.log('\n🔌 连接数据库...')
    const client = await pool.connect()
    console.log('✅ 数据库连接成功\n')
    
    // 分割SQL语句并执行
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`📝 共 ${statements.length} 条SQL语句\n`)
    
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      const firstLine = statement.split('\n')[0].trim()
      
      try {
        await client.query(statement)
        successCount++
        
        // 只输出重要语句的成功信息
        if (firstLine.includes('CREATE TABLE') || firstLine.includes('INSERT')) {
          const tableName = firstLine.match(/CREATE TABLE.*?([\w_]+)/)?.[1] || 
                           firstLine.match(/INSERT INTO.*?([\w_]+)/)?.[1] ||
                           '未知'
          console.log(`✅ [${i + 1}/${statements.length}] ${firstLine.substring(0, 50)}...`)
        }
      } catch (error) {
        errorCount++
        // 忽略"已存在"的错误
        if (error.message.includes('already exists')) {
          console.log(`⚠️  [${i + 1}/${statements.length}] 已存在: ${firstLine.substring(0, 50)}...`)
        } else {
          console.error(`❌ [${i + 1}/${statements.length}] 执行失败: ${firstLine.substring(0, 50)}...`)
          console.error('   错误:', error.message)
        }
      }
    }
    
    client.release()
    
    console.log('\n==========================================')
    console.log('   执行结果汇总')
    console.log('==========================================')
    console.log(`✅ 成功: ${successCount} 条`)
    console.log(`⚠️  跳过/已存在: ${errorCount} 条`)
    console.log('\n🎉 SQL脚本执行完成!')
    
  } catch (error) {
    console.error('\n❌ 执行失败:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

executeSQL()
