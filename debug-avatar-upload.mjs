// 调试头像上传问题
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugAvatarUpload() {
  console.log('=== 调试头像上传 ===\n')

  // 1. 检查当前登录状态
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  console.log('Session:', session ? '已登录' : '未登录')
  console.log('User ID:', session?.user?.id)
  if (sessionError) console.error('Session 错误:', sessionError)

  // 2. 检查 avatars bucket 是否存在
  console.log('\n检查 buckets...')
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
  
  if (bucketsError) {
    console.error('获取 buckets 失败:', bucketsError)
  } else {
    const avatarsBucket = buckets.find(b => b.name === 'avatars')
    console.log('avatars bucket:', avatarsBucket ? '存在' : '不存在')
    if (avatarsBucket) {
      console.log('  - public:', avatarsBucket.public)
    }
  }

  // 3. 尝试上传测试文件
  console.log('\n尝试上传测试文件到 avatars...')
  const testBlob = new Blob(['test'], { type: 'image/jpeg' })
  const testFile = new File([testBlob], 'test.jpg', { type: 'image/jpeg' })

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(`test-${Date.now()}.jpg`, testFile, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('上传失败:', error.message)
    console.error('错误详情:', error)
  } else {
    console.log('上传成功:', data)
  }
}

debugAvatarUpload().catch(console.error)
