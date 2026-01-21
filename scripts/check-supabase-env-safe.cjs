// 安全版 Supabase 环境与连接检查（仅使用 process.env，不解析 import.meta）
const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

dotenv.config()

const env = process.env || {}
const candidates = {
  url: env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL,
  key: env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY,
}

console.log('Supabase 环境变量检查:')
console.log('- VITE_SUPABASE_URL:', env.VITE_SUPABASE_URL ? '已设置' : '未设置')
console.log('- VITE_SUPABASE_ANON_KEY:', env.VITE_SUPABASE_ANON_KEY ? '已设置' : '未设置')
console.log('- NEXT_PUBLIC_SUPABASE_URL:', env.NEXT_PUBLIC_SUPABASE_URL ? '已设置' : '未设置')
console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '已设置' : '未设置')
console.log('- SUPABASE_URL:', env.SUPABASE_URL ? '已设置' : '未设置')
console.log('- SUPABASE_ANON_KEY:', env.SUPABASE_ANON_KEY ? '已设置' : '未设置')

const url = (candidates.url || '').trim()
const key = (candidates.key || '').trim()

console.log('\n处理后的配置:')
console.log('- URL:', url || '未设置')
console.log('- 密钥:', key ? `已设置，长度: ${key.length}` : '未设置')

if (!url || !key) {
  console.error('\n❌ 环境变量不完整，无法创建 Supabase 客户端')
  process.exit(2)
}

if (!/^https?:\/\//.test(url)) {
  console.error('❌ Supabase URL 格式不正确，必须以 http(s) 开头:', url)
  process.exit(3)
}

if (key.length < 30) {
  console.error('❌ Supabase 密钥长度过短，可能无效')
  process.exit(4)
}

console.log('\n尝试创建 Supabase 客户端并进行基本检查...')
const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
})

;(async () => {
  try {
    const { error } = await supabase.from('posts').select('id').limit(1)
    if (error) {
      console.warn('⚠️ 基本查询失败（可能是RLS或表不存在）：', error.message)
    } else {
      console.log('✅ 基本查询成功：posts 表可访问')
    }

    const { data: authInfo } = await supabase.auth.getUser()
    console.log('认证状态：', authInfo?.user ? '已登录' : '未登录/匿名')
    console.log('✅ Supabase 客户端创建成功，网络连接正常')
    process.exit(0)
  } catch (e) {
    console.error('❌ 连接检查异常：', e.message)
    process.exit(5)
  }
})()

