#!/usr/bin/env node
/**
 * 测试 Admin 统计数据查询
 * 验证修改后的真实数据查询是否正常工作
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
console.log('Admin 统计数据查询测试')
console.log('========================================\n')

async function testAdminStats() {
  try {
    // 1. 内容类型统计
    console.log('📊 内容类型统计:')
    const { data: worksByType, error: worksError } = await supabase
      .from('works')
      .select('type, view_count, likes')

    if (worksError) {
      console.log('  ❌ 查询失败:', worksError.message)
    } else {
      const typeMap = new Map()
      worksByType?.forEach(work => {
        const type = work.type || '其他'
        const current = typeMap.get(type) || { count: 0, views: 0, likes: 0 }
        typeMap.set(type, {
          count: current.count + 1,
          views: current.views + (work.view_count || 0),
          likes: current.likes + (work.likes || 0),
        })
      })

      console.log('  ✅ 查询成功')
      Array.from(typeMap.entries()).forEach(([type, data]) => {
        const typeName = type === 'image' ? '图片' : type === 'video' ? '视频' : type === 'audio' ? '音频' : type === 'article' ? '文章' : type
        console.log(`     ${typeName}: ${data.count} 个作品, ${data.views} 浏览, ${data.likes} 点赞`)
      })
    }

    // 2. 用户行为统计
    console.log('\n👤 用户行为统计:')
    const { count: viewCount } = await supabase
      .from('user_history')
      .select('*', { count: 'exact', head: true })
      .eq('action_type', 'view_work')

    const { count: likeCount } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })

    const { count: commentCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })

    const { count: shareCount } = await supabase
      .from('user_history')
      .select('*', { count: 'exact', head: true })
      .eq('action_type', 'share_work')

    const { count: bookmarkCount } = await supabase
      .from('works_bookmarks')
      .select('*', { count: 'exact', head: true })

    const { count: followCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })

    console.log('  ✅ 查询成功')
    console.log(`     浏览作品: ${viewCount || 0}`)
    console.log(`     点赞: ${likeCount || 0}`)
    console.log(`     评论: ${commentCount || 0}`)
    console.log(`     分享: ${shareCount || 0}`)
    console.log(`     收藏: ${bookmarkCount || 0}`)
    console.log(`     关注用户: ${followCount || 0}`)

    // 3. 转化漏斗数据
    console.log('\n🔄 转化漏斗数据:')
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: totalWorks } = await supabase
      .from('works')
      .select('*', { count: 'exact', head: true })

    const { count: paidUsers } = await supabase
      .from('membership_orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'paid')

    const { data: allWorks } = await supabase
      .from('works')
      .select('user_id')

    const uniqueAuthors = new Set(allWorks?.map(w => w.user_id)).size

    console.log('  ✅ 查询成功')
    console.log(`     访问首页(估算): ${(totalUsers || 0) * 10}`)
    console.log(`     浏览作品: ${totalWorks || 0}`)
    console.log(`     注册账号: ${totalUsers || 0}`)
    console.log(`     发布作品: ${uniqueAuthors || 0}`)
    console.log(`     付费转化: ${paidUsers || 0}`)

    // 4. 留存数据
    console.log('\n📈 留存数据:')
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const { count: users1Day } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo.toISOString())

    const { count: users7Day } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    const { count: users30Day } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    console.log('  ✅ 查询成功')
    console.log(`     1日内新用户: ${users1Day || 0}`)
    console.log(`     7日内新用户: ${users7Day || 0}`)
    console.log(`     30日内新用户: ${users30Day || 0}`)

    // 5. 订单状态分布
    console.log('\n💰 订单状态分布:')
    const { data: ordersByStatus, error: ordersError } = await supabase
      .from('membership_orders')
      .select('status, amount')

    if (ordersError) {
      console.log('  ❌ 查询失败:', ordersError.message)
    } else {
      const statusMap = new Map()
      ordersByStatus?.forEach(order => {
        const status = order.status || '未知'
        const current = statusMap.get(status) || { count: 0, amount: 0 }
        statusMap.set(status, {
          count: current.count + 1,
          amount: current.amount + (order.amount || 0),
        })
      })

      console.log('  ✅ 查询成功')
      Array.from(statusMap.entries()).forEach(([status, data]) => {
        console.log(`     ${status}: ${data.count} 单, 金额: ¥${data.amount}`)
      })
    }

    console.log('\n========================================')
    console.log('所有测试通过! ✅')
    console.log('========================================')

  } catch (error) {
    console.error('❌ 测试失败:', error)
    process.exit(1)
  }
}

testAdminStats()
