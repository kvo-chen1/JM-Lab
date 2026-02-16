#!/usr/bin/env node
/**
 * 检查实际的表结构
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

// 直接查询，不使用 RPC
async function main() {
  console.log('========================================')
  console.log('🔍 检查实际表结构')
  console.log('========================================\n')

  try {
    // 尝试直接查询表
    const { data: submissionsData, error: submissionsError } = await supabaseAdmin
      .from('event_submissions')
      .select('*')
      .limit(1)
    
    if (submissionsError) {
      console.log('event_submissions 表查询错误:', submissionsError.message)
    } else {
      console.log('✅ event_submissions 表可访问')
    }
    
    // 尝试插入测试数据来检查类型
    const testTimestamp = Date.now()
    console.log('\n📋 测试时间戳:', testTimestamp)
    
    const { error: insertError } = await supabaseAdmin
      .from('event_submissions')
      .insert({
        event_id: '00000000-0000-0000-0000-000000000001',
        user_id: '00000000-0000-0000-0000-000000000001',
        participation_id: '00000000-0000-0000-0000-000000000001',
        title: '测试',
        description: '测试',
        files: [],
        status: 'draft',
        created_at: testTimestamp,
        updated_at: testTimestamp
      })
    
    if (insertError) {
      console.log('❌ bigint 时间戳插入失败:', insertError.message)
      
      // 尝试 ISO 字符串
      const isoTimestamp = new Date().toISOString()
      console.log('\n📋 测试 ISO 时间戳:', isoTimestamp)
      
      const { error: isoError } = await supabaseAdmin
        .from('event_submissions')
        .insert({
          event_id: '00000000-0000-0000-0000-000000000002',
          user_id: '00000000-0000-0000-0000-000000000002',
          participation_id: '00000000-0000-0000-0000-000000000002',
          title: '测试2',
          description: '测试2',
          files: [],
          status: 'draft',
          created_at: isoTimestamp,
          updated_at: isoTimestamp
        })
      
      if (isoError) {
        console.log('❌ ISO 时间戳插入失败:', isoError.message)
      } else {
        console.log('✅ ISO 时间戳插入成功')
      }
    } else {
      console.log('✅ bigint 时间戳插入成功')
    }
    
  } catch (err) {
    console.error('❌ 执行异常:', err)
    process.exit(1)
  }
  
  console.log('\n========================================')
}

main()
