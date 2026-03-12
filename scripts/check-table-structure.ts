// 检查 inspiration_nodes 表结构
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

async function checkTableStructure() {
  console.log('========================================')
  console.log('检查 inspiration_nodes 表结构')
  console.log('========================================\n')

  // 使用 RPC 获取表结构
  const { data, error } = await supabase.rpc('get_table_columns', {
    table_name: 'inspiration_nodes'
  })

  if (error) {
    console.log('❌ 无法获取表结构:', error.message)

    // 尝试另一种方法
    const { data: columns, error: colError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'inspiration_nodes')
      .eq('table_schema', 'public')

    if (colError) {
      console.log('❌ 备用方法也失败:', colError.message)
    } else {
      console.log('表列信息:')
      columns?.forEach((col: any) => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`)
      })
    }
  } else {
    console.log('表结构:', data)
  }

  // 检查表是否存在
  console.log('\n检查表是否存在:')
  const { count, error: countError } = await supabase
    .from('inspiration_nodes')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.log('❌ 表查询失败:', countError.message)
  } else {
    console.log(`✅ 表存在，当前有 ${count || 0} 条记录`)
  }
}

checkTableStructure().catch(console.error)
