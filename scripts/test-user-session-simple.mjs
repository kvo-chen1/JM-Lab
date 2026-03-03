#!/usr/bin/env node
/**
 * 测试用户会话记录功能（简化版）
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
  console.log('测试用户会话记录功能（简化版）')
  console.log('========================================\n')

  // 1. 获取一个测试用户
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id')
    .limit(1)

  if (userError || !users || users.length === 0) {
    console.log('❌ 获取测试用户失败:', userError?.message || '无用户')
    return
  }

  const testUserId = users[0].id
  console.log(`🧪 使用测试用户: ${testUserId}`)

  // 2. 插入简化版会话（只包含必需字段）
  console.log('\n📤 插入简化版会话...')
  const { data: insertData, error: insertError } = await supabase
    .from('user_sessions')
    .insert({
      user_id: testUserId,
      session_start: new Date().toISOString(),
      last_active: new Date().toISOString(),
    })
    .select()

  if (insertError) {
    console.log('❌ 插入失败:', insertError.message)
    console.log('错误详情:', insertError)
  } else {
    console.log('✅ 插入成功!')
    console.log('插入的数据:', insertData)

    // 3. 测试更新
    if (insertData && insertData.length > 0) {
      console.log('\n📝 测试更新会话...')
      const { error: updateError } = await supabase
        .from('user_sessions')
        .update({
          last_active: new Date().toISOString(),
        })
        .eq('id', insertData[0].id)

      if (updateError) {
        console.log('❌ 更新失败:', updateError.message)
      } else {
        console.log('✅ 更新成功!')
      }

      // 4. 查询会话
      const { data: sessions, error: queryError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', testUserId)

      if (queryError) {
        console.log('\n❌ 查询失败:', queryError.message)
      } else {
        console.log(`\n📊 该用户的 ${sessions?.length || 0} 条会话记录:`)
        sessions?.forEach((s, i) => {
          console.log(`  ${i + 1}. ID: ${s.id}`)
          console.log(`     开始: ${s.session_start}`)
          console.log(`     最后活跃: ${s.last_active}`)
        })
      }

      // 5. 清理测试数据
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
  }

  console.log('\n========================================')
  console.log('测试完成!')
  console.log('========================================')
}

testUserSession()
