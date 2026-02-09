import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

// 加载环境变量
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' })
}
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// 创建服务端 Supabase 客户端
// 使用 Service Role Key，可以绕过 RLS，拥有完全数据库访问权限
let supabaseServer = null

try {
  if (supabaseUrl && supabaseServiceKey) {
    supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    })
    console.log('[Supabase Server] 客户端创建成功')
  } else {
    console.warn('[Supabase Server] 缺少环境变量，将使用模拟模式')
    // 创建一个模拟的客户端对象，避免服务崩溃
    supabaseServer = {
      auth: {
        admin: {
          listUsers: async () => ({ data: { users: [] }, error: null }),
          createUser: async () => ({ data: { user: null }, error: null })
        }
      },
      from: () => ({
        select: async () => ({ data: [], error: null })
      })
    }
  }
} catch (error) {
  console.error('[Supabase Server] 创建客户端失败:', error.message)
  // 创建模拟对象作为fallback
  supabaseServer = {
    auth: {
      admin: {
        listUsers: async () => ({ data: { users: [] }, error: null }),
        createUser: async () => ({ data: { user: null }, error: null })
      }
    },
    from: () => ({
      select: async () => ({ data: [], error: null })
    })
  }
}

// 测试连接
export async function testConnection() {
  try {
    if (!supabaseServer || !supabaseServer.from) {
      console.warn('[Supabase Server] 客户端未初始化')
      return false
    }
    const { data, error } = await supabaseServer.from('users').select('count').limit(1)
    if (error) throw error
    console.log('[Supabase Server] 连接测试成功')
    return true
  } catch (error) {
    console.warn('[Supabase Server] 连接测试失败:', error.message)
    return false
  }
}

export { supabaseServer }
export default supabaseServer
