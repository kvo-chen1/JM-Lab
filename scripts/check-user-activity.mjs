#!/usr/bin/env node
/**
 * 检查可用于用户活跃度统计的数据
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' })
}
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function checkUserActivity() {
  console.log('========================================')
  console.log('检查用户活跃度数据源')
  console.log('========================================\n')

  // 检查 users 表是否有 last_active 或类似字段
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .limit(1)

  if (userError) {
    console.log('❌ users 表查询失败:', userError.message)
  } else if (userData && userData.length > 0) {
    console.log('📋 users 表字段:')
    const fields = Object.keys(userData[0])
    const timeFields = fields.filter(f => 
      f.includes('time') || f.includes('active') || f.includes('login') || f.includes('online')
    )
    console.log('时间相关字段:', timeFields.length > 0 ? timeFields : '无')
    console.log('所有字段:', fields)
  }

  // 检查 works 表的创建时间分布
  const { data: worksData, error: worksError } = await supabase
    .from('works')
    .select('created_at')

  if (worksError) {
    console.log('\n❌ works 表查询失败:', worksError.message)
  } else {
    console.log(`\n✅ works 表: ${worksData?.length || 0} 条记录`)
    
    // 统计每小时的分布
    const hourMap = new Map()
    worksData?.forEach(work => {
      if (work.created_at) {
        const date = new Date(work.created_at * 1000)
        const dayIndex = (date.getDay() + 6) % 7 // 周一开始
        const hour = date.getHours()
        const key = `${dayIndex}-${hour}`
        hourMap.set(key, (hourMap.get(key) || 0) + 1)
      }
    })

    console.log('\n📊 作品创建时间分布（前10个时段）:')
    Array.from(hourMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([key, count]) => {
        console.log(`  ${key}: ${count} 个作品`)
      })
  }

  // 检查 likes 表的时间分布
  const { data: likesData, error: likesError } = await supabase
    .from('likes')
    .select('created_at')

  if (likesError) {
    console.log('\n❌ likes 表查询失败:', likesError.message)
  } else {
    console.log(`\n✅ likes 表: ${likesData?.length || 0} 条记录`)
  }

  // 检查 comments 表的时间分布
  const { data: commentsData, error: commentsError } = await supabase
    .from('comments')
    .select('created_at')

  if (commentsError) {
    console.log('\n❌ comments 表查询失败:', commentsError.message)
  } else {
    console.log(`\n✅ comments 表: ${commentsData?.length || 0} 条记录`)
  }

  console.log('\n========================================')
  console.log('结论:')
  console.log('========================================')
  console.log('由于没有 user_history 表记录用户在线时间，')
  console.log('目前只能使用以下数据作为活跃度的替代指标：')
  console.log('1. 作品创建时间 (works.created_at)')
  console.log('2. 点赞时间 (likes.created_at)')
  console.log('3. 评论时间 (comments.created_at)')
  console.log('')
  console.log('如需真正的用户在线时间，需要：')
  console.log('- 创建 user_sessions 表记录用户登录/活跃时间')
  console.log('- 或在 users 表添加 last_active 字段')
}

checkUserActivity()
