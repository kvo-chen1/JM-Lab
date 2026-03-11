#!/usr/bin/env node
/**
 * 检查 kvo1 用户的用户名
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('==========================================')
console.log('   检查 kvo1 用户的用户名')
console.log('==========================================\n')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误: 环境变量未设置')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function checkUsername() {
  try {
    // kvo1 的 ID
    const kvo1Id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429'
    
    // 获取用户信息
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, display_name, metadata')
      .eq('id', kvo1Id)
      .single()
    
    if (error) {
      console.error('❌ 获取用户失败:', error.message)
      return
    }
    
    console.log('用户 ID:', user.id)
    console.log('用户名 (username):', user.username)
    console.log('邮箱:', user.email)
    console.log('显示名 (display_name):', user.display_name)
    console.log('')
    console.log('Metadata 中的用户名:', user.metadata?.username)
    console.log('')
    
    // 检查是否有其他用户叫 kvo7
    console.log('\n🔍 检查是否有 kvo7 用户...')
    const { data: kvo7User, error: kvo7Error } = await supabase
      .from('users')
      .select('id, username, email')
      .eq('username', 'kvo7')
    
    if (kvo7Error) {
      console.log('查询 kvo7 出错:', kvo7Error.message)
    } else if (kvo7User && kvo7User.length > 0) {
      console.log('找到 kvo7 用户:', kvo7User)
    } else {
      console.log('数据库中没有 kvo7 用户')
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message)
  }
}

checkUsername()
