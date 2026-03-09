#!/usr/bin/env node
/**
 * 只导出用户数据，排除系统 schema
 */

import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

console.log('==========================================')
console.log('   导出用户数据（排除系统 schema）')
console.log('==========================================\n')

// 旧 Supabase 连接配置
const pool = new Pool({
  host: 'db.pptqdicaaewtnaiflfcs.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'csh200506207837',
  ssl: { rejectUnauthorized: false }
})

// 系统 schema 列表（需要排除）
const systemSchemas = ['auth', 'storage', 'realtime', 'graphql', 'graphql_public', 'pgbouncer', 'vault', 'extensions', 'supabase_migrations', 'information_schema', 'pg_catalog']

async function exportUserData() {
  const client = await pool.connect()
  
  try {
    console.log('✅ 已连接到数据库\n')
    
    // 获取所有用户表（排除系统 schema）
    const tablesResult = await client.query(`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY schemaname, tablename
    `)
    
    const tables = tablesResult.rows
    console.log(`发现 ${tables.length} 个用户表\n`)
    
    // 创建输出文件
    const outputFile = 'user_data_export.sql'
    let sqlContent = `-- User data export\n-- Generated: ${new Date().toISOString()}\n\n`
    
    // 导出每个表的数据
    for (const table of tables) {
      const fullTableName = `${table.schemaname}.${table.tablename}`
      console.log(`📤 导出: ${fullTableName}`)
      
      try {
        // 获取表数据
        const dataResult = await client.query(`SELECT * FROM ${fullTableName}`)
        
        if (dataResult.rows.length === 0) {
          console.log(`   ℹ️ 表为空，跳过`)
          continue
        }
        
        // 生成 COPY 语句
        const columns = Object.keys(dataResult.rows[0]).join(', ')
        sqlContent += `-- Data for ${fullTableName}\n`
        sqlContent += `COPY ${fullTableName} (${columns}) FROM stdin;\n`
        
        // 生成数据行
        for (const row of dataResult.rows) {
          const values = Object.values(row).map(v => {
            if (v === null) return '\\N'
            if (typeof v === 'object') return JSON.stringify(v)
            return String(v).replace(/\t/g, '\\t').replace(/\n/g, '\\n')
          }).join('\t')
          sqlContent += values + '\n'
        }
        
        sqlContent += '\\.\n\n'
        console.log(`   ✅ 导出 ${dataResult.rows.length} 条记录`)
        
      } catch (error) {
        console.error(`   ❌ 导出失败: ${error.message}`)
      }
    }
    
    // 写入文件
    fs.writeFileSync(outputFile, sqlContent, 'utf-8')
    console.log(`\n✅ 导出完成: ${outputFile}`)
    
  } catch (error) {
    console.error('❌ 错误:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

exportUserData()
