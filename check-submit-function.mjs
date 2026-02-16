#!/usr/bin/env node
/**
 * 检查 submit_event_work 函数定义
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

const checkSQL = `
-- 检查 submit_event_work 函数
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'submit_event_work';
`;

async function main() {
  console.log('========================================')
  console.log('🔍 检查 submit_event_work 函数')
  console.log('========================================\n')

  try {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: checkSQL })
    
    if (error) {
      console.error('❌ 查询失败:', error.message)
      process.exit(1)
    }
    
    if (data && data.length > 0) {
      console.log('📋 函数定义:')
      console.log(data[0].function_definition)
      
      // 检查是否包含 NOW()
      if (data[0].function_definition.includes('NOW()')) {
        console.log('\n⚠️  警告: 函数中仍然包含 NOW()')
      } else {
        console.log('\n✅ 函数中没有 NOW()')
      }
    } else {
      console.log('❌ 未找到函数')
    }
    
  } catch (err) {
    console.error('❌ 执行异常:', err)
    process.exit(1)
  }
  
  console.log('\n========================================')
}

main()
