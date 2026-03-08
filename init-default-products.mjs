import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING || 
                    'postgresql://neondb_owner:npg_fV0Tzot3RCxh@ep-shy-bar-ajp9o0kn-pooler.c-3.us-east-2.aws.neon.tech/neondb',
  ssl: { rejectUnauthorized: false }
});

try {
  // 获取一个现有用户 ID
  const userResult = await pool.query('SELECT id FROM users LIMIT 1');
  
  if (userResult.rows.length === 0) {
    console.log('数据库中没有用户，请先创建用户');
    await pool.end();
    process.exit(1);
  }
  
  const sellerId = userResult.rows[0].id;
  console.log(`使用用户 ID: ${sellerId}`);
  
  // 检查是否已有商品数据
  const countResult = await pool.query('SELECT COUNT(*) FROM products');
  const count = parseInt(countResult.rows[0].count);
  
  if (count > 0) {
    console.log(`数据库中已有 ${count} 条商品记录，跳过初始化`);
    await pool.end();
    process.exit(0);
  }
  
  // 默认商品数据
  const defaultProducts = [
    {
      name: '津小脉文创 T 恤',
      description: '津小脉 IP 形象文创 T 恤，采用优质纯棉面料，舒适透气。',
      price: 500,
      original_price: 680,
      stock: 100,
      sold_count: 0,
      images: ['https://picsum.photos/seed/tshirt1/400/400'],
      category: 'clothing',
      tags: ['文创', 'T 恤', '津小脉'],
      is_featured: true,
      is_hot: true,
      is_new: true,
      shipping_fee: 0,
      status: 'on_sale'
    },
    {
      name: '津脉智坊定制笔记本',
      description: '高品质商务笔记本，封面印有津脉智坊 logo，适合办公和学习使用。',
      price: 300,
      original_price: 400,
      stock: 200,
      sold_count: 0,
      images: ['https://picsum.photos/seed/notebook1/400/400'],
      category: 'stationery',
      tags: ['文具', '笔记本', '办公'],
      is_featured: true,
      is_hot: false,
      is_new: true,
      shipping_fee: 0,
      status: 'on_sale'
    },
    {
      name: '天津文化明信片套装',
      description: '包含 10 张天津地标建筑明信片，精美设计，收藏送礼两相宜。',
      price: 200,
      original_price: 250,
      stock: 500,
      sold_count: 0,
      images: ['https://picsum.photos/seed/postcard1/400/400'],
      category: 'gifts',
      tags: ['明信片', '天津', '文创'],
      is_featured: false,
      is_hot: true,
      is_new: false,
      shipping_fee: 0,
      status: 'on_sale'
    },
    {
      name: '津小脉毛绒公仔',
      description: '可爱津小脉 IP 毛绒公仔，高 30cm，手感柔软，适合收藏和送礼。',
      price: 800,
      original_price: 1000,
      stock: 50,
      sold_count: 0,
      images: ['https://picsum.photos/seed/plush1/400/400'],
      category: 'toys',
      tags: ['公仔', '毛绒玩具', '津小脉'],
      is_featured: true,
      is_hot: true,
      is_new: false,
      shipping_fee: 0,
      status: 'on_sale'
    },
    {
      name: '智能保温杯',
      description: '智能温度显示保温杯，24 小时保温保冷，办公出行必备。',
      price: 600,
      original_price: 800,
      stock: 150,
      sold_count: 0,
      images: ['https://picsum.photos/seed/bottle1/400/400'],
      category: 'home',
      tags: ['保温杯', '智能', '办公'],
      is_featured: false,
      is_hot: false,
      is_new: true,
      shipping_fee: 0,
      status: 'on_sale'
    },
    {
      name: '无线充电宝',
      description: '10000mAh 无线充电宝，支持快充，轻薄便携。',
      price: 1200,
      original_price: 1500,
      stock: 80,
      sold_count: 0,
      images: ['https://picsum.photos/seed/charger1/400/400'],
      category: 'electronics',
      tags: ['充电宝', '无线', '数码'],
      is_featured: true,
      is_hot: false,
      is_new: false,
      shipping_fee: 0,
      status: 'on_sale'
    }
  ];
  
  console.log('开始添加默认商品数据...');
  
  // 插入商品数据
  for (const product of defaultProducts) {
    await pool.query(`
      INSERT INTO products (
        seller_id,
        name,
        description,
        price,
        original_price,
        stock,
        sold_count,
        images,
        category,
        tags,
        is_featured,
        is_hot,
        is_new,
        shipping_fee,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10::jsonb, $11, $12, $13, $14, $15)
    `, [
      sellerId,
      product.name,
      product.description,
      product.price,
      product.original_price,
      product.stock,
      product.sold_count,
      JSON.stringify(product.images),
      product.category,
      JSON.stringify(product.tags),
      product.is_featured,
      product.is_hot,
      product.is_new,
      product.shipping_fee,
      product.status
    ]);
    
    console.log(`✓ 添加商品：${product.name}`);
  }
  
  console.log(`\n成功添加 ${defaultProducts.length} 条商品记录`);
  
  await pool.end();
} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
  await pool.end();
  process.exit(1);
}
