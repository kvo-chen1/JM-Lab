#!/usr/bin/env node
/**
 * Supabase 连接测试脚本
 * 用于验证前端和后端的 Supabase 连接配置是否正确
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 加载环境变量
const envPath = path.resolve(__dirname, '../.env')
const envLocalPath = path.resolve(__dirname, '../.env.local')

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath })
  console.log('✅ 已加载 .env.local 文件')
}
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
  console.log('✅ 已加载 .env 文件')
}

console.log('\n========== Supabase 连接测试 ==========\n')

// 测试配置
const configs = [
  {
    name: '前端客户端 (Anon Key)',
    url: process.env.VITE_SUPABASE_URL,
    key: process.env.VITE_SUPABASE_ANON_KEY,
    expectedRole: 'anon'
  },
  {
    name: '服务端客户端 (Anon Key)',
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY,
    expectedRole: 'anon'
  },
  {
    name: '服务端客户端 (Service Role Key)',
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    expectedRole: 'service_role'
  }
]

// 解析 JWT 获取角色信息
function parseJWT(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}

// 测试连接
async function testConnection(config) {
  console.log(`\n📌 测试: ${config.name}`)
  console.log('----------------------------------------')

  // 检查配置是否存在
  if (!config.url || !config.key) {
    console.log('❌ 配置缺失:')
    console.log(`   URL: ${config.url ? '已设置' : '未设置'}`)
    console.log(`   Key: ${config.key ? '已设置' : '未设置'}`)
    return false
  }

  console.log(`✅ URL: ${config.url}`)
  console.log(`✅ Key: ${config.key.substring(0, 20)}...${config.key.substring(config.key.length - 10)}`)

  // 解析 JWT 检查角色
  const jwtPayload = parseJWT(config.key)
  if (jwtPayload) {
    const actualRole = jwtPayload.role
    console.log(`📋 JWT 角色: ${actualRole}`)
    if (actualRole !== config.expectedRole) {
      console.log(`⚠️  警告: 期望角色是 '${config.expectedRole}'，但实际是 '${actualRole}'`)
    } else {
      console.log(`✅ 角色匹配: ${actualRole}`)
    }
  }

  // 创建客户端并测试连接
  try {
    const client = createClient(config.url, config.key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 测试查询
    const startTime = Date.now()
    const { data, error, count } = await client
      .from('users')
      .select('*', { count: 'exact', head: true })
      .limit(1)
    const duration = Date.now() - startTime

    if (error) {
      console.log(`❌ 查询失败: ${error.message}`)
      console.log(`   错误代码: ${error.code}`)
      return false
    }

    console.log(`✅ 连接成功! (${duration}ms)`)
    console.log(`📊 用户表记录数: ${count !== null ? count : '无法获取'}`)
    return true

  } catch (error) {
    console.log(`❌ 连接异常: ${error.message}`)
    return false
  }
}

// 运行所有测试
async function runTests() {
  const results = []

  for (const config of configs) {
    const success = await testConnection(config)
    results.push({ name: config.name, success })
  }

  // 汇总结果
  console.log('\n========== 测试结果汇总 ==========\n')
  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  results.forEach(r => {
    const icon = r.success ? '✅' : '❌'
    console.log(`${icon} ${r.name}`)
  })

  console.log(`\n总计: ${passed} 通过, ${failed} 失败`)

  if (failed > 0) {
    console.log('\n⚠️  部分测试失败，请检查配置')
    process.exit(1)
  } else {
    console.log('\n🎉 所有测试通过！Supabase 连接正常')
    process.exit(0)
  }
}

runTests().catch(error => {
  console.error('测试执行失败:', error)
  process.exit(1)
})
