#!/usr/bin/env node
/**
 * 设置商家工作台初始数据
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

async function setupMerchantData() {
  console.log('========================================')
  console.log('🔧 设置商家工作台初始数据')
  console.log('========================================\n')

  // 1. 创建商家表（如果不存在）
  console.log('1️⃣ 创建/更新商家表...')
  const createMerchantsTable = `
    CREATE TABLE IF NOT EXISTS merchants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id),
      store_name VARCHAR(255) NOT NULL,
      store_logo TEXT,
      store_description TEXT,
      contact_name VARCHAR(100),
      contact_phone VARCHAR(20),
      contact_email VARCHAR(255),
      business_license TEXT,
      id_card_front TEXT,
      id_card_back TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      rejection_reason TEXT,
      rating DECIMAL(2,1) DEFAULT 0,
      total_sales DECIMAL(12,2) DEFAULT 0,
      total_orders INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_merchants_user_id ON merchants(user_id);
    CREATE INDEX IF NOT EXISTS idx_merchants_status ON merchants(status);
  `
  
  const { error: merchantsError } = await supabase.rpc('exec_sql', { sql: createMerchantsTable })
  if (merchantsError) {
    console.log('   ⚠️ 商家表创建失败:', merchantsError.message)
  } else {
    console.log('   ✅ 商家表已就绪')
  }

  // 2. 插入示例商家数据
  console.log('\n2️⃣ 插入示例商家数据...')
  const { data: existingMerchant } = await supabase
    .from('merchants')
    .select('id')
    .eq('store_name', '津门文创旗舰店')
    .single()
  
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
    } else {
      console.log('   ✅ 商家数据已插入，ID:', merchant.id)
    }
  } else {
    console.log('   ℹ️ 商家数据已存在')
  }

  // 3. 创建商家商品关联表
  console.log('\n3️⃣ 创建商家商品关联...')
  // 检查 products 表是否有 merchant_id 字段
  const addMerchantIdToProducts = `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'products' AND column_name = 'merchant_id') THEN
        ALTER TABLE products ADD COLUMN merchant_id UUID REFERENCES merchants(id);
        CREATE INDEX IF NOT EXISTS idx_products_merchant_id ON products(merchant_id);
      END IF;
    END $$;
  `
  
  const { error: alterError } = await supabase.rpc('exec_sql', { sql: addMerchantIdToProducts })
  if (alterError) {
    console.log('   ⚠️ 添加字段失败:', alterError.message)
  } else {
    console.log('   ✅ products 表已添加 merchant_id 字段')
  }

  // 4. 更新现有商品关联到商家
  console.log('\n4️⃣ 更新商品商家关联...')
  const { data: merchant } = await supabase
    .from('merchants')
    .select('id')
    .eq('store_name', '津门文创旗舰店')
    .single()
  
  if (merchant) {
    const { error: updateError } = await supabase
      .from('products')
      .update({ merchant_id: merchant.id })
      .is('merchant_id', null)
    
    if (updateError) {
      console.log('   ⚠️ 更新失败:', updateError.message)
    } else {
      console.log('   ✅ 商品已关联到商家')
    }
  }

  // 5. 创建商家待办表
  console.log('\n5️⃣ 创建商家待办表...')
  const createTodosTable = `
    CREATE TABLE IF NOT EXISTS merchant_todos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      priority VARCHAR(20) DEFAULT 'medium',
      is_completed BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_merchant_todos_merchant_id ON merchant_todos(merchant_id);
  `
  
  const { error: todosError } = await supabase.rpc('exec_sql', { sql: createTodosTable })
  if (todosError) {
    console.log('   ⚠️ 待办表创建失败:', todosError.message)
  } else {
    console.log('   ✅ 待办表已就绪')
  }

  // 6. 插入待办事项
  console.log('\n6️⃣ 插入待办事项...')
  if (merchant) {
    const { count } = await supabase
      .from('merchant_todos')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchant.id)
    
    if (count === 0) {
      const { error: insertTodosError } = await supabase
        .from('merchant_todos')
        .insert([
          { merchant_id: merchant.id, type: 'order', title: '待发货订单', description: '您有 8 个订单待发货', priority: 'high' },
          { merchant_id: merchant.id, type: 'aftersales', title: '售后申请待处理', description: '您有 3 个售后申请需要处理', priority: 'high' },
          { merchant_id: merchant.id, type: 'review', title: '新评价待回复', description: '您有 5 条新评价待回复', priority: 'medium' },
          { merchant_id: merchant.id, type: 'product', title: '库存预警', description: '2 个商品库存不足，请及时补货', priority: 'medium' }
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

  // 7. 创建商家通知表
  console.log('\n7️⃣ 创建商家通知表...')
  const createNotificationsTable = `
    CREATE TABLE IF NOT EXISTS merchant_notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_merchant_notifications_merchant_id ON merchant_notifications(merchant_id);
  `
  
  const { error: notifError } = await supabase.rpc('exec_sql', { sql: createNotificationsTable })
  if (notifError) {
    console.log('   ⚠️ 通知表创建失败:', notifError.message)
  } else {
    console.log('   ✅ 通知表已就绪')
  }

  // 8. 插入通知
  console.log('\n8️⃣ 插入通知...')
  if (merchant) {
    const { count } = await supabase
      .from('merchant_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchant.id)
    
    if (count === 0) {
      const { error: insertNotifError } = await supabase
        .from('merchant_notifications')
        .insert([
          { merchant_id: merchant.id, type: 'order', title: '新订单提醒', content: '您收到一个新订单，订单号：ORD202403080003', is_read: false },
          { merchant_id: merchant.id, type: 'system', title: '平台公告', content: '商家工作台新功能上线，快来体验吧！', is_read: false },
          { merchant_id: merchant.id, type: 'review', title: '新评价提醒', content: '您的商品收到一条新评价', is_read: true }
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

  console.log('\n========================================')
  console.log('✅ 商家数据设置完成')
  console.log('========================================')
}

setupMerchantData().catch(console.error)
