#!/usr/bin/env node
/**
 * 修复商城数据库结构
 * 1. 创建/更新 product_details 视图
 * 2. 创建 order_items 表
 * 3. 创建必要的索引和约束
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

async function executeSQL(sql, description) {
  console.log(`\n🔧 ${description}...`)
  try {
    const { error } = await supabase.rpc('exec_sql', { sql })
    if (error) {
      console.log(`  ⚠️  ${error.message}`)
      return false
    }
    console.log(`  ✅ 成功`)
    return true
  } catch (error) {
    console.log(`  ❌ 错误: ${error.message}`)
    return false
  }
}

async function fixSchema() {
  console.log('========================================')
  console.log('🔧 修复商城数据库结构')
  console.log('========================================')

  // 1. 创建/更新 product_details 视图
  const createProductDetailsView = `
    DROP VIEW IF EXISTS product_details;
    
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
      NULL as seller_id,
      NULL as brand_id,
      p.created_at,
      p.updated_at
    FROM products p
    WHERE p.status = 'active';
  `
  
  await executeSQL(createProductDetailsView, '创建 product_details 视图')

  // 2. 创建 order_items 表
  const createOrderItemsTable = `
    CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id UUID NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      product_image TEXT,
      product_specs JSONB DEFAULT '[]',
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      quantity INTEGER NOT NULL DEFAULT 1,
      subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
  `
  
  await executeSQL(createOrderItemsTable, '创建 order_items 表')

  // 3. 更新 orders 表结构（如果不存在必要字段）
  const updateOrdersTable = `
    DO $$
    BEGIN
      -- 添加 buyer_id 字段（如果不存在）
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'orders' AND column_name = 'buyer_id') THEN
        ALTER TABLE orders ADD COLUMN buyer_id UUID;
      END IF;
      
      -- 添加 seller_id 字段（如果不存在）
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'orders' AND column_name = 'seller_id') THEN
        ALTER TABLE orders ADD COLUMN seller_id UUID;
      END IF;
      
      -- 添加 order_no 字段（如果不存在）
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'orders' AND column_name = 'order_no') THEN
        ALTER TABLE orders ADD COLUMN order_no VARCHAR(50) UNIQUE;
      END IF;
      
      -- 添加 final_amount 字段（如果不存在）
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'orders' AND column_name = 'final_amount') THEN
        ALTER TABLE orders ADD COLUMN final_amount DECIMAL(10,2) DEFAULT 0;
      END IF;
      
      -- 添加 status 字段（如果不存在）
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'orders' AND column_name = 'status') THEN
        ALTER TABLE orders ADD COLUMN status VARCHAR(50) DEFAULT 'pending_payment';
      END IF;
      
      -- 添加 shipping_address 字段（如果不存在）
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'orders' AND column_name = 'shipping_address') THEN
        ALTER TABLE orders ADD COLUMN shipping_address JSONB DEFAULT '{}';
      END IF;
      
      -- 添加 remark 字段（如果不存在）
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'orders' AND column_name = 'remark') THEN
        ALTER TABLE orders ADD COLUMN remark TEXT;
      END IF;
      
      -- 添加 tracking_no 字段（如果不存在）
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'orders' AND column_name = 'tracking_no') THEN
        ALTER TABLE orders ADD COLUMN tracking_no VARCHAR(100);
      END IF;
      
      -- 添加 tracking_company 字段（如果不存在）
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'orders' AND column_name = 'tracking_company') THEN
        ALTER TABLE orders ADD COLUMN tracking_company VARCHAR(100);
      END IF;
      
      -- 添加时间戳字段（如果不存在）
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'orders' AND column_name = 'paid_at') THEN
        ALTER TABLE orders ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE;
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'orders' AND column_name = 'shipped_at') THEN
        ALTER TABLE orders ADD COLUMN shipped_at TIMESTAMP WITH TIME ZONE;
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'orders' AND column_name = 'completed_at') THEN
        ALTER TABLE orders ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'orders' AND column_name = 'cancelled_at') THEN
        ALTER TABLE orders ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
      END IF;
    END $$;
  `
  
  await executeSQL(updateOrdersTable, '更新 orders 表结构')

  // 4. 创建生成订单号的函数
  const createOrderNoFunction = `
    CREATE OR REPLACE FUNCTION generate_order_no()
    RETURNS TEXT AS $$
    DECLARE
      order_no TEXT;
      exists_check BOOLEAN;
    BEGIN
      LOOP
        -- 生成订单号: JM + 年月日 + 6位随机数
        order_no := 'JM' || TO_CHAR(NOW(), 'YYMMDD') || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        
        -- 检查是否已存在
        SELECT EXISTS(SELECT 1 FROM orders WHERE orders.order_no = order_no) INTO exists_check;
        
        EXIT WHEN NOT exists_check;
      END LOOP;
      
      RETURN order_no;
    END;
    $$ LANGUAGE plpgsql;
  `
  
  await executeSQL(createOrderNoFunction, '创建生成订单号函数')

  console.log('\n========================================')
  console.log('✅ 修复完成')
  console.log('========================================')
}

fixSchema().catch(error => {
  console.error('执行出错:', error)
  process.exit(1)
})
