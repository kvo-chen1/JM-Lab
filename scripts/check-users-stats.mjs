#!/usr/bin/env node
/**
 * 检查 users 表中的用户数据
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 配置')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUsers() {
  console.log('🔍 检查 users 表数据...\n')

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('likes_count', { ascending: false })

  if (error) {
    console.error('❌ 查询失败:', error.message)
    process.exit(1)
  }

  console.log(`📊 找到 ${users.length} 个用户:\n`)

  for (const user of users) {
    console.log(`👤 ${user.username} (${user.email})`)
    console.log(`   ID: ${user.id}`)
    console.log(`   作品数: ${user.posts_count || 0}`)
    console.log(`   获赞数: ${user.likes_count || 0}`)
    console.log(`   浏览量: ${user.views || 0}`)
    console.log(`   粉丝数: ${user.followers_count || 0}`)
    console.log(`   关注数: ${user.following_count || 0}`)
    console.log('')
  }

  // 检查是否有统计字段
  if (users.length > 0) {
    const firstUser = users[0]
    console.log('📋 用户对象字段:')
    console.log(Object.keys(firstUser).join(', '))
  }
}

checkUsers().catch(console.error)
