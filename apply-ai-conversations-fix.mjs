#!/usr/bin/env node
/**
 * 修复 ai_conversations 表结构
 * 添加缺失的 message_count 列
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const { Pool } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 获取数据库连接字符串
function getConnectionString() {
  // 优先使用 NON_POOLING URL
  if (process.env.POSTGRES_URL_NON_POOLING) {
    console.log('[DB] Using POSTGRES_URL_NON_POOLING')
    return process.env.POSTGRES_URL_NON_POOLING
  }
  if (process.env.DATABASE_URL) {
    console.log('[DB] Using DATABASE_URL')
    return process.env.DATABASE_URL
  }
  if (process.env.POSTGRES_URL) {
    console.log('[DB] Using POSTGRES_URL')
    return process.env.POSTGRES_URL
  }
  throw new Error('No database connection string found. Please set DATABASE_URL or POSTGRES_URL environment variable.')
}

async function applyFix() {
  const connectionString = getConnectionString()
  
  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })

  try {
    console.log('[Fix] Connecting to database...')
    const client = await pool.connect()
    
    try {
      console.log('[Fix] Reading SQL file...')
      const sqlFile = path.join(__dirname, 'fix_ai_conversations_schema.sql')
      const sql = fs.readFileSync(sqlFile, 'utf-8')
      
      console.log('[Fix] Applying fixes...')
      await client.query(sql)
      
      console.log('[Fix] Successfully applied all fixes!')
      
      // 验证修复结果
      console.log('[Fix] Verifying fix...')
      const result = await client.query(`
        SELECT column_name, data_type, column_default
        FROM information_schema.columns 
        WHERE table_name = 'ai_conversations'
        ORDER BY ordinal_position
      `)
      
      console.log('[Fix] ai_conversations table structure:')
      result.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} ${row.column_default ? `(default: ${row.column_default})` : ''}`)
      })
      
      const hasMessageCount = result.rows.some(row => row.column_name === 'message_count')
      if (hasMessageCount) {
        console.log('[Fix] ✓ message_count column verified!')
      } else {
        console.error('[Fix] ✗ message_count column not found!')
      }
      
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('[Fix] Error applying fix:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// 加载环境变量
import dotenv from 'dotenv'
dotenv.config()
dotenv.config({ path: '.env.local', override: true })

applyFix()
