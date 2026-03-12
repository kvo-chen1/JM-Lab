// 检查创作脉络数据
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// 加载环境变量
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 配置')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function checkData() {
  console.log('========================================')
  console.log('创作脉络数据检查')
  console.log('========================================\n')

  // 1. 检查 inspiration_mindmaps 表
  console.log('1. 检查脉络表 (inspiration_mindmaps):')
  const { data: mindmaps, error: mindmapsError } = await supabase
    .from('inspiration_mindmaps')
    .select('*')
    .limit(10)

  if (mindmapsError) {
    console.log(`   ❌ 查询失败: ${mindmapsError.message}`)
    console.log(`   错误代码: ${mindmapsError.code}`)
  } else {
    console.log(`   ✅ 查询成功，找到 ${mindmaps?.length || 0} 条脉络`)
    if (mindmaps && mindmaps.length > 0) {
      mindmaps.forEach((m: any) => {
        console.log(`      - ${m.title} (ID: ${m.id}, User: ${m.user_id})`)
      })
    }
  }

  // 2. 检查 inspiration_nodes 表
  console.log('\n2. 检查节点表 (inspiration_nodes):')
  const { data: nodes, error: nodesError } = await supabase
    .from('inspiration_nodes')
    .select('*')
    .limit(10)

  if (nodesError) {
    console.log(`   ❌ 查询失败: ${nodesError.message}`)
    console.log(`   错误代码: ${nodesError.code}`)
  } else {
    console.log(`   ✅ 查询成功，找到 ${nodes?.length || 0} 条节点`)
    if (nodes && nodes.length > 0) {
      nodes.forEach((n: any) => {
        console.log(`      - ${n.title} (ID: ${n.id}, MapID: ${n.map_id})`)
      })
    }
  }

  // 3. 检查表是否存在
  console.log('\n3. 检查表结构:')
  const tables = ['inspiration_mindmaps', 'inspiration_nodes', 'inspiration_stories', 'inspiration_ai_suggestions']
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.log(`   ❌ ${table}: ${error.message}`)
    } else {
      console.log(`   ✅ ${table}: 存在 (${count || 0} 条记录)`)
    }
  }

  // 4. 检查 RLS 策略
  console.log('\n4. 检查 RLS (行级安全) 策略:')
  const { data: rlsData, error: rlsError } = await supabase.rpc('get_policies', {
    table_name: 'inspiration_mindmaps'
  })

  if (rlsError) {
    console.log(`   ⚠️ 无法获取 RLS 策略: ${rlsError.message}`)
  } else {
    console.log(`   RLS 策略:`, rlsData)
  }

  // 5. 测试特定用户的数据
  console.log('\n5. 测试特定用户数据:')
  const testUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' // 示例用户ID
  const { data: userMindmaps, error: userError } = await supabase
    .from('inspiration_mindmaps')
    .select('*')
    .eq('user_id', testUserId)

  if (userError) {
    console.log(`   ❌ 查询失败: ${userError.message}`)
  } else {
    console.log(`   用户 ${testUserId} 有 ${userMindmaps?.length || 0} 条脉络`)
  }

  console.log('\n========================================')
  console.log('检查完成')
  console.log('========================================')
}

checkData().catch(console.error)
