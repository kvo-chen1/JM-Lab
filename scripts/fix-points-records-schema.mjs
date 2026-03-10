/**
 * 修复 points_records 表结构 - 添加缺失的列
 */

import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const { Pool } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

dotenv.config({ path: path.join(projectRoot, '.env') })

const envLocalPath = path.join(projectRoot, '.env.local')
if (fs.existsSync(envLocalPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envLocalPath))
  for (const k in envConfig) {
    process.env[k] = envConfig[k]
  }
}

const connectionString = process.env.DATABASE_URL || 
                        process.env.POSTGRES_URL_NON_POOLING ||
                        process.env.POSTGRES_URL ||
                        process.env.NEON_DATABASE_URL

console.log('[Fix Points Records] 数据库连接:', connectionString?.replace(/:[^:@]+@/, ':***@'))

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('localhost') ? false : { 
    rejectUnauthorized: false 
  }
})

async function fixPointsRecordsSchema() {
  const client = await pool.connect()
  
  try {
    console.log('[Fix Points Records] 开始检查并修复 points_records 表结构...')

    // 检查现有列
    const { rows: columns } = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'points_records'
    `)
    
    const existingColumns = columns.map(c => c.column_name)
    console.log('[Fix Points Records] 现有列:', existingColumns)

    // 需要添加的列
    const columnsToAdd = []
    
    if (!existingColumns.includes('source')) {
      columnsToAdd.push({ name: 'source', type: 'TEXT NOT NULL DEFAULT \'system\'' })
    }
    if (!existingColumns.includes('source_type')) {
      columnsToAdd.push({ name: 'source_type', type: 'TEXT' })
    }
    if (!existingColumns.includes('balance_after')) {
      columnsToAdd.push({ name: 'balance_after', type: 'INTEGER DEFAULT 0' })
    }
    if (!existingColumns.includes('related_id')) {
      columnsToAdd.push({ name: 'related_id', type: 'UUID' })
    }
    if (!existingColumns.includes('related_type')) {
      columnsToAdd.push({ name: 'related_type', type: 'TEXT' })
    }
    if (!existingColumns.includes('metadata')) {
      columnsToAdd.push({ name: 'metadata', type: 'JSONB DEFAULT \'{}\'' })
    }
    if (!existingColumns.includes('expires_at')) {
      columnsToAdd.push({ name: 'expires_at', type: 'TIMESTAMP WITH TIME ZONE' })
    }

    if (columnsToAdd.length === 0) {
      console.log('[Fix Points Records] ✅ 表结构已是最新，无需修改')
    } else {
      console.log(`[Fix Points Records] 需要添加 ${columnsToAdd.length} 个列...`)
      
      for (const col of columnsToAdd) {
        try {
          await client.query(`ALTER TABLE points_records ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`)
          console.log(`[Fix Points Records] ✅ 添加列: ${col.name}`)
        } catch (e) {
          console.log(`[Fix Points Records] ⚠️ 添加列 ${col.name} 失败:`, e.message)
        }
      }
    }

    // 修改 type 列的约束
    try {
      await client.query(`
        ALTER TABLE points_records 
        DROP CONSTRAINT IF EXISTS points_records_type_check
      `)
      await client.query(`
        ALTER TABLE points_records 
        ADD CONSTRAINT points_records_type_check 
        CHECK (type IN ('earned', 'spent', 'adjustment'))
      `)
      console.log('[Fix Points Records] ✅ type 列约束已更新')
    } catch (e) {
      console.log('[Fix Points Records] ⚠️ 更新 type 约束失败:', e.message)
    }

    // 创建索引
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_points_records_user_id ON points_records(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_points_records_created_at ON points_records(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_points_records_type ON points_records(type)'
    ]

    for (const idx of indexes) {
      try {
        await client.query(idx)
        console.log(`[Fix Points Records] ✅ 创建索引: ${idx.split(' ')[5]}`)
      } catch (e) {
        console.log(`[Fix Points Records] ⚠️ 创建索引失败:`, e.message)
      }
    }

    console.log('[Fix Points Records] 🎉 表结构修复完成！')
    
  } catch (error) {
    console.error('[Fix Points Records] ❌ 修复失败:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

fixPointsRecordsSchema().catch(console.error)
