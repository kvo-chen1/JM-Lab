#!/usr/bin/env node
/**
 * 数据一致性验证脚本
 * 对比控制台显示的数据与数据库中的真实数据
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

// 加载环境变量
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' })
}
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 配置缺失')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

console.log('========================================')
console.log('数据一致性验证')
console.log('========================================\n')

async function verifyData() {
  // 1. 检查用户数据
  console.log('👤 用户数据验证:')
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
  
  if (usersError) {
    console.log('  ❌ 查询失败:', usersError.message)
  } else {
    console.log(`  ✅ 数据库中共有 ${users.length} 个用户`)
    console.log('  📋 用户列表:')
    users.slice(0, 5).forEach(u => {
      console.log(`     - ${u.username || u.email} (ID: ${u.id?.substring(0, 8)}...)`)
    })
    if (users.length > 5) console.log(`     ... 还有 ${users.length - 5} 个用户`)
  }

  // 2. 检查活动数据
  console.log('\n📅 活动数据验证:')
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (eventsError) {
    console.log('  ❌ 查询失败:', eventsError.message)
  } else {
    console.log(`  ✅ 数据库中共有 ${events?.length || 0} 个活动`)
    if (events && events.length > 0) {
      console.log('  📋 最新活动:')
      events.slice(0, 5).forEach(e => {
        console.log(`     - ${e.title} (状态: ${e.status}, 创建时间: ${new Date(e.created_at * 1000).toLocaleString()})`)
      })
    }
  }

  // 3. 检查作品数据
  console.log('\n🎨 作品数据验证:')
  const { data: works, error: worksError } = await supabase
    .from('works')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (worksError) {
    console.log('  ❌ 查询失败:', worksError.message)
  } else {
    console.log(`  ✅ 数据库中共有 ${works?.length || 0} 个作品`)
    if (works && works.length > 0) {
      console.log('  📋 最新作品:')
      works.slice(0, 5).forEach(w => {
        console.log(`     - ${w.title} (类型: ${w.type || '未知'}, 作者: ${w.author_id?.substring(0, 8)}...)`)
      })
    }
  }

  // 4. 检查帖子数据
  console.log('\n📝 帖子数据验证:')
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (postsError) {
    console.log('  ❌ 查询失败:', postsError.message)
  } else {
    console.log(`  ✅ 数据库中共有 ${posts?.length || 0} 个帖子`)
    if (posts && posts.length > 0) {
      console.log('  📋 最新帖子:')
      posts.slice(0, 5).forEach(p => {
        console.log(`     - ${p.title || '(无标题)'} (状态: ${p.status}, 作者: ${p.author_id?.substring(0, 8)}...)`)
      })
    }
  }

  // 5. 检查评论数据
  console.log('\n💬 评论数据验证:')
  const { data: comments, error: commentsError } = await supabase
    .from('comments')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (commentsError) {
    console.log('  ❌ 查询失败:', commentsError.message)
  } else {
    console.log(`  ✅ 数据库中共有 ${comments?.length || 0} 条评论`)
  }

  // 6. 检查点赞数据
  console.log('\n❤️ 点赞数据验证:')
  const { data: likes, error: likesError } = await supabase
    .from('likes')
    .select('*')
  
  if (likesError) {
    console.log('  ❌ 查询失败:', likesError.message)
  } else {
    console.log(`  ✅ 数据库中共有 ${likes?.length || 0} 条点赞记录`)
  }

  // 7. 检查消息数据
  console.log('\n📨 消息数据验证:')
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (messagesError) {
    console.log('  ❌ 查询失败:', messagesError.message)
  } else {
    console.log(`  ✅ 数据库中共有 ${messages?.length || 0} 条消息`)
  }

  // 8. 检查关注数据
  console.log('\n🔗 关注数据验证:')
  const { data: follows, error: followsError } = await supabase
    .from('follows')
    .select('*')
  
  if (followsError) {
    console.log('  ❌ 查询失败:', followsError.message)
  } else {
    console.log(`  ✅ 数据库中共有 ${follows?.length || 0} 条关注记录`)
  }

  // 9. 检查生成任务数据
  console.log('\n🤖 AI生成任务验证:')
  const { data: tasks, error: tasksError } = await supabase
    .from('generation_tasks')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (tasksError) {
    console.log('  ❌ 查询失败:', tasksError.message)
  } else {
    console.log(`  ✅ 数据库中共有 ${tasks?.length || 0} 个生成任务`)
    if (tasks && tasks.length > 0) {
      const statusCount = {}
      tasks.forEach(t => {
        statusCount[t.status] = (statusCount[t.status] || 0) + 1
      })
      console.log('  📊 任务状态分布:', statusCount)
    }
  }

  // 10. 检查存储桶
  console.log('\n📦 Storage 存储桶验证:')
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
  
  if (bucketsError) {
    console.log('  ❌ 查询失败:', bucketsError.message)
  } else {
    console.log(`  ✅ 共有 ${buckets?.length || 0} 个存储桶`)
    buckets?.forEach(b => {
      console.log(`     - ${b.name} (${b.public ? '公开' : '私有'})`)
    })
  }

  console.log('\n========================================')
  console.log('数据验证完成')
  console.log('========================================')
  console.log('\n💡 提示:')
  console.log('   - 如果控制台显示的数据与上述数据库数据不一致，可能是由于:')
  console.log('     1. 30秒缓存机制 (CACHE_TTL = 30000ms)')
  console.log('     2. 前端本地缓存')
  console.log('     3. 数据在传输过程中被转换或过滤')
  console.log('   - 建议在使用 "refresh=true" 参数刷新缓存后对比数据')
}

verifyData().catch(console.error)
