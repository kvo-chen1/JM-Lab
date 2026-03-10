/**
 * 修复所有表的 created_at 和 updated_at 字段类型
 * 从 BIGINT 改为 TIMESTAMP WITH TIME ZONE
 */

import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const { Pool } = pg

// 获取当前文件所在目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// 加载环境变量
dotenv.config({ path: path.join(projectRoot, '.env') })

// 尝试加载 .env.local（如果存在）
const envLocalPath = path.join(projectRoot, '.env.local')
if (fs.existsSync(envLocalPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envLocalPath))
  for (const k in envConfig) {
    process.env[k] = envConfig[k]
  }
  console.log('[Fix All Timestamps] 已加载 .env.local 文件')
}

const connectionString = process.env.DATABASE_URL || 
                        process.env.POSTGRES_URL_NON_POOLING ||
                        process.env.POSTGRES_URL ||
                        process.env.NEON_DATABASE_URL

console.log('[Fix All Timestamps] 数据库连接:', connectionString?.replace(/:[^:@]+@/, ':***@'))

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('localhost') ? false : { 
    rejectUnauthorized: false 
  }
})

// 需要修复的表列表
const tablesToFix = [
  'users',
  'works',
  'posts',
  'comments',
  'work_comments',
  'work_favorites',
  'favorites',
  'likes',
  'work_likes',
  'work_collaborators',
  'notifications',
  'messages',
  'conversations',
  'conversation_participants',
  'events',
  'event_participants',
  'event_works',
  'collections',
  'collection_works',
  'reports',
  'feedbacks',
  'membership_orders',
  'points_transactions',
  'user_activities',
  'user_status',
  'user_stats',
  'creator_applications',
  'commercial_applications',
  'commercial_application_comments',
  'admin_notifications',
  'site_settings',
  'settings_history',
  'analytics_daily_stats',
  'search_logs',
  'login_logs',
  'system_logs',
  'backup_logs',
  'data_import_logs',
  'data_export_logs',
  'api_logs',
  'error_logs'
]

async function fixTable(client, tableName) {
  console.log(`\n[Fix All Timestamps] 检查表: ${tableName}`)
  
  try {
    // 检查表是否存在
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      )
    `, [tableName])
    
    if (!tableExists.rows[0].exists) {
      console.log(`[Fix All Timestamps] 表 ${tableName} 不存在，跳过`)
      return
    }
    
    // 检查字段类型
    const checkResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1 
      AND column_name IN ('created_at', 'updated_at')
    `, [tableName])
    
    if (checkResult.rows.length === 0) {
      console.log(`[Fix All Timestamps] 表 ${tableName} 没有 created_at/updated_at 字段，跳过`)
      return
    }
    
    console.log(`[Fix All Timestamps] 表 ${tableName} 当前字段类型:`, checkResult.rows)
    
    // 检查是否需要修复
    const needsFix = checkResult.rows.some(r => r.data_type === 'bigint')
    if (!needsFix) {
      console.log(`[Fix All Timestamps] 表 ${tableName} 字段类型已经是 timestamp，无需修复`)
      return
    }
    
    // 开始修复
    await client.query('BEGIN')
    
    try {
      // 检查哪些字段存在
      const hasCreatedAt = checkResult.rows.some(r => r.column_name === 'created_at' && r.data_type === 'bigint')
      const hasUpdatedAt = checkResult.rows.some(r => r.column_name === 'updated_at' && r.data_type === 'bigint')
      
      // 1. 添加临时字段
      if (hasCreatedAt) {
        await client.query(`
          ALTER TABLE ${tableName} 
          ADD COLUMN IF NOT EXISTS created_at_new TIMESTAMP WITH TIME ZONE
        `)
      }
      if (hasUpdatedAt) {
        await client.query(`
          ALTER TABLE ${tableName} 
          ADD COLUMN IF NOT EXISTS updated_at_new TIMESTAMP WITH TIME ZONE
        `)
      }
      
      // 2. 转换数据
      let updateSql = `UPDATE ${tableName} SET `
      const updateParts = []
      if (hasCreatedAt) {
        updateParts.push(`created_at_new = CASE 
          WHEN created_at IS NULL THEN NOW()
          WHEN created_at > 1000000000000000 THEN to_timestamp(created_at / 1000000)
          WHEN created_at > 1000000000000 THEN to_timestamp(created_at / 1000)
          ELSE to_timestamp(created_at)
        END`)
      }
      if (hasUpdatedAt) {
        updateParts.push(`updated_at_new = CASE 
          WHEN updated_at IS NULL THEN NOW()
          WHEN updated_at > 1000000000000000 THEN to_timestamp(updated_at / 1000000)
          WHEN updated_at > 1000000000000 THEN to_timestamp(updated_at / 1000)
          ELSE to_timestamp(updated_at)
        END`)
      }
      if (updateParts.length > 0) {
        await client.query(updateSql + updateParts.join(', '))
      }
      
      // 3. 删除旧字段
      if (hasCreatedAt) {
        await client.query(`ALTER TABLE ${tableName} DROP COLUMN IF EXISTS created_at`)
      }
      if (hasUpdatedAt) {
        await client.query(`ALTER TABLE ${tableName} DROP COLUMN IF EXISTS updated_at`)
      }
      
      // 4. 重命名新字段
      if (hasCreatedAt) {
        await client.query(`ALTER TABLE ${tableName} RENAME COLUMN created_at_new TO created_at`)
      }
      if (hasUpdatedAt) {
        await client.query(`ALTER TABLE ${tableName} RENAME COLUMN updated_at_new TO updated_at`)
      }
      
      // 5. 设置默认值
      if (hasCreatedAt) {
        await client.query(`ALTER TABLE ${tableName} ALTER COLUMN created_at SET DEFAULT NOW()`)
      }
      if (hasUpdatedAt) {
        await client.query(`ALTER TABLE ${tableName} ALTER COLUMN updated_at SET DEFAULT NOW()`)
      }
      
      await client.query('COMMIT')
      console.log(`[Fix All Timestamps] 表 ${tableName} 修复完成！`)
      
    } catch (error) {
      await client.query('ROLLBACK')
      console.error(`[Fix All Timestamps] 表 ${tableName} 修复失败:`, error.message)
    }
    
  } catch (error) {
    console.error(`[Fix All Timestamps] 检查表 ${tableName} 失败:`, error.message)
  }
}

async function fixAllTables() {
  const client = await pool.connect()
  
  try {
    console.log('[Fix All Timestamps] 开始修复所有表...')
    
    for (const tableName of tablesToFix) {
      await fixTable(client, tableName)
    }
    
    console.log('\n[Fix All Timestamps] 所有表修复完成！')
    
  } catch (error) {
    console.error('[Fix All Timestamps] 修复过程出错:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

fixAllTables().catch(console.error)
