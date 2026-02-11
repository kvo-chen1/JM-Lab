// 获取完整的缩略图URL
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkFullUrls() {
  console.log('=== 获取完整缩略图URL ===\n')
  
  const { data: works, error } = await supabase
    .from('works')
    .select('id, title, thumbnail')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('查询失败:', error.message)
    return
  }
  
  console.log(`找到 ${works.length} 个作品:\n`)
  
  works.forEach((w, i) => {
    console.log(`[${i + 1}] ${w.title}`)
    console.log(`    完整URL: ${w.thumbnail || 'null'}`)
    console.log(`    URL长度: ${w.thumbnail ? w.thumbnail.length : 0}`)
    console.log(`    是否以http开头: ${w.thumbnail ? w.thumbnail.startsWith('http') : false}`)
    console.log('')
  })
}

checkFullUrls()
