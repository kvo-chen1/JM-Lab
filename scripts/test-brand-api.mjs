#!/usr/bin/env node
/**
 * 测试品牌 API
 */

import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

console.log('==========================================')
console.log('   测试品牌 API')
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
  
  try {
    // 测试 /api/brand/brands
    console.log('🔍 测试 GET /api/brand/brands')
    const response = await fetch(`${baseUrl}/api/brand/brands?limit=50`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    console.log('  Status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('  Response:', JSON.stringify(data, null, 2).substring(0, 500))
    } else {
      const errorText = await response.text()
      console.log('  Error:', errorText.substring(0, 500))
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
  }
}

testAPI()
