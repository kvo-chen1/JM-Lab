#!/usr/bin/env node
/**
 * 检查 event_participants 表结构
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
  console.log('🔍 检查 event_participants 表结构')
  console.log('========================================\n')

  try {
    // 测试 updated_at 字段 - bigint
    const testBigint = Date.now()
    console.log('📋 测试 bigint 时间戳:', testBigint)
    
    const { data: bigintData, error: bigintError } = await supabaseAdmin
      .from('event_participants')
      .update({ updated_at: testBigint })
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .select()
    
    console.log('  结果:', { data: bigintData, error: bigintError })
    
    if (bigintError) {
      console.log('  ❌ 错误:', bigintError.message)
      console.log('  错误代码:', bigintError.code)
    } else {
      console.log('  ✅ 成功')
    }
    
    // 测试 ISO 字符串
    const isoTimestamp = new Date().toISOString()
    console.log('\n📋 测试 ISO 时间戳:', isoTimestamp)
    
    const { data: isoData, error: isoError } = await supabaseAdmin
      .from('event_participants')
      .update({ updated_at: isoTimestamp })
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .select()
    
    console.log('  结果:', { data: isoData, error: isoError })
    
    if (isoError) {
      console.log('  ❌ 错误:', isoError.message)
      console.log('  错误代码:', isoError.code)
    } else {
      console.log('  ✅ 成功')
    }
    
  } catch (err) {
    console.error('❌ 执行异常:', err)
    process.exit(1)
  }
  
  console.log('\n========================================')
}

main()
