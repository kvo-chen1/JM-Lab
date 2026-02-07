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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[Supabase Server] 缺少必要的环境变量:')
  console.error('- SUPABASE_URL:', !!supabaseUrl)
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  throw new Error('Supabase 服务端配置不完整')
}

// 创建服务端 Supabase 客户端
// 使用 Service Role Key，可以绕过 RLS，拥有完全数据库访问权限
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
})

// 测试连接
export async function testConnection() {
  try {
    const { data, error } = await supabaseServer.from('users').select('count').limit(1)
    if (error) throw error
    console.log('[Supabase Server] 连接测试成功')
    return true
  } catch (error) {
    console.error('[Supabase Server] 连接测试失败:', error.message)
    return false
  }
}

export default supabaseServer
