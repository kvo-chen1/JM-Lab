#!/usr/bin/env node
/**
 * 验证 user_sessions 表是否创建成功
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' })
}
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function verifyTable() {
  console.log('========================================')
  console.log('验证 user_sessions 表')
  console.log('========================================\n')

  // 尝试查询表
  const { data, error, count } = await supabase
    .from('user_sessions')
    .select('*', { count: 'exact' })
    .limit(1)

  if (error) {
    console.log('❌ 表查询失败:', error.message)
    console.log('\n可能原因:')
    console.log('1. 表未创建成功')
    console.log('2. RLS 策略阻止了查询')
    return
  }

  console.log('✅ user_sessions 表存在!')
  console.log(`📊 当前记录数: ${count || 0}`)

  if (data && data.length > 0) {
    console.log('\n📋 表结构:')
    console.log(Object.keys(data[0]))
  }
}

verifyTable()
