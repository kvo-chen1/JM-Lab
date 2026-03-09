#!/usr/bin/env node
/**
 * 使用 PostgreSQL 直接导入数据到新 Supabase
 * 绕过 Supabase API，直接连接数据库
 */

import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

console.log('==========================================')
console.log('   使用 PostgreSQL 导入到 Supabase')
console.log('==========================================\n')

// 新 Supabase 连接配置（超珊瑚蓝）
const newSupabaseConfig = {
  host: 'aws-1-ap-southeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.kizgwttrsmkjelddotup',
  password: '7XpgH64EZXLhMhBX',
  ssl: { rejectUnauthorized: false }
}

// CSV 文件目录
const importDir = path.join(process.cwd(), 'supabase_exports')

if (!fs.existsSync(importDir)) {
  console.error('❌ 错误: 找不到导出目录', importDir)
  process.exit(1)
}

const pool = new Pool(newSupabaseConfig)

// 解析 CSV 文件
function parseCSV(content) {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim())
  const rows = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const row = {}
    headers.forEach((header, index) => {
      let value = values[index]
      if (value && value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1).replace(/""/g, '"')
      }
      if (value === '' || value === 'NULL') {
        value = null
      }
      row[header] = value
    })
    rows.push(row)
  }
  
  return rows
}

// 导入单个表
async function importTable(client, tableName) {
  const filePath = path.join(importDir, `${tableName}.csv`)
  
  if (!fs.existsSync(filePath)) {
    return { success: true, count: 0, skipped: true }
  }
  
  try {
    console.log(`📥 导入表: ${tableName}`)
    
    const content = fs.readFileSync(filePath, 'utf-8')
    const rows = parseCSV(content)
    
    if (rows.length === 0) {
      console.log(`   ℹ️ 文件为空，跳过`)
      return { success: true, count: 0 }
    }
    
    console.log(`   读取了 ${rows.length} 条记录`)
    
    // 获取列名
    const columns = Object.keys(rows[0])
    const columnList = columns.join(', ')
    
    // 清空表（如果存在）
    try {
      await client.query(`TRUNCATE TABLE "${tableName}" CASCADE`)
      console.log(`   🗑️  已清空表`)
    } catch (e) {
      // 表可能不存在，尝试创建
      console.log(`   ⚠️  表可能不存在，尝试直接插入`)
    }
    
    // 批量插入
    let insertedCount = 0
    const batchSize = 100
    
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize)
      
      for (const row of batch) {
        const values = columns.map(col => {
          const val = row[col]
          if (val === null || val === undefined) return 'NULL'
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`
          return val
        }).join(', ')
        
        const insertSQL = `INSERT INTO "${tableName}" (${columnList}) VALUES (${values}) ON CONFLICT (id) DO NOTHING`
        
        try {
          await client.query(insertSQL)
          insertedCount++
        } catch (err) {
          // 忽略个别插入错误
        }
      }
      
      process.stdout.write(`   进度: ${insertedCount}/${rows.length}\r`)
    }
    
    console.log(`   ✅ 成功导入 ${insertedCount} 条记录`)
    return { success: true, count: insertedCount }
    
  } catch (error) {
    console.error(`   ❌ 导入失败: ${error.message}`)
