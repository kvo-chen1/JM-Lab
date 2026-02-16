#!/usr/bin/env node
/**
 * 检查所有函数
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
-- 检查所有函数
SELECT 
    p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;
`;

async function main() {
  console.log('========================================')
  console.log('🔍 检查所有函数')
  console.log('========================================\n')

  try {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: checkSQL })
    
    if (error) {
      console.error('❌ 查询失败:', error.message)
      process.exit(1)
    }
    
    if (data && data.length > 0) {
      console.log(`📋 找到 ${data.length} 个函数:`)
      data.forEach(func => {
        console.log(`  - ${func.function_name}`)
      })
    } else {
      console.log('❌ 未找到任何函数')
    }
    
  } catch (err) {
    console.error('❌ 执行异常:', err)
    process.exit(1)
  }
  
  console.log('\n========================================')
}

main()
