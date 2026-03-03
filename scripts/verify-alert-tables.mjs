#!/usr/bin/env node
/**
 * 验证预警系统表结构
 */
import pg from 'pg'
import { config } from 'dotenv'
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

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
})

async function verifyTables() {
  const client = await pool.connect()

  try {
    console.log('验证预警系统表结构...\n')

    // 检查表是否存在
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('alert_rules', 'alert_records', 'alert_notifications')
      ORDER BY table_name
    `)

    console.log('✓ 已创建的表:')
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`)
    })

    if (tablesResult.rows.length === 0) {
      console.log('✗ 没有找到预警系统表')
      return
    }

    // 检查默认规则
    console.log('\n✓ 默认预警规则:')
    const rulesResult = await client.query(`
      SELECT name, metric_type, threshold, operator, severity, enabled 
      FROM alert_rules 
      ORDER BY created_at
    `)

    if (rulesResult.rows.length === 0) {
      console.log('  (暂无规则)')
    } else {
      rulesResult.rows.forEach(r => {
        const op = r.operator === 'gt' ? '>' : r.operator === 'lt' ? '<' : r.operator
        console.log(`  - ${r.name}`)
        console.log(`    ${r.metric_type} ${op} ${r.threshold} [${r.severity}] ${r.enabled ? '✓' : '✗'}`)
      })
    }

    // 检查活跃预警
    console.log('\n✓ 活跃预警记录:')
    const alertsResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM alert_records 
      WHERE status = 'active'
    `)
    console.log(`  当前有 ${alertsResult.rows[0].count} 个活跃预警`)

    console.log('\n✓ 验证完成！预警系统已就绪。')

  } catch (error) {
    console.error('验证失败:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

verifyTables()
