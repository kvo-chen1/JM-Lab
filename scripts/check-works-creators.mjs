#!/usr/bin/env node
/**
 * 检查作品 creator_id 分布
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('==========================================')
console.log('   检查作品 creator_id 分布')
console.log('==========================================\n')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误: 环境变量未设置')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function checkData() {
  try {
    // 获取所有作品
    const { data: works, error } = await supabase
      .from('works')
      .select('id, title, creator_id, views, likes')
    
    if (error) {
      console.error('❌ 获取作品失败:', error.message)
      return
    }
    
    console.log(`总作品数: ${works?.length || 0}\n`)
    
    // 按 creator_id 分组统计
    const creatorStats = {}
    
    works?.forEach(work => {
      const creatorId = work.creator_id || 'null'
      if (!creatorStats[creatorId]) {
        creatorStats[creatorId] = {
          count: 0,
          totalViews: 0,
          totalLikes: 0,
          works: []
        }
      }
      creatorStats[creatorId].count++
      creatorStats[creatorId].totalViews += work.views || 0
      creatorStats[creatorId].totalLikes += work.likes || 0
      creatorStats[creatorId].works.push(work.title)
    })
    
    // 显示统计结果
    console.log('📊 按 creator_id 分组统计:\n')
    
    for (const [creatorId, stats] of Object.entries(creatorStats)) {
      console.log(`Creator ID: ${creatorId}`)
      console.log(`  作品数: ${stats.count}`)
      console.log(`  总浏览量: ${stats.totalViews}`)
      console.log(`  总点赞: ${stats.totalLikes}`)
      console.log(`  作品示例: ${stats.works.slice(0, 3).join(', ')}${stats.works.length > 3 ? '...' : ''}`)
      console.log('')
    }
    
    // 查找 kvo7 用户
    console.log('\n🔍 查找 kvo7 用户...')
    const { data: kvo7User, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'kvo7')
      .single()
    
    if (userError) {
      console.log('未找到 kvo7 用户:', userError.message)
    } else {
      console.log('kvo7 用户 ID:', kvo7User.id)
      console.log('kvo7 用户数据:', JSON.stringify(kvo7User, null, 2))
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message)
  }
}

checkData()
