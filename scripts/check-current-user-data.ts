// 检查当前登录用户的数据
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

async function checkCurrentUserData() {
  console.log('========================================')
  console.log('检查用户创作脉络数据')
  console.log('========================================\n')

  // 从浏览器 localStorage 或 session 获取当前用户ID
  // 这里我们列出所有用户的数据分布
  console.log('1. 所有脉络的用户分布:')
  const { data: mindmaps, error } = await supabase
    .from('inspiration_mindmaps')
    .select('user_id, title, id')

  if (error) {
    console.log(`   ❌ 查询失败: ${error.message}`)
    return
  }

  // 按用户分组统计
  const userMap = new Map<string, { count: number; ids: string[] }>()
  mindmaps?.forEach((m: any) => {
    const existing = userMap.get(m.user_id) || { count: 0, ids: [] }
    existing.count++
    existing.ids.push(m.id)
    userMap.set(m.user_id, existing)
  })

  console.log(`   共 ${userMap.size} 个用户创建了脉络:\n`)
  userMap.forEach((data, userId) => {
    console.log(`   用户: ${userId}`)
    console.log(`   - 脉络数量: ${data.count}`)
    console.log(`   - 脉络ID: ${data.ids.slice(0, 3).join(', ')}${data.ids.length > 3 ? '...' : ''}`)
    console.log('')
  })

  // 检查每个用户的节点数量
  console.log('2. 检查每个用户的节点数据:')
  for (const [userId, data] of userMap.entries()) {
    const mapIds = data.ids
    const { data: nodes, error: nodesError } = await supabase
      .from('inspiration_nodes')
      .select('id, map_id, title')
      .in('map_id', mapIds)

    if (nodesError) {
      console.log(`   用户 ${userId.substring(0, 8)}...: 查询失败 - ${nodesError.message}`)
    } else {
      console.log(`   用户 ${userId.substring(0, 8)}...: ${nodes?.length || 0} 个节点`)
      if (nodes && nodes.length > 0) {
        nodes.slice(0, 3).forEach((n: any) => {
          console.log(`      - ${n.title}`)
        })
      }
    }
  }

  console.log('\n========================================')
  console.log('数据检查完成')
  console.log('========================================')
  console.log('\n💡 提示: 请检查浏览器控制台获取当前登录用户的ID')
  console.log('   然后在上方列表中找到对应的用户数据')
}

checkCurrentUserData().catch(console.error)
