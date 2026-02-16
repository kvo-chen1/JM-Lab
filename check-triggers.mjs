#!/usr/bin/env node
/**
 * 检查触发器
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
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('event_submissions', 'event_participants')
ORDER BY event_object_table, trigger_name;
`;

async function main() {
  console.log('========================================')
  console.log('🔍 检查触发器')
  console.log('========================================\n')

  try {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: checkSQL })
    
    if (error) {
      console.error('❌ 查询失败:', error.message)
      process.exit(1)
    }
    
    if (data && data.length > 0) {
      console.log('📋 发现的触发器:')
      data.forEach(trigger => {
        console.log(`\n  表: ${trigger.event_object_table}`)
        console.log(`  触发器: ${trigger.trigger_name}`)
        console.log(`  事件: ${trigger.event_manipulation}`)
        console.log(`  动作: ${trigger.action_statement}`)
        
        // 检查是否包含 NOW()
        if (trigger.action_statement.includes('NOW()')) {
          console.log(`  ⚠️  警告: 包含 NOW()`)
        }
      })
    } else {
      console.log('ℹ️  未发现触发器')
    }
    
  } catch (err) {
    console.error('❌ 执行异常:', err)
    process.exit(1)
  }
  
  console.log('\n========================================')
}

main()
