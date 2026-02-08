#!/usr/bin/env node
/**
 * 为排行榜添加测试用户数据
 * 这个脚本会在 Supabase 的 users 表中创建一些测试用户
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 配置')
  console.error('请设置环境变量 VITE_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 或 VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

// 使用 Service Role Key 可以绕过 RLS 策略
const supabase = createClient(supabaseUrl, supabaseKey)

// 测试用户数据
const testUsers = [
  {
    id: randomUUID(),
    username: '创意达人',
    email: 'user1@test.com',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1&backgroundColor=b6e3f4',
    posts_count: 15,
    likes_count: 1280,
    views: 5600,
    followers_count: 89,
    following_count: 45
  },
  {
    id: randomUUID(),
    username: '设计大师',
    email: 'user2@test.com',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2&backgroundColor=c0aede',
    posts_count: 23,
    likes_count: 2150,
    views: 8900,
    followers_count: 156,
    following_count: 78
  },
  {
    id: randomUUID(),
    username: '艺术小匠',
    email: 'user3@test.com',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3&backgroundColor=d1d4f9',
    posts_count: 8,
    likes_count: 560,
    views: 2300,
    followers_count: 34,
    following_count: 67
  },
  {
    id: randomUUID(),
    username: '摄影师阿明',
    email: 'user4@test.com',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user4&backgroundColor=ffd5dc',
    posts_count: 31,
    likes_count: 3420,
    views: 12500,
    followers_count: 234,
    following_count: 123
  },
  {
    id: randomUUID(),
    username: '插画师小美',
    email: 'user5@test.com',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user5&backgroundColor=ffdfbf',
    posts_count: 19,
    likes_count: 1890,
    views: 7800,
    followers_count: 145,
    following_count: 89
  }
]

async function seedUsers() {
  console.log('🚀 开始添加测试用户数据...\n')

  // 先检查 users 表是否存在以及结构
  console.log('📊 检查 users 表结构...')
  const { data: existingUsers, error: checkError } = await supabase
    .from('users')
    .select('id')
    .limit(1)

  if (checkError) {
    console.error('❌ 检查 users 表失败:', checkError.message)
    console.error('请确保：')
    console.error('1. Supabase 项目已创建')
    console.error('2. users 表已创建')
    console.error('3. 迁移文件已执行')
    process.exit(1)
  }

  console.log('✅ users 表存在\n')

  // 检查是否已有用户数据
  const { count, error: countError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('❌ 获取用户数量失败:', countError.message)
    process.exit(1)
  }

  console.log(`📈 当前用户数量: ${count || 0}\n`)

  if (count > 0) {
    console.log('⚠️  数据库中已有用户数据，跳过添加测试数据')
    console.log('如果需要重新添加，请先清空 users 表\n')
    return
  }

  // 添加测试用户
  console.log('📝 添加测试用户...\n')

  for (const user of testUsers) {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()

    if (error) {
      console.error(`❌ 添加用户 ${user.username} 失败:`, error.message)
    } else {
      console.log(`✅ 已添加用户: ${user.username}`)
      console.log(`   作品数: ${user.posts_count}, 获赞: ${user.likes_count}, 浏览: ${user.views}`)
    }
  }

  console.log('\n🎉 测试用户数据添加完成！')
  console.log('现在刷新排行榜页面应该能看到用户数据了。')
}

seedUsers().catch(console.error)
