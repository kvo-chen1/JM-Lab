#!/usr/bin/env node
/**
 * Supabase 连接测试脚本
 * 用于检查与 Supabase 数据库的连接状态
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

// 加载环境变量
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' })
}
dotenv.config()

console.log('========================================')
console.log('Supabase 连接测试')
console.log('========================================\n')

// 检查环境变量
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('📋 环境变量检查:')
console.log('  - VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ 已设置' : '❌ 未设置')
console.log('  - SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ 已设置' : '❌ 未设置')
console.log('  - VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ 已设置' : '❌ 未设置')
console.log('  - SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ 已设置' : '❌ 未设置')
console.log('  - VITE_SUPABASE_SERVICE_ROLE_KEY:', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? '✅ 已设置' : '❌ 未设置')
console.log('  - SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ 已设置' : '❌ 未设置')
console.log('')

// 验证 URL 格式
console.log('🔗 URL 验证:')
if (!supabaseUrl) {
  console.log('  ❌ Supabase URL 未配置')
  process.exit(1)
}

try {
  new URL(supabaseUrl)
  console.log('  ✅ URL 格式有效:', supabaseUrl)
} catch (e) {
  console.log('  ❌ URL 格式无效:', supabaseUrl)
  process.exit(1)
}

// 测试连接
async function testConnection() {
  console.log('\n🧪 连接测试:')

  // 1. 使用 Anon Key 测试
  if (supabaseAnonKey) {
    console.log('\n  1. 使用 Anon Key 连接...')
    try {
      const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })

      const { data, error, count } = await supabaseAnon
        .from('users')
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log('     ❌ 连接失败:', error.message)
      } else {
        console.log('     ✅ 连接成功! 用户表记录数:', count ?? '未知')
      }
    } catch (err) {
      console.log('     ❌ 连接异常:', err.message)
    }
  }

  // 2. 使用 Service Role Key 测试
  if (supabaseServiceKey) {
    console.log('\n  2. 使用 Service Role Key 连接...')
    try {
      const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })

      const { data, error, count } = await supabaseService
        .from('users')
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log('     ❌ 连接失败:', error.message)
      } else {
        console.log('     ✅ 连接成功! 用户表记录数:', count ?? '未知')
      }

      // 测试其他表
      console.log('\n  3. 测试其他表访问...')
      const tables = ['posts', 'comments', 'likes', 'follows', 'messages']
      for (const table of tables) {
        try {
          const { error: tableError } = await supabaseService
            .from(table)
            .select('count', { count: 'exact', head: true })

          if (tableError) {
            console.log(`     - ${table}: ❌ ${tableError.message}`)
          } else {
            console.log(`     - ${table}: ✅ 可访问`)
          }
        } catch (err) {
          console.log(`     - ${table}: ❌ ${err.message}`)
        }
      }

      // 测试 Storage
      console.log('\n  4. 测试 Storage 访问...')
      try {
        const { data: buckets, error: storageError } = await supabaseService.storage.listBuckets()
        if (storageError) {
          console.log('     ❌ Storage 访问失败:', storageError.message)
        } else {
          console.log('     ✅ Storage 访问成功')
          console.log('     📦 存储桶列表:')
          buckets.forEach(bucket => {
            console.log(`       - ${bucket.name} (${bucket.public ? '公开' : '私有'})`)
          })
        }
      } catch (err) {
        console.log('     ❌ Storage 访问异常:', err.message)
      }

      // 测试 Auth
      console.log('\n  5. 测试 Auth 服务...')
      try {
        const { data: authData, error: authError } = await supabaseService.auth.admin.listUsers()
        if (authError) {
          console.log('     ❌ Auth 服务访问失败:', authError.message)
        } else {
          console.log('     ✅ Auth 服务访问成功')
          console.log('     👥 用户总数:', authData.users.length)
        }
      } catch (err) {
        console.log('     ❌ Auth 服务访问异常:', err.message)
      }

    } catch (err) {
      console.log('     ❌ 连接异常:', err.message)
    }
  }

  console.log('\n========================================')
  console.log('测试完成')
  console.log('========================================')
}

testConnection().catch(console.error)
