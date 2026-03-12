#!/usr/bin/env node
/**
 * 调试品牌 API
 */

import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

console.log('==========================================')
console.log('   调试品牌 API')
console.log('==========================================\n')

const baseUrl = 'http://localhost:3030'

// 创建一个测试用的 JWT token
function createTestToken() {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ 
    sub: 'f3dedf79-5c5e-40fd-9513-d0fb0995d429',
    id: 'f3dedf79-5c5e-40fd-9513-d0fb0995d429',
    username: 'kvo1',
    email: 'kvo1@example.com'
  })).toString('base64url')
  return `${header}.${payload}.`
}

async function testAPI() {
  const token = createTestToken()
  
  // 测试不同的路径
  const paths = [
    '/api/brand/brands',
    '/api/brand/brands?limit=50',
    '/api/brand/authorizations',
    '/api/brand/authorizations/stats'
  ]
  
  for (const path of paths) {
    console.log(`\n🔍 测试 GET ${path}`)
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      console.log('  Status:', response.status)
      
      const data = await response.json().catch(() => ({}))
      console.log('  Response:', JSON.stringify(data).substring(0, 200))
    } catch (error) {
      console.error('  Error:', error.message)
    }
  }
}

testAPI()
