#!/usr/bin/env node
/**
 * 检查数据库视图
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

async function checkViews() {
  console.log('========================================')
  console.log('📋 检查数据库视图')
  console.log('========================================\n')
  
  // 检查 product_details 视图
  console.log('🔍 检查 product_details 视图...')
  try {
    const { data, error } = await supabase
      .from('product_details')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log(`  ❌ product_details 视图不存在或无法访问: ${error.message}`)
    } else {
      console.log('  ✅ product_details 视图存在')
      if (data && data.length > 0) {
        console.log('  列:', Object.keys(data[0]).join(', '))
      }
    }
  } catch (error) {
    console.log(`  ❌ 错误: ${error.message}`)
  }
  
  // 检查 products 表
  console.log('\n🔍 检查 products 表...')
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log(`  ❌ products 表不存在: ${error.message}`)
    } else {
      console.log('  ✅ products 表存在')
      if (data && data.length > 0) {
        console.log('  列:', Object.keys(data[0]).join(', '))
      }
    }
  } catch (error) {
    console.log(`  ❌ 错误: ${error.message}`)
  }
  
  // 获取所有表
  console.log('\n📊 获取所有表列表...')
  try {
    const { data, error } = await supabase
      .rpc('get_all_tables')
    
    if (error) {
      console.log(`  ⚠️ 无法获取表列表: ${error.message}`)
    } else {
      console.log('  找到以下表/视图:')
      data.forEach(t => console.log(`    - ${t.table_name}`))
    }
  } catch (error) {
    console.log(`  ⚠️ 错误: ${error.message}`)
  }
}

checkViews().catch(console.error)
