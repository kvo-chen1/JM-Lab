#!/usr/bin/env node
/**
 * 检查 brands 表数据
 */

import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

const getConnectionString = () => {
  return process.env.POSTGRES_URL_NON_POOLING ||
         process.env.DATABASE_URL ||
         process.env.POSTGRES_URL ||
         process.env.NEON_DATABASE_URL
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

async function checkBrands() {
  try {
    const client = await pool.connect()
    console.log('✅ 数据库连接成功!\n')

    // 检查表是否存在
    const tableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'brands'
      )
    `)
    
    if (!tableResult.rows[0].exists) {
      console.log('❌ brands 表不存在')
      client.release()
      await pool.end()
      return
    }

    // 检查表结构
    console.log('📋 检查 brands 表结构...')
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'brands'
      ORDER BY ordinal_position
    `)

    console.log('\n表字段:')
    columnsResult.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' (NOT NULL)' : ''}`)
    })

    // 检查记录数
    const countResult = await client.query('SELECT COUNT(*) FROM brands')
    const count = parseInt(countResult.rows[0].count)
    console.log(`\n📊 记录数: ${count}`)

    if (count > 0) {
      // 查看所有数据
      const dataResult = await client.query('SELECT * FROM brands')
      console.log('\n📦 所有数据:')
      dataResult.rows.forEach((row, i) => {
        console.log(`\n[${i + 1}] ${row.name}`)
        console.log(`   ID: ${row.id}`)
        console.log(`   状态: ${row.status}`)
        console.log(`   分类: ${row.category || '无'}`)
        console.log(`   联系人: ${row.contact_person || '无'}`)
        console.log(`   创建时间: ${row.created_at}`)
      })
    } else {
      console.log('\n⚠️ 表中没有数据')
    }

    client.release()
  } catch (error) {
    console.error('❌ 检查失败:', error.message)
  } finally {
    await pool.end()
  }
}

checkBrands()
