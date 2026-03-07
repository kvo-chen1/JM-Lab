#!/usr/bin/env node
/**
 * 执行 SQL 迁移脚本
 */

import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

const getConnectionString = () => {
  return process.env.POSTGRES_URL_NON_POOLING ||
         process.env.DATABASE_URL ||
         process.env.POSTGRES_URL ||
         process.env.NEON_DATABASE_URL ||
         process.env.NEON_URL
}

const connectionString = getConnectionString()

if (!connectionString) {
  console.error('❌ 错误: 找不到数据库连接字符串')
  process.exit(1)
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
})

async function executeSql(filePath) {
  const client = await pool.connect()
  try {
    console.log(`📄 执行: ${filePath}`)
    const sql = fs.readFileSync(filePath, 'utf8')
    await client.query(sql)
    console.log(`✅ ${filePath} 执行成功`)
  } catch (error) {
    console.error(`❌ ${filePath} 执行失败:`, error.message)
    throw error
  } finally {
    client.release()
  }
}

async function main() {
  try {
    // 执行表创建脚本
    await executeSql('scripts/create-missing-tables.sql')
    
    // 执行函数创建脚本
    await executeSql('scripts/create-missing-functions.sql')
    
    console.log('\n✅ 所有迁移执行完成!')
  } catch (error) {
    console.error('❌ 迁移失败:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
