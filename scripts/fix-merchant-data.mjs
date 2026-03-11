#!/usr/bin/env node
/**
 * 修复商家数据 - 修改表结构并插入数据
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

async function fixMerchantData() {
  console.log('========================================')
  console.log('🔧 修复商家数据')
  console.log('========================================\n')

  // 1. 修改 merchants 表，让 user_id 可以为空
  console.log('1️⃣ 修改商家表结构...')
  const alterTable = `
    ALTER TABLE merchants ALTER COLUMN user_id DROP NOT NULL;
  `
  
  const { error: alterError } = await supabase.rpc('exec_sql', { sql: alterTable })
  if (alterError) {
    console.log('   ⚠️ 修改失败:', alterError.message)
  } else {
    console.log('   ✅ user_id 字段现在可以为空')
  }

  // 2. 插入商家数据
  console.log('\n2️⃣ 插入商家数据...')
  const { data: existingMerchant } = await supabase
    .from('merchants')
    .select('id')
    .eq('store_name', '津门文创旗舰店')
    .single()
  
  let merchantId = existingMerchant?.id
  
  if (!existingMerchant) {
    const { data: merchant, error: insertError } = await supabase
      .from('merchants')
      .insert({
        store_name: '津门文创旗舰店',
        store_logo: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=200',
        store_description: '专注天津特色文创产品，传承津门文化',
        contact_name: '张经理',
        contact_phone: '13800138000',
        contact_email: 'merchant@example.com',
        status: 'approved',
        rating: 4.8,
        total_sales: 125680,
        total_orders: 3420
      })
      .select()
      .single()
    
    if (insertError) {
      console.log('   ❌ 插入失败:', insertError.message)
      return
    } else {
      merchantId = merchant.id
      console.log('   ✅ 商家数据已插入，ID:', merchantId)
    }
  } else {
    console.log('   ℹ️ 商家数据已存在，ID:', merchantId)
  }

  // 3. 关联商品到商家
  console.log('\n3️⃣ 关联商品到商家...')
  if (merchantId) {
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .is('merchant_id', null)
    
    if (productsError) {
      console.log('   ⚠️ 查询商品失败:', productsError.message)
    } else if (products && products.length > 0) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ merchant_id: merchantId })
        .is('merchant_id', null)
      
      if (updateError) {
        console.log('   ⚠️ 更新失败:', updateError.message)
      } else {
        console.log(`   ✅ ${products.length} 个商品已关联到商家`)
      }
    } else {
      console.log('   ℹ️ 所有商品已关联')
    }
  }

  // 4. 插入待办事项
  console.log('\n4️⃣ 插入待办事项...')
  if (merchantId) {
    const { count } = await supabase
      .from('merchant_todos')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId)
    
    if (count === 0) {
      const { error: insertTodosError } = await supabase
        .from('merchant_todos')
        .insert([
          { merchant_id: merchantId, type: 'order', title: '待发货订单', description: '您有 8 个订单待发货', priority: 'high' },
          { merchant_id: merchantId, type: 'aftersales', title: '售后申请待处理', description: '您有 3 个售后申请需要处理', priority: 'high' },
          { merchant_id: merchantId, type: 'review', title: '新评价待回复', description: '您有 5 条新评价待回复', priority: 'medium' },
          { merchant_id: merchantId, type: 'product', title: '库存预警', description: '2 个商品库存不足，请及时补货', priority: 'medium' }
        ])
      
      if (insertTodosError) {
        console.log('   ⚠️ 插入待办失败:', insertTodosError.message)
      } else {
        console.log('   ✅ 待办事项已插入')
      }
    } else {
      console.log('   ℹ️ 待办事项已存在')
    }
  }

  // 5. 插入通知
  console.log('\n5️⃣ 插入通知...')
  if (merchantId) {
    const { count } = await supabase
      .from('merchant_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId)
    
    if (count === 0) {
      const { error: insertNotifError } = await supabase
        .from('merchant_notifications')
        .insert([
          { merchant_id: merchantId, type: 'order', title: '新订单提醒', content: '您收到一个新订单，订单号：ORD202403080003', is_read: false },
          { merchant_id: merchantId, type: 'system', title: '平台公告', content: '商家工作台新功能上线，快来体验吧！', is_read: false },
          { merchant_id: merchantId, type: 'review', title: '新评价提醒', content: '您的商品收到一条新评价', is_read: true }
        ])
      
      if (insertNotifError) {
        console.log('   ⚠️ 插入通知失败:', insertNotifError.message)
      } else {
        console.log('   ✅ 通知已插入')
      }
    } else {
      console.log('   ℹ️ 通知已存在')
    }
  }

  // 6. 验证数据
  console.log('\n6️⃣ 验证数据...')
  const { data: merchantData, error: verifyError } = await supabase
    .from('merchants')
    .select('*, products:products(count), todos:merchant_todos(count), notifications:merchant_notifications(count)')
    .eq('id', merchantId)
    .single()
  
  if (verifyError) {
    console.log('   ❌ 验证失败:', verifyError.message)
  } else {
    console.log('   ✅ 商家数据验证成功:')
    console.log(`      - 商家名称: ${merchantData.store_name}`)
    console.log(`      - 商品数量: ${merchantData.products?.[0]?.count || 0}`)
    console.log(`      - 待办事项: ${merchantData.todos?.[0]?.count || 0}`)
    console.log(`      - 通知数量: ${merchantData.notifications?.[0]?.count || 0}`)
  }

  console.log('\n========================================')
  console.log('✅ 修复完成')
  console.log('========================================')
}

fixMerchantData().catch(console.error)
