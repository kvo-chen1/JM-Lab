#!/usr/bin/env node
/**
 * 创建作品评分相关的函数
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

// 读取 SQL 文件
const sqlFile = fs.readFileSync('./supabase/migrations/20260210000001_create_work_scoring_functions.sql', 'utf8')

async function main() {
  console.log('========================================')
  console.log('🔧 创建作品评分相关函数')
  console.log('========================================\n')

  try {
    console.log('📋 执行 SQL 文件...\n')
    
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: sqlFile })
    
    if (error) {
      console.error('❌ 执行失败:', error.message)
      console.log('\n💡 请手动在 Supabase SQL Editor 中执行以下 SQL 文件:')
      console.log('supabase/migrations/20260210000001_create_work_scoring_functions.sql')
      process.exit(1)
    }
    
    console.log('✅ 函数创建成功！')
    
  } catch (err) {
    console.error('❌ 执行异常:', err)
    console.log('\n💡 请手动在 Supabase SQL Editor 中执行以下 SQL 文件:')
    console.log('supabase/migrations/20260210000001_create_work_scoring_functions.sql')
    process.exit(1)
  }
  
  console.log('\n========================================')
}

main()
