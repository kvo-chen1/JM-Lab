#!/usr/bin/env node
/**
 * 检查商家相关数据库表
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

async function checkMerchantTables() {
  console.log('========================================')
  console.log('📋 检查商家相关数据库表')
  console.log('========================================\n')

  const tables = [
    { name: 'merchants', label: '商家表' },
    { name: 'merchant_products', label: '商家商品表' },
    { name: 'merchant_orders', label: '商家订单表' },
    { name: 'merchant_todos', label: '商家待办表' },
    { name: 'merchant_notifications', label: '商家通知表' },
    { name: 'after_sales_requests', label: '售后申请表' },
    { name: 'reviews', label: '评价表' }
  ]

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table.name)
        .select('*', { count: 'exact' })
        .limit(1)

      if (error) {
        if (error.code === '42P01') {
          console.log(`  ❌ ${table.label} (${table.name}): 表不存在`)
        } else {
          console.log(`  ⚠️  ${table.label} (${table.name}): ${error.message}`)
        }
      } else {
        const { count: totalCount } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true })
        
        console.log(`  ✅ ${table.label} (${table.name}): 存在, 数据量: ${totalCount || 0}`)
        
        if (data && data.length > 0) {
          console.log(`     列: ${Object.keys(data[0]).join(', ')}`)
        }
      }
    } catch (error) {
      console.log(`  ❌ ${table.label} (${table.name}): ${error.message}`)
    }
  }

  console.log('\n========================================')
  console.log('检查完成')
  console.log('========================================')
}

checkMerchantTables().catch(console.error)
