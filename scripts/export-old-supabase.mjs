#!/usr/bin/env node
/**
 * 从旧 Supabase 导出数据为 CSV
 */

import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

console.log('==========================================')
console.log('   旧 Supabase 导出 CSV 工具')
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

// 创建导出目录
const exportDir = path.join(process.cwd(), 'supabase_exports')
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true })
}

const pool = new Pool(oldSupabaseConfig)

// 将数据转换为 CSV
function toCSV(rows) {
  if (rows.length === 0) return ''
  
  const headers = Object.keys(rows[0])
  const csvHeaders = headers.join(',')
  
  const csvRows = rows.map(row => {
    return headers.map(header => {
      const value = row[header]
      if (value === null || value === undefined) return ''
      if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }).join(',')
  })
  
  return [csvHeaders, ...csvRows].join('\n')
}

async function exportTable(client, tableName) {
  try {
    console.log(`📋 导出表: ${tableName}`)
    
    const result = await client.query(`SELECT * FROM "${tableName}"`)
    
    if (result.rows.length === 0) {
      console.log(`   ℹ️ 表为空，跳过`)
      return { success: true, count: 0, file: null }
    }
    
    const csv = toCSV(result.rows)
    const fileName = `${tableName}.csv`
    const filePath = path.join(exportDir, fileName)
    
    fs.writeFileSync(filePath, csv, 'utf-8')
    
    console.log(`   ✅ 导出 ${result.rows.length} 条记录到 ${fileName}`)
    return { success: true, count: result.rows.length, file: fileName }
  } catch (error) {
    console.error(`   ❌ 导出失败: ${error.message}`)
    return { success: false, count: 0, file: null, error: error.message }
  }
}

async function exportAll() {
  const client = await pool.connect()
  
  try {
    console.log('✅ 已连接到旧 Supabase\n')
    
    // 获取所有表
    console.log('【1】获取表列表')
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)
    
    const tables = tablesResult.rows.map(r => r.table_name)
    console.log(`发现 ${tables.length} 个表\n`)
    
    console.log('【2】开始导出')
    console.log('------------------------------------------')
    
    const results = []
    let totalRecords = 0
    
    for (const table of tables) {
      const result = await exportTable(client, table)
      results.push({ table, ...result })
      if (result.success) {
        totalRecords += result.count
      }
    }
    
    console.log('\n【3】导出完成')
    console.log('------------------------------------------')
    console.log(`✅ 成功导出: ${results.filter(r => r.success && r.count > 0).length} 个表`)
    console.log(`❌ 失败: ${results.filter(r => !r.success).length} 个表`)
    console.log(`📊 总记录数: ${totalRecords}`)
    console.log(`\n📁 导出目录: ${exportDir}`)
    
    // 显示详细结果
    console.log('\n详细结果:')
    results.forEach(r => {
      const status = r.success ? '✅' : '❌'
      const count = r.count > 0 ? `(${r.count} 条)` : ''
      console.log(`   ${status} ${r.table} ${count}`)
    })
    
  } catch (error) {
    console.error('\n❌ 错误:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

exportAll()
