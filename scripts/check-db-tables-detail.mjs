#!/usr/bin/env node
/**
 * 详细检查数据库表结构
 */

import pg from 'pg'
import dotenv from 'dotenv'

const { Pool } = pg

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

// 使用直接PostgreSQL连接
const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL

console.log('==========================================')
console.log('   数据库表详细检查')
console.log('==========================================\n')

console.log('连接字符串:', connectionString ? connectionString.substring(0, 50) + '...' : '未设置')

if (!connectionString) {
  console.error('\n❌ 错误: 数据库连接字符串未设置')
  process.exit(1)
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
})

async function listAllTables() {
  console.log('\n📋 列出所有表...\n')
  
  try {
    const client = await pool.connect()
    
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    
    console.log(`找到 ${result.rows.length} 个表:\n`)
    result.rows.forEach(row => {
      console.log(`  • ${row.table_name}`)
    })
    
    client.release()
    return result.rows.map(r => r.table_name)
  } catch (error) {
    console.error('❌ 获取表列表失败:', error.message)
    return []
  }
}

async function checkJinbiTables() {
  console.log('\n🔍 检查津币相关表...\n')
  
  const jinbiTablePatterns = ['jinbi', 'balance', 'pricing', 'membership']
  
  try {
    const client = await pool.connect()
    
    for (const pattern of jinbiTablePatterns) {
      const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%${pattern}%'
        ORDER BY table_name
      `)
      
      if (result.rows.length > 0) {
        console.log(`包含 "${pattern}" 的表:`)
        result.rows.forEach(row => {
          console.log(`  • ${row.table_name}`)
        })
        console.log()
      }
    }
    
    client.release()
  } catch (error) {
    console.error('❌ 检查津币表失败:', error.message)
  }
}

async function checkTableStructure(tableName) {
  console.log(`\n📊 检查表结构: ${tableName}\n`)
  
  try {
    const client = await pool.connect()
    
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName])
    
    if (result.rows.length === 0) {
      console.log('  表不存在或没有列')
    } else {
      result.rows.forEach(col => {
        console.log(`  • ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`)
      })
    }
    
    client.release()
  } catch (error) {
    console.error(`❌ 检查表结构失败: ${error.message}`)
  }
}

async function checkTableData(tableName) {
  console.log(`\n📈 检查表数据: ${tableName}\n`)
  
  try {
    const client = await pool.connect()
    
    const countResult = await client.query(`SELECT COUNT(*) FROM "${tableName}"`)
    const count = parseInt(countResult.rows[0].count)
    
    console.log(`  记录数: ${count}`)
    
    if (count > 0) {
      const dataResult = await client.query(`SELECT * FROM "${tableName}" LIMIT 3`)
      console.log('  示例数据:')
      dataResult.rows.forEach((row, i) => {
        console.log(`    [${i + 1}]`, JSON.stringify(row).substring(0, 200) + '...')
      })
    }
    
    client.release()
  } catch (error) {
    console.error(`❌ 检查表数据失败: ${error.message}`)
  }
}

async function main() {
  const allTables = await listAllTables()
  
  await checkJinbiTables()
  
  // 检查特定的津币表
  const jinbiTables = [
    'user_jinbi_balance',
    'jinbi_records', 
    'jinbi_consumption_details',
    'jinbi_packages',
    'membership_jinbi_config',
    'service_pricing'
  ]
  
  for (const table of jinbiTables) {
    if (allTables.includes(table)) {
      await checkTableStructure(table)
      await checkTableData(table)
    }
  }
  
  console.log('\n==========================================')
  console.log('   检查完成')
  console.log('==========================================')
  
  await pool.end()
}

main().catch(error => {
  console.error('执行失败:', error)
  process.exit(1)
})
