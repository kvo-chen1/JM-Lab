#!/usr/bin/env node
/**
 * 检查商城相关表的实际结构
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

async function getTableColumns(tableName) {
  try {
    const { data, error } = await supabase
      .rpc('get_table_columns', { table_name: tableName })
    
    if (error) {
      // 尝试直接查询
      const { data: sampleData, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (sampleError) {
        return { error: sampleError.message }
      }
      
      if (sampleData && sampleData.length > 0) {
        return { columns: Object.keys(sampleData[0]) }
      }
      
      return { columns: [] }
    }
    
    return { columns: data.map(d => d.column_name) }
  } catch (error) {
    return { error: error.message }
  }
}

async function checkTableStructure() {
  console.log('========================================')
  console.log('📋 商城表结构检查')
  console.log('========================================\n')
  
  const tables = ['products', 'orders', 'shopping_carts', 'product_reviews', 'product_categories', 'brands']
  
  for (const table of tables) {
    console.log(`\n📊 ${table} 表结构:`)
    
    const result = await getTableColumns(table)
    
    if (result.error) {
      console.log(`  ❌ 错误: ${result.error}`)
    } else if (result.columns && result.columns.length > 0) {
      result.columns.forEach(col => {
        console.log(`  - ${col}`)
      })
    } else {
      console.log('  ⚠️  表为空，无法获取结构')
    }
    
    // 获取样本数据
    const { data: sample, error } = await supabase
      .from(table)
      .select('*')
      .limit(1)
    
    if (!error && sample && sample.length > 0) {
      console.log(`\n  样本数据:`)
      console.log(JSON.stringify(sample[0], null, 2).split('\n').map(l => '  ' + l).join('\n'))
    }
    
    console.log('')
  }
}

checkTableStructure().catch(console.error)
