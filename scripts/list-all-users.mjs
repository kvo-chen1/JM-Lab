#!/usr/bin/env node
/**
 * 列出所有用户
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('==========================================')
console.log('   列出所有用户')
console.log('==========================================\n')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误: 环境变量未设置')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function listUsers() {
  try {
    // 获取所有用户
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, display_name')
    
    if (error) {
      console.error('❌ 获取用户失败:', error.message)
      return
    }
    
    console.log(`总用户数: ${users?.length || 0}\n`)
    console.log('用户列表:')
    console.log('-'.repeat(80))
    
    users?.forEach((user, idx) => {
      console.log(`${idx + 1}. ID: ${user.id}`)
      console.log(`   用户名: ${user.username}`)
      console.log(`   邮箱: ${user.email}`)
      console.log(`   显示名: ${user.display_name || 'N/A'}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message)
  }
}

listUsers()
