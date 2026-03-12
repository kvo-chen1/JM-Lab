// 修复 inspiration_nodes 表结构
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 配置')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function fixTable() {
  console.log('========================================')
  console.log('修复 inspiration_nodes 表结构')
  console.log('========================================\n')

  // 需要添加的列
  const columnsToAdd = [
    { name: 'position', type: 'jsonb' },
    { name: 'version', type: 'integer DEFAULT 1' },
    { name: 'history', type: 'jsonb DEFAULT \'[]\'::jsonb' }
  ]

  for (const col of columnsToAdd) {
    console.log(`添加列: ${col.name} (${col.type})...`)

    // 使用 RPC 执行 ALTER TABLE
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE public.inspiration_nodes ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`
    })

    if (error) {
      console.log(`❌ 添加 ${col.name} 失败:`, error.message)

      // 尝试直接执行 SQL
      try {
        const { error: rawError } = await supabase.from('inspiration_nodes').select('*').limit(0)
        if (rawError?.message?.includes(col.name)) {
          console.log(`   列 ${col.name} 可能已存在或表结构有问题`)
        }
      } catch (e) {
        // ignore
      }
    } else {
      console.log(`✅ 添加 ${col.name} 成功`)
    }
  }

  console.log('\n========================================')
  console.log('表结构修复完成')
  console.log('========================================')
}

fixTable().catch(console.error)
