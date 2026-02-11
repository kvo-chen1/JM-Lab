// 检查作品缩略图中的 blob URL
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkWorksBlob() {
  console.log('=== 检查作品缩略图中的 blob URL ===\n')
  
  const { data: works, error } = await supabase
    .from('works')
    .select('id, title, thumbnail, creator_id, created_at')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('查询失败:', error.message)
    return
  }
  
  console.log(`找到 ${works.length} 个作品:\n`)
  
  works.forEach((w, i) => {
    const isBlob = w.thumbnail && w.thumbnail.startsWith('blob:')
    const isAliyun = w.thumbnail && w.thumbnail.includes('aliyuncs.com')
    const isSupabase = w.thumbnail && w.thumbnail.includes('supabase.co/storage')
    const isPicsum = w.thumbnail && w.thumbnail.includes('picsum.photos')
    const isUnsplash = w.thumbnail && w.thumbnail.includes('unsplash.com')
    
    console.log(`[${i + 1}] ${w.title}`)
    console.log(`    类型: ${isBlob ? '❌ BLOB' : isAliyun ? '⚠️ 阿里云' : isSupabase ? '✅ Supabase' : isPicsum ? '✅ Picsum' : isUnsplash ? '✅ Unsplash' : '❓ 其他'}`)
    console.log(`    URL: ${w.thumbnail || 'null'}`)
    console.log(`    创建者: ${w.creator_id}`)
    console.log('')
  })
  
  // 统计
  const blobWorks = works.filter(w => w.thumbnail && w.thumbnail.startsWith('blob:'))
  const aliyunWorks = works.filter(w => w.thumbnail && w.thumbnail.includes('aliyuncs.com'))
  const supabaseWorks = works.filter(w => w.thumbnail && w.thumbnail.includes('supabase.co/storage'))
  
  console.log('=== 统计 ===')
  console.log(`总作品数: ${works.length}`)
  console.log(`Blob URL: ${blobWorks.length}`)
  console.log(`阿里云 URL: ${aliyunWorks.length}`)
  console.log(`Supabase URL: ${supabaseWorks.length}`)
}

checkWorksBlob()
