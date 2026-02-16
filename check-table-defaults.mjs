#!/usr/bin/env node
/**
 * 检查表默认值
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
WHERE table_schema = 'public'
AND table_name IN ('event_submissions', 'event_participants')
AND column_name IN ('created_at', 'updated_at', 'submitted_at', 'submission_date')
ORDER BY table_name, column_name;
`;

async function main() {
  console.log('========================================')
  console.log('🔍 检查表默认值')
  console.log('========================================\n')

  try {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: checkSQL })
    
    if (error) {
      console.error('❌ 查询失败:', error.message)
      process.exit(1)
    }
    
    if (data && data.length > 0) {
      console.log('📋 表结构:')
      data.forEach(col => {
        console.log(`\n  📌 ${col.table_name}.${col.column_name}`)
        console.log(`     类型: ${col.data_type}`)
        console.log(`     默认值: ${col.column_default}`)
        
        if (col.column_default && col.column_default.includes('now')) {
          console.log('     ⚠️  包含 NOW() - 需要修复为 bigint')
        }
      })
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
