#!/usr/bin/env node
/**
 * 更新现有用户的统计数据
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 配置')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// 为现有用户分配的随机统计数据
const userStats = [
  { posts_count: 12, likes_count: 1580, views: 6200, followers_count: 89, following_count: 45 },
  { posts_count: 8, likes_count: 920, views: 3800, followers_count: 56, following_count: 34 }
]

async function updateUsersStats() {
  console.log('🚀 开始更新用户统计数据...\n')

  // 获取所有用户
  const { data: users, error: fetchError } = await supabase
    .from('users')
    .select('id, username')

  if (fetchError) {
    console.error('❌ 获取用户失败:', fetchError.message)
    process.exit(1)
  }

  console.log(`📊 找到 ${users.length} 个用户\n`)

  for (let i = 0; i < users.length; i++) {
    const user = users[i]
    const stats = userStats[i % userStats.length]

    const { error: updateError } = await supabase
      .from('users')
      .update(stats)
      .eq('id', user.id)

    if (updateError) {
      console.error(`❌ 更新用户 ${user.username} 失败:`, updateError.message)
    } else {
      console.log(`✅ 已更新用户: ${user.username}`)
      console.log(`   作品数: ${stats.posts_count}, 获赞: ${stats.likes_count}, 浏览: ${stats.views}`)
    }
  }

  console.log('\n🎉 用户统计数据更新完成！')
  console.log('刷新排行榜页面应该能看到数据了。')
}

updateUsersStats().catch(console.error)
