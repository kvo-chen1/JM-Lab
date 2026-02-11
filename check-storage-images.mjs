// 检查 Supabase Storage 中的图片
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkStorageImages() {
  console.log('=== 检查 Supabase Storage 图片 ===\n')
  
  try {
    // 1. 列出 works bucket 中的文件
    console.log('1. 列出 works bucket 中的文件:')
    const { data: files, error: listError } = await supabase
      .storage
      .from('works')
      .list('', {
        limit: 20,
        sortBy: { column: 'created_at', order: 'desc' }
      })
    
    if (listError) {
      console.error('  列出文件失败:', listError.message)
    } else {
      console.log(`  找到 ${files.length} 个文件:`)
      files.forEach((f, i) => {
        console.log(`    [${i + 1}] ${f.name} (${(f.metadata?.size / 1024).toFixed(2)} KB)`)
      })
    }
    
    // 2. 获取这些文件的公共 URL
    console.log('\n2. 生成公共 URL:')
    if (files && files.length > 0) {
      files.slice(0, 5).forEach(f => {
        const { data: urlData } = supabase
          .storage
          .from('works')
          .getPublicUrl(f.name)
        
        console.log(`    ${f.name}:`)
        console.log(`      ${urlData.publicUrl}`)
      })
    }
    
    // 3. 检查数据库中的 thumbnail 是否匹配 storage
    console.log('\n3. 检查数据库中的 thumbnail:')
    const { data: works, error: worksError } = await supabase
      .from('works')
      .select('id, title, thumbnail')
      .order('created_at', { ascending: false })
    
    if (worksError) {
      console.error('  查询失败:', worksError.message)
    } else {
      works.forEach(w => {
        const isStorageUrl = w.thumbnail && w.thumbnail.includes('supabase.co/storage')
        const isAliyunUrl = w.thumbnail && w.thumbnail.includes('aliyuncs.com')
        console.log(`    ${w.title}:`)
        console.log(`      类型: ${isStorageUrl ? 'Supabase Storage' : isAliyunUrl ? '阿里云 OSS' : '其他'}`)
        console.log(`      URL: ${w.thumbnail ? w.thumbnail.substring(0, 80) + '...' : 'null'}`)
      })
    }
    
  } catch (error) {
    console.error('检查失败:', error)
  }
}

checkStorageImages()
