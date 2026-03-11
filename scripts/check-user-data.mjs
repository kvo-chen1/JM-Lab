#!/usr/bin/env node
/**
 * 检查用户作品数据
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('==========================================')
console.log('   检查用户作品数据')
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
    // 获取用户列表
    console.log('🔍 获取用户列表...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, email')
      .limit(5)

    if (usersError) {
      console.error('❌ 获取用户失败:', usersError.message)
      return
    }

    console.log(`✅ 找到 ${users.length} 个用户:\n`)
    
    for (const user of users) {
      console.log(`用户: ${user.username} (${user.id})`)
      
      // 获取该用户的作品
      const { data: works, error: worksError } = await supabase
        .from('works')
        .select('*')
        .eq('creator_id', user.id)
      
      if (worksError) {
        console.error(`  ❌ 获取作品失败:`, worksError.message)
        continue
      }
      
      console.log(`  作品数量: ${works?.length || 0}`)
      
      if (works && works.length > 0) {
        let totalViews = 0
        let totalLikes = 0
        
        works.forEach((work, idx) => {
          const views = work.views || work.view_count || 0
          const likes = work.likes || 0
          totalViews += views
          totalLikes += likes
          
          if (idx < 3) { // 只显示前3个作品
            console.log(`    - ${work.title}: views=${views}, likes=${likes}`)
          }
        })
        
        console.log(`  总浏览量: ${totalViews}, 总点赞: ${totalLikes}`)
        
        // 显示作品字段
        console.log(`  作品字段:`, Object.keys(works[0]).join(', '))
      }
      
      console.log('')
    }
    
    // 检查所有作品的统计
    console.log('\n📊 所有作品统计:')
    const { data: allWorks, error: allWorksError } = await supabase
      .from('works')
      .select('*')
    
    if (allWorksError) {
      console.error('❌ 获取所有作品失败:', allWorksError.message)
    } else {
      console.log(`总作品数: ${allWorks?.length || 0}`)
      
      if (allWorks && allWorks.length > 0) {
        let totalViews = 0
        let totalLikes = 0
        
        allWorks.forEach(work => {
          totalViews += work.views || work.view_count || 0
          totalLikes += work.likes || 0
        })
        
        console.log(`总浏览量: ${totalViews}`)
        console.log(`总点赞: ${totalLikes}`)
      }
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message)
  }
}

checkData()
