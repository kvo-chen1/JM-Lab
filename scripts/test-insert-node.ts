// 测试插入节点数据
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

async function testInsert() {
  console.log('========================================')
  console.log('测试插入节点数据')
  console.log('========================================\n')

  // 首先获取一个存在的 map_id
  const { data: mindmaps, error: mapError } = await supabase
    .from('inspiration_mindmaps')
    .select('id, user_id')
    .limit(1)

  if (mapError || !mindmaps || mindmaps.length === 0) {
    console.error('❌ 无法获取脉络:', mapError?.message || '没有脉络数据')
    return
  }

  const mapId = mindmaps[0].id
  console.log(`使用脉络 ID: ${mapId}`)

  // 测试 1: 插入最小化数据
  console.log('\n测试 1: 插入最小化数据...')
  const minimalNode = {
    map_id: mapId,
    title: '测试节点 - 最小化',
    description: '这是一个测试节点',
    category: 'inspiration'
  }

  const { data: result1, error: error1 } = await supabase
    .from('inspiration_nodes')
    .insert(minimalNode)
    .select()

  if (error1) {
    console.log('❌ 失败:', error1.message)
  } else {
    console.log('✅ 成功:', result1?.[0]?.id)
  }

  // 测试 2: 插入完整数据（不含 history）
  console.log('\n测试 2: 插入完整数据（不含 history）...')
  const fullNode = {
    map_id: mapId,
    title: '测试节点 - 完整',
    description: '这是一个完整的测试节点',
    category: 'culture',
    content: { text: '测试内容' },
    tags: ['测试', '示例'],
    version: 1
  }

  const { data: result2, error: error2 } = await supabase
    .from('inspiration_nodes')
    .insert(fullNode)
    .select()

  if (error2) {
    console.log('❌ 失败:', error2.message)
  } else {
    console.log('✅ 成功:', result2?.[0]?.id)
  }

  // 测试 3: 插入含 history 的数据
  console.log('\n测试 3: 插入含 history 的数据...')
  const nodeWithHistory = {
    map_id: mapId,
    title: '测试节点 - 含历史',
    description: '这是一个含历史的测试节点',
    category: 'ai_generate',
    content: { text: '测试内容' },
    version: 1,
    history: JSON.stringify([{
      version: 1,
      timestamp: new Date().toISOString(),
      action: 'create',
      changes: ['创建节点']
    }])
  }

  const { data: result3, error: error3 } = await supabase
    .from('inspiration_nodes')
    .insert(nodeWithHistory)
    .select()

  if (error3) {
    console.log('❌ 失败:', error3.message)
  } else {
    console.log('✅ 成功:', result3?.[0]?.id)
  }

  // 检查最终数量
  const { count, error: countError } = await supabase
    .from('inspiration_nodes')
    .select('*', { count: 'exact', head: true })

  console.log('\n========================================')
  console.log(`当前节点总数: ${count || 0}`)
  console.log('========================================')
}

testInsert().catch(console.error)
