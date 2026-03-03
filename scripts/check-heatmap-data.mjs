#!/usr/bin/env node
/**
 * 检查用户活跃度热力图数据
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

async function checkHeatmapData() {
  console.log('========================================')
  console.log('检查用户活跃度热力图数据')
  console.log('========================================\n')

  // 查询 user_history 表
  const { data, error, count } = await supabase
    .from('user_history')
    .select('*', { count: 'exact' })
    .limit(10)

  if (error) {
    console.log('❌ 查询失败:', error.message)
    return
  }

  console.log(`✅ 总记录数: ${count || 0}`)

  if (data && data.length > 0) {
    console.log('\n📋 数据示例:')
    console.log(data[0])

    // 统计每小时的活跃度
    const activityMap = new Map()
    data.forEach(record => {
      if (record.created_at) {
        const date = new Date(record.created_at)
        const dayIndex = (date.getDay() + 6) % 7
        const hour = date.getHours()
        const key = `${dayIndex}-${hour}`
        activityMap.set(key, (activityMap.get(key) || 0) + 1)
      }
    })

    console.log('\n📊 活跃度分布:')
    Array.from(activityMap.entries()).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`)
    })
  } else {
    console.log('\n⚠️ user_history 表为空')
  }
}

checkHeatmapData()
