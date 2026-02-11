// 检查 Supabase Storage buckets
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkBuckets() {
  console.log('=== 检查 Supabase Storage Buckets ===\n')
  
  try {
    // 列出所有 buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('列出 buckets 失败:', bucketsError.message)
      return
    }
    
    console.log(`找到 ${buckets.length} 个 buckets:\n`)
    
    for (const bucket of buckets) {
      console.log(`Bucket: ${bucket.name}`)
      console.log(`  ID: ${bucket.id}`)
      console.log(`  公开: ${bucket.public ? '是' : '否'}`)
      console.log(`  创建时间: ${bucket.created_at}`)
      
      // 列出 bucket 中的文件
      const { data: files, error: filesError } = await supabase.storage
        .from(bucket.name)
        .list()
      
      if (filesError) {
        console.log(`  文件列表: 无法获取 (${filesError.message})`)
      } else {
        console.log(`  文件数量: ${files.length}`)
        if (files.length > 0) {
          files.slice(0, 5).forEach(f => {
            console.log(`    - ${f.name}`)
          })
        }
      }
      console.log('')
    }
    
    // 特别检查 works bucket
    console.log('=== 检查 works bucket 详情 ===\n')
    const worksBucket = buckets.find(b => b.name === 'works')
    if (worksBucket) {
      console.log('works bucket 存在')
      console.log(`公开: ${worksBucket.public ? '是' : '否'}`)
      
      // 检查 videos 目录
      const { data: videos, error: videosError } = await supabase.storage
        .from('works')
        .list('videos')
      
      if (videosError) {
        console.log(`videos 目录: 无法获取 (${videosError.message})`)
      } else {
        console.log(`videos 目录文件数量: ${videos.length}`)
      }
    } else {
      console.log('❌ works bucket 不存在！')
    }
    
  } catch (error) {
    console.error('检查失败:', error)
  }
}

checkBuckets()
