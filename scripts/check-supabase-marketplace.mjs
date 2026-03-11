#!/usr/bin/env node
/**
 * Supabase 数据库连接检查脚本 - 商城数据验证
 * 检查与 Supabase 的连接以及商城相关数据表
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config({ path: path.join(__dirname, '../.env') })

console.log('========================================')
console.log('Supabase 数据库连接检查 - 商城数据验证')
console.log('========================================\n')

// 获取 Supabase 配置
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

console.log('📋 环境变量检查:')
console.log('  - SUPABASE_URL:', supabaseUrl ? '✅ 已设置' : '❌ 未设置')
console.log('  - SUPABASE_KEY:', supabaseKey ? '✅ 已设置' : '❌ 未设置')
console.log('  - POSTGRES_URL_NON_POOLING:', process.env.POSTGRES_URL_NON_POOLING ? '✅ 已设置' : '❌ 未设置')
console.log('')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误: 缺少 Supabase 连接配置')
  process.exit(1)
}

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkConnection() {
  console.log('🔌 测试数据库连接...\n')
  
  try {
    // 测试基本连接
    const { data: timeData, error: timeError } = await supabase.rpc('get_server_time')
    
    if (timeError) {
      // 尝试另一种方式测试连接
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('count', { count: 'exact', head: true })
      
      if (testError) {
        console.error('❌ 数据库连接失败:', testError.message)
        return false
      }
    }
    
    console.log('✅ 数据库连接成功!\n')
    return true
  } catch (error) {
    console.error('❌ 连接异常:', error.message)
    return false
  }
}

async function checkMarketplaceTables() {
  console.log('📊 检查商城数据表...\n')
  
  const tables = [
    { name: 'products', label: '商品表' },
    { name: 'orders', label: '订单表' },
    { name: 'order_items', label: '订单商品表' },
    { name: 'shopping_carts', label: '购物车表' },
    { name: 'product_reviews', label: '商品评价表' },
    { name: 'product_categories', label: '商品分类表' },
    { name: 'user_favorites', label: '用户收藏表' },
    { name: 'brands', label: '品牌表' }
  ]
  
  const results = []
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table.name)
        .select('*', { count: 'exact' })
        .limit(1)
      
      if (error) {
        if (error.code === '42P01') {
          console.log(`  ❌ ${table.label} (${table.name}): 表不存在`)
          results.push({ ...table, exists: false, count: 0, error: '表不存在' })
        } else {
          console.log(`  ⚠️  ${table.label} (${table.name}): 查询错误 - ${error.message}`)
          results.push({ ...table, exists: false, count: 0, error: error.message })
        }
      } else {
        // 获取实际数据量
        const { count: totalCount, error: countError } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true })
        
        const actualCount = countError ? '未知' : totalCount
        console.log(`  ✅ ${table.label} (${table.name}): 存在, 数据量: ${actualCount}`)
        results.push({ ...table, exists: true, count: actualCount, error: null })
      }
    } catch (error) {
      console.log(`  ❌ ${table.label} (${table.name}): 异常 - ${error.message}`)
      results.push({ ...table, exists: false, count: 0, error: error.message })
    }
  }
  
  console.log('')
  return results
}

async function checkProductsData() {
  console.log('🛍️  检查商品数据...\n')
  
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price, stock, status, seller_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) {
      console.log(`  ❌ 获取商品数据失败: ${error.message}\n`)
      return
    }
    
    if (!products || products.length === 0) {
      console.log('  ⚠️  商品表中没有数据\n')
      return
    }
    
    console.log(`  ✅ 找到 ${products.length} 条商品记录 (显示最新5条):\n`)
    
    products.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name}`)
      console.log(`     - ID: ${product.id}`)
      console.log(`     - 价格: ¥${product.price}`)
      console.log(`     - 库存: ${product.stock}`)
      console.log(`     - 状态: ${product.status}`)
      console.log(`     - 卖家ID: ${product.seller_id}`)
      console.log(`     - 创建时间: ${product.created_at}`)
      console.log('')
    })
  } catch (error) {
    console.log(`  ❌ 检查商品数据异常: ${error.message}\n`)
  }
}

async function checkOrdersData() {
  console.log('📦 检查订单数据...\n')
  
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, order_no, buyer_id, seller_id, final_amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) {
      console.log(`  ❌ 获取订单数据失败: ${error.message}\n`)
      return
    }
    
    if (!orders || orders.length === 0) {
      console.log('  ⚠️  订单表中没有数据\n')
      return
    }
    
    console.log(`  ✅ 找到 ${orders.length} 条订单记录 (显示最新5条):\n`)
    
    orders.forEach((order, index) => {
      console.log(`  ${index + 1}. 订单号: ${order.order_no}`)
      console.log(`     - ID: ${order.id}`)
      console.log(`     - 买家ID: ${order.buyer_id}`)
      console.log(`     - 卖家ID: ${order.seller_id}`)
      console.log(`     - 金额: ¥${order.final_amount}`)
      console.log(`     - 状态: ${order.status}`)
      console.log(`     - 创建时间: ${order.created_at}`)
      console.log('')
    })
  } catch (error) {
    console.log(`  ❌ 检查订单数据异常: ${error.message}\n`)
  }
}

async function checkDataConsistency() {
  console.log('🔍 数据一致性检查...\n')
  
  try {
    // 检查是否有商品但无卖家的情况
    const { data: orphanedProducts, error: orphanError } = await supabase
      .from('products')
      .select('id, name, seller_id')
      .not('seller_id', 'in', supabase.from('users').select('id'))
      .limit(10)
    
    if (orphanError) {
      console.log(`  ⚠️  无法检查孤立商品: ${orphanError.message}`)
    } else if (orphanedProducts && orphanedProducts.length > 0) {
      console.log(`  ⚠️  发现 ${orphanedProducts.length} 条商品记录没有对应的卖家用户`)
    } else {
      console.log('  ✅ 所有商品都有对应的卖家用户')
    }
    
    // 检查订单状态分布
    const { data: statusCounts, error: statusError } = await supabase
      .from('orders')
      .select('status')
    
    if (!statusError && statusCounts) {
      const statusMap = {}
      statusCounts.forEach(order => {
        statusMap[order.status] = (statusMap[order.status] || 0) + 1
      })
      
      console.log('\n  📈 订单状态分布:')
      Object.entries(statusMap).forEach(([status, count]) => {
        console.log(`     - ${status}: ${count} 条`)
      })
    }
    
    console.log('')
  } catch (error) {
    console.log(`  ❌ 一致性检查异常: ${error.message}\n`)
  }
}

async function main() {
  // 1. 检查连接
  const connected = await checkConnection()
  if (!connected) {
    console.error('\n❌ 数据库连接失败，停止后续检查')
    process.exit(1)
  }
  
  // 2. 检查商城表
  const tableResults = await checkMarketplaceTables()
  
  // 3. 检查商品数据
  await checkProductsData()
  
  // 4. 检查订单数据
  await checkOrdersData()
  
  // 5. 数据一致性检查
  await checkDataConsistency()
  
  // 汇总报告
  console.log('========================================')
  console.log('📋 检查报告汇总')
  console.log('========================================\n')
  
  const existingTables = tableResults.filter(r => r.exists)
  const missingTables = tableResults.filter(r => !r.exists)
  
  console.log(`✅ 存在的表: ${existingTables.length}/${tableResults.length}`)
  console.log(`❌ 缺失的表: ${missingTables.length}/${tableResults.length}\n`)
  
  if (missingTables.length > 0) {
    console.log('缺失的表:')
    missingTables.forEach(t => console.log(`  - ${t.label} (${t.name})`))
    console.log('')
  }
  
  // 数据量统计
  console.log('数据量统计:')
  existingTables.forEach(t => {
    console.log(`  - ${t.label}: ${t.count} 条记录`)
  })
  
  console.log('\n========================================')
  console.log('✅ 检查完成')
  console.log('========================================')
}

main().catch(error => {
  console.error('执行出错:', error)
  process.exit(1)
})
