#!/usr/bin/env node
/**
 * 修复 product_details - 将表改为视图
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config({ path: path.join(__dirname, '../.env') })

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function fixProductDetails() {
  console.log('========================================')
  console.log('🔧 修复 product_details')
  console.log('========================================\n')

  // 检查 product_details 是表还是视图
  console.log('🔍 检查 product_details 类型...')
  const { data: tableInfo, error: tableError } = await supabase
    .from('information_schema.tables')
    .select('table_type')
    .eq('table_name', 'product_details')
    .single()

  if (tableError) {
    console.log('  ⚠️ 无法获取表信息:', tableError.message)
  } else {
    console.log(`  当前类型: ${tableInfo.table_type}`)
  }

  // 删除现有的 product_details（无论是表还是视图）
  console.log('\n🔧 删除现有的 product_details...')
  const dropSQL = `
    DROP TABLE IF EXISTS product_details CASCADE;
    DROP VIEW IF EXISTS product_details CASCADE;
  `
  
  const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropSQL })
  if (dropError) {
    console.log('  ⚠️ 删除失败:', dropError.message)
  } else {
    console.log('  ✅ 已删除')
  }

  // 创建新的视图
  console.log('\n🔧 创建 product_details 视图...')
  const createViewSQL = `
    CREATE VIEW product_details AS
    SELECT 
      p.id,
      p.name,
      p.description,
      COALESCE(p.points, 0) as price,
      COALESCE(p.points, 0) as original_price,
      COALESCE(p.stock, 0) as stock,
      0 as sold_count,
      0 as view_count,
      p.status,
      p.category as category_id,
      p.tags,
      p.image_url as cover_image,
      p.is_featured,
      p.is_featured as is_hot,
      p.is_featured as is_new,
      NULL::uuid as seller_id,
      NULL::uuid as brand_id,
      p.created_at,
      p.updated_at
    FROM products p
    WHERE p.status = 'active';
  `
  
  const { error: createError } = await supabase.rpc('exec_sql', { sql: createViewSQL })
  if (createError) {
    console.log('  ❌ 创建视图失败:', createError.message)
    return
  }
  
  console.log('  ✅ 视图创建成功')

  // 验证视图
  console.log('\n🔍 验证视图...')
  const { data: viewData, error: viewError } = await supabase
    .from('product_details')
    .select('*')
    .limit(3)

  if (viewError) {
    console.log('  ❌ 查询失败:', viewError.message)
  } else {
    console.log(`  ✅ 查询成功，找到 ${viewData.length} 条记录`)
    if (viewData.length > 0) {
      console.log('\n  样本数据:')
      viewData.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name} - ¥${p.price} - 库存: ${p.stock}`)
      })
    }
  }

  console.log('\n========================================')
  console.log('✅ 修复完成')
  console.log('========================================')
}

fixProductDetails().catch(console.error)
