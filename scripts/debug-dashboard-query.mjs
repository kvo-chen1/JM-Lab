#!/usr/bin/env node
/**
 * 模拟 Dashboard 查询
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('==========================================')
console.log('   模拟 Dashboard 查询')
console.log('==========================================\n')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误: 环境变量未设置')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function debugQuery() {
  try {
    // kvo1 的 ID
    const userId = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429'
    
    console.log('🔍 查询用户作品 (使用 Supabase 客户端)...')
    console.log('用户 ID:', userId)
    console.log('')
    
    // 模拟 Dashboard.tsx 中的查询
    const { data: works, error } = await supabase
      .from('works')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ 查询失败:', error.message)
      return
    }
    
    console.log(`✅ 查询成功，作品数量: ${works?.length || 0}`)
    console.log('')
    
    if (works && works.length > 0) {
      // 显示第一个作品的字段
      console.log('第一个作品的字段:')
      console.log(JSON.stringify(works[0], null, 2))
      console.log('')
      
      // 计算总浏览量和点赞
      let totalViews = 0
      let totalLikes = 0
      
      works.forEach(work => {
        // Dashboard.tsx 使用的是 view_count
        const views = work.view_count || 0
        const likes = work.likes || 0
        totalViews += views
        totalLikes += likes
      })
      
      console.log('使用 view_count 字段计算:')
      console.log(`总浏览量: ${totalViews}`)
      console.log(`总点赞: ${totalLikes}`)
      console.log('')
      
      // 使用 views 字段计算
      totalViews = 0
      totalLikes = 0
      
      works.forEach(work => {
        const views = work.views || 0
        const likes = work.likes || 0
        totalViews += views
        totalLikes += likes
      })
      
      console.log('使用 views 字段计算:')
      console.log(`总浏览量: ${totalViews}`)
      console.log(`总点赞: ${totalLikes}`)
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message)
  }
}

debugQuery()
