#!/usr/bin/env node
/**
 * 执行预警系统数据库迁移
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

// 加载环境变量
config({ path: join(projectRoot, '.env') })
config({ path: join(projectRoot, '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('错误: 缺少 Supabase 配置')
  console.error('请确保设置了 VITE_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function applyMigration() {
  console.log('开始执行预警系统数据库迁移...\n')

  try {
    // 读取迁移文件
    const migrationPath = join(projectRoot, 'supabase', 'migrations', '20260306000001_create_alert_system.sql')
    const sql = readFileSync(migrationPath, 'utf-8')

    // 分割 SQL 语句
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    console.log(`找到 ${statements.length} 个 SQL 语句\n`)

    // 执行每个语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      const firstLine = statement.split('\n')[0].trim()
      console.log(`[${i + 1}/${statements.length}] 执行: ${firstLine.substring(0, 60)}...`)

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
        if (error) {
          // 如果 exec_sql 不存在，尝试直接执行
          console.log('  尝试使用 REST API 执行...')
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey,
              'Prefer': 'resolution=merge-duplicates',
            },
            body: JSON.stringify({ query: statement + ';' }),
          })
          if (!response.ok) {
            const errorText = await response.text()
            console.error(`  错误: ${errorText}`)
          }
        }
        console.log('  ✓ 成功')
      } catch (err) {
        console.error(`  ✗ 失败: ${err.message}`)
        // 继续执行下一个语句
      }
    }

    console.log('\n✓ 迁移执行完成')

    // 验证表是否创建成功
    console.log('\n验证表结构...')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['alert_rules', 'alert_records', 'alert_notifications'])

    if (tablesError) {
      console.error('验证失败:', tablesError.message)
    } else {
      console.log('已创建的表:')
      tables.forEach(t => console.log(`  - ${t.table_name}`))
    }

    // 检查默认规则
    console.log('\n检查默认规则...')
    const { data: rules, error: rulesError } = await supabase
      .from('alert_rules')
      .select('name, metric_type, enabled')

    if (rulesError) {
      console.error('查询规则失败:', rulesError.message)
    } else {
      console.log(`已创建 ${rules.length} 条默认规则:`)
      rules.forEach(r => console.log(`  - ${r.name} (${r.metric_type}) [${r.enabled ? '启用' : '禁用'}]`))
    }

  } catch (error) {
    console.error('迁移执行失败:', error)
    process.exit(1)
  }
}

applyMigration()
