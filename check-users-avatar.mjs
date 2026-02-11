// 检查 users 表中的 avatar_url
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUsersAvatar() {
  console.log('=== 检查 users 表中的 avatar_url ===\n')
  
  const { data: users, error } = await supabase
    .from('users')
    .select('id, username, email, avatar_url')
  
  if (error) {
    console.error('查询失败:', error.message)
    return
  }
  
  console.log(`找到 ${users.length} 个用户:\n`)
  
  users.forEach((u, i) => {
    const isBlob = u.avatar_url && u.avatar_url.startsWith('blob:')
    const isSupabase = u.avatar_url && u.avatar_url.includes('supabase.co/storage')
    const isHttp = u.avatar_url && u.avatar_url.startsWith('http') && !isSupabase
    const isEmpty = !u.avatar_url || u.avatar_url === ''
    
    console.log(`[${i + 1}] ${u.username} (${u.email})`)
    console.log(`    类型: ${isBlob ? '❌ BLOB' : isSupabase ? '✅ Supabase' : isHttp ? '⚠️ HTTP' : isEmpty ? '❓ 空' : '❓ 其他'}`)
    console.log(`    URL: ${u.avatar_url || 'null'}`)
    console.log('')
  })
  
  // 统计
  const blobUsers = users.filter(u => u.avatar_url && u.avatar_url.startsWith('blob:'))
  const supabaseUsers = users.filter(u => u.avatar_url && u.avatar_url.includes('supabase.co/storage'))
  const httpUsers = users.filter(u => u.avatar_url && u.avatar_url.startsWith('http') && !u.avatar_url.includes('supabase.co/storage'))
  const emptyUsers = users.filter(u => !u.avatar_url || u.avatar_url === '')
  
  console.log('=== 统计 ===')
  console.log(`总用户数: ${users.length}`)
  console.log(`Blob URL: ${blobUsers.length}`)
  console.log(`Supabase URL: ${supabaseUsers.length}`)
  console.log(`其他 HTTP URL: ${httpUsers.length}`)
  console.log(`空头像: ${emptyUsers.length}`)
}

checkUsersAvatar()
