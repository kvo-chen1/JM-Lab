#!/usr/bin/env node
/**
 * 测试 submit_event_work 函数
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
  console.error('❌ 缺少 Supabase 配置')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function main() {
  console.log('========================================')
  console.log('🧪 测试 submit_event_work 函数')
  console.log('========================================\n')

  try {
    // 测试函数调用
    console.log('📋 调用 submit_event_work 函数...')
    
    const { data, error } = await supabaseAdmin.rpc('submit_event_work', {
      p_event_id: '00000000-0000-0000-0000-000000000000',
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_participation_id: '00000000-0000-0000-0000-000000000000',
      p_title: '测试作品',
      p_description: '测试描述',
      p_files: []
    })
    
    console.log('结果:', { data, error })
    
    if (error) {
      console.log('\n❌ 错误:', error.message)
      console.log('错误代码:', error.code)
      
      if (error.message.includes('Participation not found')) {
        console.log('\n✅ 函数正常工作（返回预期的 Participation not found）')
      }
    } else {
      console.log('\n✅ 函数返回:', data)
    }
    
  } catch (err) {
    console.error('❌ 执行异常:', err)
    process.exit(1)
  }
  
  console.log('\n========================================')
}

main()
