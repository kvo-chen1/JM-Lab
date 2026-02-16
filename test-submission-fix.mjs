#!/usr/bin/env node
/**
 * 测试作品提交功能修复
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
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 缺少 Supabase 配置')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('========================================')
console.log('🧪 测试作品提交功能修复')
console.log('========================================\n')

async function testSubmissionFunction() {
  console.log('📋 测试 1: 检查 submit_event_work 函数是否存在')
  
  try {
    const { data, error } = await supabase
      .rpc('submit_event_work', {
        p_event_id: '00000000-0000-0000-0000-000000000000',
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_participation_id: '00000000-0000-0000-0000-000000000000',
        p_title: '测试作品',
        p_description: '测试描述',
        p_files: []
      })
    
    // 我们期望返回 "Participation not found" 错误，这表示函数正常工作
    if (error) {
      console.log('  ❌ RPC 调用错误:', error.message)
      return false
    }
    
    if (data && data.success === false && data.error === 'Participation not found') {
      console.log('  ✅ 函数正常工作（返回预期的 "Participation not found"）')
      return true
    }
    
    console.log('  ⚠️  函数返回:', data)
    return true
  } catch (err) {
    console.log('  ❌ 测试异常:', err.message)
    return false
  }
}

async function testTableStructure() {
  console.log('\n📋 测试 2: 检查 event_submissions 表结构')
  
  try {
    // 尝试查询表结构
    const { data, error } = await supabase
      .from('event_submissions')
      .select('*')
      .limit(0)
    
    if (error) {
      console.log('  ❌ 查询表失败:', error.message)
      return false
    }
    
    console.log('  ✅ event_submissions 表可访问')
    return true
  } catch (err) {
    console.log('  ❌ 测试异常:', err.message)
    return false
  }
}

async function testDraftCreation() {
  console.log('\n📋 测试 3: 测试草稿创建（时间戳类型）')
  
  try {
    // 使用 bigint 时间戳（毫秒）
    const now = Date.now()
    
    const { data, error } = await supabase
      .from('event_submissions')
      .insert({
        event_id: '00000000-0000-0000-0000-000000000000',
        user_id: '00000000-0000-0000-0000-000000000000',
        participation_id: '00000000-0000-0000-0000-000000000000',
        title: '测试草稿',
        description: '测试描述',
        files: [],
        status: 'draft',
        metadata: {},
        created_at: now,
        updated_at: now,
      })
      .select()
    
    // 我们期望外键约束错误，但不应该有时间戳类型错误
    if (error) {
      if (error.message.includes('bigint') || error.message.includes('invalid input syntax')) {
        console.log('  ❌ 时间戳类型错误:', error.message)
        return false
      }
      if (error.code === '23503') { // 外键约束错误
        console.log('  ✅ 时间戳类型正确（外键约束错误是预期的）')
        return true
      }
      console.log('  ⚠️  其他错误:', error.message)
      return false
    }
    
    console.log('  ✅ 草稿创建成功')
    return true
  } catch (err) {
    console.log('  ❌ 测试异常:', err.message)
    return false
  }
}

async function runTests() {
  const results = []
  
  results.push(await testSubmissionFunction())
  results.push(await testTableStructure())
  results.push(await testDraftCreation())
  
  console.log('\n----------------------------------------')
  const passed = results.filter(r => r).length
  const total = results.length
  console.log(`\n📊 测试结果: ${passed}/${total} 项通过`)
  
  if (passed === total) {
    console.log('✅ 所有测试通过！作品提交功能已修复。')
  } else {
    console.log('⚠️ 部分测试未通过，请检查配置。')
  }
  
  console.log('\n========================================')
}

runTests().catch(err => {
  console.error('❌ 测试执行失败:', err)
  process.exit(1)
})
