#!/usr/bin/env node
/**
 * 测试 Supabase 连接
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('==========================================')
console.log('   Supabase 连接测试')
console.log('==========================================\n')

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseKey ? supabaseKey.substring(0, 30) + '...' : '未设置')

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ 错误: 环境变量未设置')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function testConnection() {
  try {
    console.log('\n🔌 测试连接...')

    // 测试查询 - 使用简单的 select 而不是 count
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    if (error) {
      console.error('\n❌ 连接失败:', error.message)

      if (error.message.includes('does not exist')) {
        console.log('\n💡 提示: users 表不存在，需要创建数据库表结构')
      }

      return
    }

    console.log('\n✅ 连接成功!')
    console.log('📊 查询结果:', data)

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
  }
}

testConnection()
