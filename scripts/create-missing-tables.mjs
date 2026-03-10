#!/usr/bin/env node
/**
 * 创建缺失的 brands, products, user_favorites 表
 */

import pg from 'pg'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// 加载环境变量
dotenv.config({ path: path.join(projectRoot, '.env') })
dotenv.config({ path: path.join(projectRoot, '.env.local'), override: true })

const { Pool } = pg

// 获取连接字符串
const getConnectionString = () => {
  if (process.env.POSTGRES_URL_NON_POOLING) {
    console.log('[DB] Using POSTGRES_URL_NON_POOLING')
    return process.env.POSTGRES_URL_NON_POOLING
  }
  if (process.env.DATABASE_URL) {
    console.log('[DB] Using DATABASE_URL')
    return process.env.DATABASE_URL
  }
  if (process.env.POSTGRES_URL) {
    console.log('[DB] Using POSTGRES_URL')
    return process.env.POSTGRES_URL
  }
  throw new Error('No database connection string found')
}

async function createTables() {
  const connectionString = getConnectionString()

  // 移除 sslmode 参数
  let cleanConnectionString = connectionString
  try {
    const urlObj = new URL(connectionString)
    if (urlObj.searchParams.has('sslmode')) {
      urlObj.searchParams.delete('sslmode')
      cleanConnectionString = urlObj.toString()
    }
  } catch (e) {
    // 忽略
  }

  const pool = new Pool({
    connectionString: cleanConnectionString,
    ssl: {
      rejectUnauthorized: false,
      requestCert: true,
      agent: false
    }
  })

  try {
    console.log('🔗 连接到数据库...')
    const client = await pool.connect()
    console.log('✅ 数据库连接成功')

    // 创建 brands 表
    console.log('\n📦 创建 brands 表...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        logo TEXT,
        description TEXT,
        category VARCHAR(100),
        established_year INTEGER,
        location VARCHAR(255),
        contact_person VARCHAR(100),
        contact_phone VARCHAR(50),
        contact_email VARCHAR(255),
        website VARCHAR(255),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        verification_docs JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)
    console.log('✅ brands 表创建成功')

    // 创建 brands 索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_brands_user_id ON brands(user_id);')
    await client.query('CREATE INDEX IF NOT EXISTS idx_brands_status ON brands(status);')
    await client.query('CREATE INDEX IF NOT EXISTS idx_brands_category ON brands(category);')
    console.log('✅ brands 索引创建成功')

    // 创建 products 表
    console.log('\n📦 创建 products 表...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2),
        original_price DECIMAL(10, 2),
        images TEXT[],
        category VARCHAR(100),
        tags TEXT[],
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold_out')),
        stock INTEGER DEFAULT 0,
        sales_count INTEGER DEFAULT 0,
        rating DECIMAL(2, 1) DEFAULT 5.0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)
    console.log('✅ products 表创建成功')

    // 创建 products 索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);')
    await client.query('CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);')
    await client.query('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);')
    console.log('✅ products 索引创建成功')

    // 创建 user_favorites 表
    console.log('\n📦 创建 user_favorites 表...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_favorites (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      );
    `)
    console.log('✅ user_favorites 表创建成功')

    // 创建 user_favorites 索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);')
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_favorites_product_id ON user_favorites(product_id);')
    console.log('✅ user_favorites 索引创建成功')

    client.release()
    console.log('\n🎉 所有表创建完成！')

  } catch (error) {
    console.error('❌ 创建表失败:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

createTables().catch(console.error)
