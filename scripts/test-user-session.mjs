#!/usr/bin/env node
/**
 * 测试用户会话记录功能
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

async function testUserSession() {
  console.log('========================================')
  console.log('测试用户会话记录功能')
  console.log('========================================\n')

  // 1. 检查表是否存在
  const { count, error: countError } = await supabase
    .from('user_sessions')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.log('❌ 表查询失败:', countError.message)
    return
  }

  console.log(`✅ user_sessions 表存在，当前记录数: ${count || 0}`)

  // 2. 获取一个测试用户
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id')
    .limit(1)

  if (userError || !users || users.length === 0) {
    console.log('❌ 获取测试用户失败:', userError?.message || '无用户')
    return
  }

  const testUserId = users[0].id
  console.log(`\n🧪 使用测试用户: ${testUserId}`)

  // 3. 插入测试会话
  console.log('\n📤 插入测试会话...')
  const { data: insertData, error: insertError } = await supabase
    .from('user_sessions')
    .insert({
      user_id: testUserId,
      session_start: new Date().toISOString(),
      last_active: new Date().toISOString(),
      page_views: 1,
      actions_count: 0,
    })
    .select()

  if (insertError) {
    console.log('❌ 插入失败:', insertError.message)
    console.log('错误详情:', insertError)
  } else {
    console.log('✅ 插入成功!')
    console.log('插入的数据:', insertData)
  }

  // 4. 查询刚插入的会话
  const { data: sessions, error: queryError } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', testUserId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (queryError) {
    console.log('\n❌ 查询失败:', queryError.message)
  } else {
    console.log(`\n📊 该用户的最近 ${sessions?.length || 0} 条会话记录:`)
    sessions?.forEach((s, i) => {
      console.log(`  ${i + 1}. ID: ${s.id}, 开始: ${s.session_start}, 最后活跃: ${s.last_active}`)
    })
  }

  // 5. 清理测试数据
  if (insertData && insertData.length > 0) {
    console.log('\n🧹 清理测试数据...')
    const { error: deleteError } = await supabase
      .from('user_sessions')
      .delete()
      .eq('id', insertData[0].id)

    if (deleteError) {
      console.log('❌ 清理失败:', deleteError.message)
    } else {
      console.log('✅ 清理成功')
    }
  }

  console.log('\n========================================')
  console.log('测试完成!')
  console.log('========================================')
}

testUserSession()
