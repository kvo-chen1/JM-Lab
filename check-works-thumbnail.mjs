// 检查作品的缩略图数据
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('错误: 缺少 Supabase 配置')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkWorksThumbnail() {
  console.log('=== 检查作品缩略图数据 ===\n')
  
  try {
    // 1. 查询 works 表
    console.log('1. 查询 works 表:')
    const { data: works, error: worksError } = await supabase
      .from('works')
      .select('id, title, thumbnail, cover_url, creator_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (worksError) {
      console.error('  查询失败:', worksError.message)
    } else {
      console.log(`  找到 ${works.length} 个作品:\n`)
      works.forEach((w, i) => {
        console.log(`  [${i + 1}] ${w.title}`)
        console.log(`      id: ${w.id}`)
        console.log(`      thumbnail: ${w.thumbnail ? w.thumbnail.substring(0, 80) + '...' : 'null/empty'}`)
        console.log(`      cover_url: ${w.cover_url ? w.cover_url.substring(0, 80) + '...' : 'null/empty'}`)
        console.log(`      creator_id: ${w.creator_id}`)
        console.log('')
      })
    }
    
    // 2. 检查是否有 blob URL
    console.log('\n2. 检查 blob URL 情况:')
    const { data: allWorks, error: allError } = await supabase
      .from('works')
      .select('id, title, thumbnail')
    
    if (allError) {
      console.error('  查询失败:', allError.message)
    } else {
      const blobWorks = allWorks.filter(w => w.thumbnail && w.thumbnail.startsWith('blob:'))
      const emptyWorks = allWorks.filter(w => !w.thumbnail || w.thumbnail === '')
      const validWorks = allWorks.filter(w => w.thumbnail && !w.thumbnail.startsWith('blob:') && w.thumbnail.startsWith('http'))
      
      console.log(`  总作品数: ${allWorks.length}`)
      console.log(`  blob URL 作品: ${blobWorks.length}`)
      console.log(`  空缩略图作品: ${emptyWorks.length}`)
      console.log(`  有效缩略图作品: ${validWorks.length}`)
      
      if (blobWorks.length > 0) {
        console.log('\n  blob URL 作品列表:')
        blobWorks.forEach(w => {
          console.log(`    - ${w.title}: ${w.thumbnail.substring(0, 60)}...`)
        })
      }
    }
    
    // 3. 检查表结构
    console.log('\n3. 检查 works 表结构:')
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'works')
      .eq('table_schema', 'public')
      .order('ordinal_position')
    
    if (columnsError) {
      console.error('  获取表结构失败:', columnsError.message)
    } else {
      console.log('  works 表字段:')
      columns.forEach(col => {
        console.log(`    - ${col.column_name}: ${col.data_type}`)
      })
    }
    
  } catch (error) {
    console.error('检查失败:', error)
  }
}

checkWorksThumbnail()
