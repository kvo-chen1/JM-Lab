#!/usr/bin/env node
/**
 * 插入积分商城默认商品数据
 */

import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

const getConnectionString = () => {
  return process.env.POSTGRES_URL_NON_POOLING ||
         process.env.DATABASE_URL ||
         process.env.POSTGRES_URL ||
         process.env.NEON_DATABASE_URL
}

const connectionString = getConnectionString()

if (!connectionString) {
  console.error('❌ 错误: 找不到数据库连接字符串')
  process.exit(1)
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
})

const defaultProducts = [
  {
    name: '无线充电宝',
    description: '10000mAh 无线充电宝，支持快充，轻薄便携。',
    points: 1200,
    stock: 99,
    category: 'physical',
    image_url: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400',
    tags: ['充电宝', '无线', '数码'],
    status: 'active',
    is_featured: true,
    sort_order: 1
  },
  {
    name: '智能保温杯',
    description: '智能温度显示保温杯，24小时保温保冷，办公出行必备。',
    points: 899,
    stock: 158,
    category: 'physical',
    image_url: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400',
    tags: ['保温杯', '智能', '办公'],
    status: 'active',
    is_featured: true,
    sort_order: 2
  },
  {
    name: '津小脉毛绒公仔',
    description: '可爱津小脉IP毛绒公仔，高30cm，手感柔软，适合收藏和送礼。',
    points: 599,
    stock: 50,
    category: 'physical',
    image_url: 'https://images.unsplash.com/photo-1556012018-50c5c0da73bf?w=400',
    tags: ['公仔', '毛绒玩具', '津小脉'],
    status: 'active',
    is_featured: true,
    sort_order: 3
  },
  {
    name: '天津文化明信片套装',
    description: '精美天津文化主题明信片，一套12张，适合收藏和邮寄。',
    points: 299,
    stock: 200,
    category: 'physical',
    image_url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400',
    tags: ['明信片', '文化', '收藏'],
    status: 'active',
    is_featured: false,
    sort_order: 4
  },
  {
    name: '津脉智坊定制笔记本',
    description: '津脉智坊品牌定制笔记本，高质量纸张，精美封面设计。',
    points: 399,
    stock: 100,
    category: 'physical',
    image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400',
    tags: ['笔记本', '文具', '定制'],
    status: 'active',
    is_featured: false,
    sort_order: 5
  },
  {
    name: '津小脉文创T恤',
    description: '津小脉IP文创T恤，纯棉材质，舒适透气，多尺码可选。',
    points: 699,
    stock: 80,
    category: 'physical',
    image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    tags: ['T恤', '文创', '津小脉'],
    status: 'active',
    is_featured: false,
    sort_order: 6
  },
  {
    name: '平台会员7天体验',
    description: '享受会员专属功能和特权，7天体验卡。',
    points: 300,
    stock: 100,
    category: 'virtual',
    image_url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400',
    tags: ['会员', '虚拟', '体验'],
    status: 'active',
    is_featured: true,
    sort_order: 7
  },
  {
    name: '创作素材包',
    description: '包含50+优质创作素材，助力内容创作。',
    points: 500,
    stock: 999,
    category: 'virtual',
    image_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
    tags: ['素材', '创作', '虚拟'],
    status: 'active',
    is_featured: false,
    sort_order: 8
  },
  {
    name: '创作导师1对1指导',
    description: '30分钟专业创作指导，提升创作技能。',
    points: 1000,
    stock: 10,
    category: 'service',
    image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
    tags: ['指导', '服务', '导师'],
    status: 'active',
    is_featured: true,
    sort_order: 9
  },
  {
    name: '津门老字号文化体验课',
    description: '深入了解津门老字号文化，体验传统工艺。',
    points: 800,
    stock: 20,
    category: 'experience',
    image_url: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400',
    tags: ['文化', '体验', '老字号'],
    status: 'active',
    is_featured: false,
    sort_order: 10
  }
]

async function insertProducts() {
  try {
    const client = await pool.connect()
    console.log('✅ 数据库连接成功!\n')

    let inserted = 0
    let skipped = 0

    for (const product of defaultProducts) {
      try {
        // 检查是否已存在同名商品
        const checkResult = await client.query(
          'SELECT id FROM points_products WHERE name = $1',
          [product.name]
        )

        if (checkResult.rows.length > 0) {
          console.log(`⏭️ 跳过已存在: ${product.name}`)
          skipped++
          continue
        }

        // 插入商品
        await client.query(
          `INSERT INTO points_products (
            name, description, points, stock, category, image_url, tags, status, is_featured, sort_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            product.name,
            product.description,
            product.points,
            product.stock,
            product.category,
            product.image_url,
            JSON.stringify(product.tags),
            product.status,
            product.is_featured,
            product.sort_order
          ]
        )
        console.log(`✅ 插入成功: ${product.name} (${product.points}积分)`)
        inserted++
      } catch (err) {
        console.error(`❌ 插入失败 ${product.name}:`, err.message)
      }
    }

    console.log(`\n📊 完成! 插入: ${inserted}, 跳过: ${skipped}`)

    // 验证插入结果
    const countResult = await client.query('SELECT COUNT(*) FROM points_products')
    console.log(`📦 当前表中有 ${countResult.rows[0].count} 条记录`)

    client.release()
  } catch (error) {
    console.error('❌ 执行失败:', error.message)
  } finally {
    await pool.end()
  }
}

insertProducts()
