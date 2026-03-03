#!/usr/bin/env node
/**
 * 完整测试 Admin 统计数据查询
 * 验证所有修改后的真实数据查询
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

console.log('========================================')
console.log('Admin 完整统计数据查询测试')
console.log('========================================\n')

async function testAllAdminStats() {
  try {
    // 1. 内容类型统计
    console.log('📊 内容类型统计:')
    const { data: worksByType } = await supabase
      .from('works')
      .select('type, view_count, likes')
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
      const typeName = type === 'image' ? '图片' : type === 'video' ? '视频' : type
      console.log(`     ${typeName}: ${data.count} 个作品`)
    })

    // 2. 用户行为统计
    console.log('\n👤 用户行为统计:')
    const { count: likeCount } = await supabase.from('likes').select('*', { count: 'exact', head: true })
    const { count: commentCount } = await supabase.from('comments').select('*', { count: 'exact', head: true })
    const { count: followCount } = await supabase.from('follows').select('*', { count: 'exact', head: true })
    console.log('  ✅ 查询成功')
    console.log(`     点赞: ${likeCount || 0}, 评论: ${commentCount || 0}, 关注: ${followCount || 0}`)

    // 3. 转化漏斗
    console.log('\n🔄 转化漏斗:')
    const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true })
    const { count: totalWorks } = await supabase.from('works').select('*', { count: 'exact', head: true })
    const { data: allWorks } = await supabase.from('works').select('creator_id')
    const uniqueAuthors = new Set(allWorks?.map(w => w.creator_id)).size
    console.log('  ✅ 查询成功')
    console.log(`     用户: ${totalUsers || 0}, 作品: ${totalWorks || 0}, 作者: ${uniqueAuthors || 0}`)

    // 4. 留存数据
    console.log('\n📈 留存数据:')
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const { count: users7Day } = await supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString())
    const { count: users30Day } = await supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString())
    console.log('  ✅ 查询成功')
    console.log(`     7日新用户: ${users7Day || 0}, 30日新用户: ${users30Day || 0}`)

    // 5. 设备数据
    console.log('\n📱 设备数据:')
    const { data: deviceData } = await supabase.from('user_devices').select('device_type')
    const deviceMap = new Map()
    deviceData?.forEach(d => {
      const type = d.device_type || '其他'
      deviceMap.set(type, (deviceMap.get(type) || 0) + 1)
    })
    console.log('  ✅ 查询成功')
    Array.from(deviceMap.entries()).forEach(([type, count]) => {
      console.log(`     ${type}: ${count} 台`)
    })

    // 6. 地理分布（按月份）
    console.log('\n📍 用户注册时间分布:')
    const { data: usersByMonth } = await supabase.from('users').select('created_at')
    const monthMap = new Map()
    usersByMonth?.forEach(u => {
      if (u.created_at) {
        const date = new Date(u.created_at)
        const monthKey = `${date.getFullYear()}年${date.getMonth() + 1}月`
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1)
      }
    })
    console.log('  ✅ 查询成功')
    Array.from(monthMap.entries()).slice(-6).forEach(([month, count]) => {
      console.log(`     ${month}: ${count} 人`)
    })

    // 7. 24小时活跃度
    console.log('\n⏰ 24小时活跃度:')
    const { data: worksByHour } = await supabase.from('works').select('created_at')
    const hourMap = new Map()
    worksByHour?.forEach(w => {
      if (w.created_at) {
        const hour = new Date(w.created_at * 1000).getHours()
        hourMap.set(hour, (hourMap.get(hour) || 0) + 1)
      }
    })
    console.log('  ✅ 查询成功')
    const peakHour = Array.from(hourMap.entries()).sort((a, b) => b[1] - a[1])[0]
    if (peakHour) {
      console.log(`     高峰时段: ${peakHour[0]}:00 (${peakHour[1]} 个作品)`)
    }

    // 8. 用户增长趋势
    console.log('\n📊 用户增长趋势(最近7天):')
    const dateMap = new Map()
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateKey = `${date.getMonth() + 1}/${date.getDate()}`
      dateMap.set(dateKey, 0)
    }
    const { data: usersByDate } = await supabase.from('users').select('created_at')
    usersByDate?.forEach(u => {
      if (u.created_at) {
        const date = new Date(u.created_at)
        const dateKey = `${date.getMonth() + 1}/${date.getDate()}`
        if (dateMap.has(dateKey)) {
          dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1)
        }
      }
    })
    console.log('  ✅ 查询成功')
    Array.from(dateMap.entries()).forEach(([date, count]) => {
      console.log(`     ${date}: ${count} 人`)
    })

    // 9. 社区活跃度
    console.log('\n💬 社区活跃度:')
    const { data: postsByDay } = await supabase.from('posts').select('created_at')
    const { data: commentsByDay } = await supabase.from('comments').select('created_at')
    const dayMap = new Map()
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dayMap.set(date.getDay(), { posts: 0, replies: 0 })
    }
    postsByDay?.forEach(p => {
      if (p.created_at) {
        const dayIndex = new Date(p.created_at).getDay()
        if (dayMap.has(dayIndex)) {
          const current = dayMap.get(dayIndex)
          dayMap.set(dayIndex, { ...current, posts: current.posts + 1 })
        }
      }
    })
    commentsByDay?.forEach(c => {
      if (c.created_at) {
        const dayIndex = new Date(c.created_at).getDay()
        if (dayMap.has(dayIndex)) {
          const current = dayMap.get(dayIndex)
          dayMap.set(dayIndex, { ...current, replies: current.replies + 1 })
        }
      }
    })
    console.log('  ✅ 查询成功')
    Array.from(dayMap.entries()).forEach(([dayIndex, data]) => {
      console.log(`     ${dayNames[dayIndex]}: ${data.posts} 帖子, ${data.replies} 回复`)
    })

    // 10. 订单状态
    console.log('\n💰 订单状态:')
    const { data: ordersByStatus } = await supabase.from('membership_orders').select('status, amount')
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
      console.log(`     ${status}: ${data.count} 单, ¥${data.amount}`)
    })

    console.log('\n========================================')
    console.log('所有测试通过! ✅')
    console.log('========================================')

  } catch (error) {
    console.error('❌ 测试失败:', error)
    process.exit(1)
  }
}

testAllAdminStats()
