// 测试后端 API 返回的用户数据
import dotenv from 'dotenv'
dotenv.config()

const LOCAL_API_PORT = process.env.LOCAL_API_PORT || 3022
const API_BASE = `http://localhost:${LOCAL_API_PORT}`

async function testUserAPI() {
  console.log('=== 测试后端 API 用户数据 ===\n')
  
  try {
    // 1. 先获取所有用户列表
    console.log('1. 获取用户列表...')
    const listRes = await fetch(`${API_BASE}/api/users`)
    const listData = await listRes.json()
    
    if (listData.code !== 0 || !listData.data || listData.data.length === 0) {
      console.log('  没有用户数据')
      return
    }
    
    console.log(`  找到 ${listData.data.length} 个用户`)
    
    // 2. 获取第一个用户的详细信息
    const firstUser = listData.data[0]
    console.log(`\n2. 获取用户 ${firstUser.username} (${firstUser.id}) 的详细信息...`)
    
    const userRes = await fetch(`${API_BASE}/api/users/${firstUser.id}`)
    const userData = await userRes.json()
    
    if (userData.code !== 0) {
      console.log('  获取用户详情失败:', userData.message)
      return
    }
    
    console.log('  用户详情:')
    console.log('    id:', userData.data.id)
    console.log('    username:', userData.data.username)
    console.log('    email:', userData.data.email)
    console.log('    avatar:', userData.data.avatar ? userData.data.avatar.substring(0, 50) + '...' : 'null/empty')
    console.log('    avatar_url:', userData.data.avatar_url ? userData.data.avatar_url.substring(0, 50) + '...' : 'null/empty')
    console.log('    coverImage:', userData.data.coverImage ? '有' : 'null/empty')
    
    // 3. 检查原始数据中的所有字段
    console.log('\n3. 原始数据中的所有字段:')
    Object.keys(userData.data).forEach(key => {
      const value = userData.data[key]
      const display = value === null ? 'null' : 
                      typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : 
                      value
      console.log(`    ${key}: ${display}`)
    })
    
  } catch (error) {
    console.error('测试失败:', error.message)
    console.log('\n请确保后端服务正在运行: pnpm dev:server')
  }
}

testUserAPI()
