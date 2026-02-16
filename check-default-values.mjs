#!/usr/bin/env node
/**
 * 检查默认值
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
SELECT 
    table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('event_submissions', 'event_participants')
AND column_name IN ('created_at', 'updated_at', 'submitted_at', 'submission_date')
AND table_schema = 'public'
ORDER BY table_name, column_name;
`;

async function main() {
  console.log('========================================')
  console.log('🔍 检查默认值')
  console.log('========================================\n')

  try {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: checkSQL })
    
    if (error) {
      console.error('❌ 查询失败:', error.message)
      process.exit(1)
    }
    
    if (data && data.length > 0) {
      console.log('📋 列信息:')
      console.table(data)
      
      // 检查是否有 NOW() 默认值
      const nowDefaults = data.filter(col => col.column_default && col.column_default.includes('now'))
      if (nowDefaults.length > 0) {
        console.log('\n⚠️  包含 NOW() 默认值的列:')
        nowDefaults.forEach(col => {
          console.log(`  - ${col.table_name}.${col.column_name}: ${col.column_default}`)
        })
      }
    } else {
      console.log('ℹ️  未找到列信息')
    }
    
  } catch (err) {
    console.error('❌ 执行异常:', err)
    process.exit(1)
  }
  
  console.log('\n========================================')
}

main()
