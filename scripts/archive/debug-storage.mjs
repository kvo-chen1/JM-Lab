// 调试 Storage 问题
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Anon Key exists:', !!supabaseAnonKey)

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testUpload() {
  console.log('\n=== 测试 Storage 上传 ===\n')

  // 1. 检查当前用户
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  console.log('当前用户:', user ? user.id : '未登录')
  if (authError) console.error('Auth 错误:', authError.message)

  // 2. 尝试上传一个测试文件
  console.log('\n尝试上传测试文件...')
  const testBlob = new Blob(['test'], { type: 'text/plain' })
  const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' })

  const { data, error } = await supabase.storage
    .from('works')
    .upload(`works/test-${Date.now()}.txt`, testFile, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('上传失败:', error.message)
    console.error('错误详情:', error)
  } else {
    console.log('上传成功:', data)
  }

  // 3. 检查 bucket 列表
  console.log('\n检查 buckets...')
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()

  if (bucketError) {
    console.error('获取 buckets 失败:', bucketError.message)
  } else {
    console.log('Buckets:', buckets.map(b => ({ name: b.name, public: b.public })))
  }
}

testUpload().catch(console.error)
