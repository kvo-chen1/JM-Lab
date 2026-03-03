#!/usr/bin/env node
/**
 * 执行预警系统数据库迁移 - 使用直接 SQL 连接
 */
import pg from 'pg'
import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const { Pool } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

// 加载环境变量
config({ path: join(projectRoot, '.env') })
config({ path: join(projectRoot, '.env.local') })

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL

if (!databaseUrl) {
  console.error('错误: 缺少数据库连接字符串')
  console.error('请确保设置了 DATABASE_URL 或 POSTGRES_URL')
  process.exit(1)
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
})

async function applyMigration() {
  console.log('开始执行预警系统数据库迁移...\n')

  const client = await pool.connect()

  try {
    // 读取迁移文件
    const migrationPath = join(projectRoot, 'supabase', 'migrations', '20260306000001_create_alert_system.sql')
    const sql = readFileSync(migrationPath, 'utf-8')

    console.log('执行 SQL 迁移脚本...\n')

    // 执行整个 SQL 脚本
    await client.query(sql)

    console.log('✓ SQL 执行成功\n')

    // 验证表是否创建成功
    console.log('验证表结构...')
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('alert_rules', 'alert_records', 'alert_notifications')
      ORDER BY table_name
    `)

    console.log('已创建的表:')
    tablesResult.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`)
    })

    // 检查默认规则
    console.log('\n检查默认规则...')
    const rulesResult = await client.query(`
      SELECT name, metric_type, enabled 
      FROM alert_rules 
      ORDER BY created_at
    `)

    console.log(`已创建 ${rulesResult.rows.length} 条默认规则:`)
    rulesResult.rows.forEach(r => {
      console.log(`  - ${r.name} (${r.metric_type}) [${r.enabled ? '启用' : '禁用'}]`)
    })

    console.log('\n✓ 迁移执行完成！')
    console.log('\n现在您可以刷新页面使用预警功能了。')

  } catch (error) {
    console.error('\n✗ 迁移执行失败:', error.message)
    if (error.message.includes('already exists')) {
      console.log('\n提示: 表可能已经存在，您可以尝试刷新页面。')
    }
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

applyMigration()
