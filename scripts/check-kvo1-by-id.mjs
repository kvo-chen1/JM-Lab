#!/usr/bin/env node
/**
 * 通过 ID 检查 kvo1 用户数据
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('==========================================')
console.log('   通过 ID 检查 kvo1 用户数据')
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
    // kvo1 的 ID
    const kvo1Id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429'
    
    // 获取 kvo1 用户
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', kvo1Id)
    
    if (userError) {
      console.error('❌ 获取 kvo1 用户失败:', userError.message)
      return
    }
    
    console.log('kvo1 用户数据:', JSON.stringify(user, null, 2))
    console.log('')
    
    // 获取该用户的作品
    const { data: works, error: worksError } = await supabase
      .from('works')
      .select('*')
      .eq('creator_id', kvo1Id)
    
    if (worksError) {
      console.error('❌ 获取作品失败:', worksError.message)
      return
    }
    
    console.log(`作品数量: ${works?.length || 0}`)
    
    let totalViews = 0
    let totalLikes = 0
    
    works?.forEach((work, idx) => {
      const views = work.views || 0
      const likes = work.likes || 0
      totalViews += views
      totalLikes += likes
      
      if (idx < 5) {
        console.log(`${idx + 1}. ${work.title}`)
        console.log(`   浏览量: ${views}, 点赞: ${likes}`)
      }
    })
    
    console.log('')
    console.log(`总浏览量: ${totalViews}`)
    console.log(`总点赞: ${totalLikes}`)
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message)
  }
}

checkData()
