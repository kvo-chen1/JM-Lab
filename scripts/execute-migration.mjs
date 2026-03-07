/**
 * 执行数据库迁移脚本
 */
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

// 加载环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 获取数据库连接字符串
const connectionString = process.env.DATABASE_URL || 
  process.env.NEON_DATABASE_URL || 
  process.env.POSTGRES_URL ||
  'postgresql://neondb_owner:npg_fV0Tzot3RCxh@ep-shy-bar-ajp9o0kn-pooler.c-3.us-east-2.aws.neon.tech/neondb';

console.log('[Migration] 连接到数据库...');
console.log('[Migration] 连接字符串:', connectionString.replace(/:([^:@]+)@/, ':****@'));

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function executeMigration() {
  const client = await pool.connect();
  
  try {
    console.log('[Migration] 读取 SQL 文件...');
    const sqlFile = join(__dirname, 'create-marketplace-tables.sql');
    const sql = readFileSync(sqlFile, 'utf-8');
    
    console.log('[Migration] 开始执行 SQL...');
    console.log('[Migration] SQL 文件大小:', sql.length, '字符');
    
    // 执行 SQL
    const result = await client.query(sql);
    
    console.log('[Migration] ✅ SQL 执行成功!');
    
    // 检查创建的表
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('brands', 'brand_authorizations', 'product_categories', 'products', 'orders', 'order_items', 'shopping_carts', 'product_reviews', 'user_favorites')
      ORDER BY table_name
    `);
    
    console.log('\n[Migration] 已创建的表:');
    tablesResult.rows.forEach(row => {
      console.log('  ✅', row.table_name);
    });
    
    // 检查创建的函数
    const functionsResult = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_type = 'FUNCTION'
      AND routine_name IN ('generate_order_no', 'get_product_average_rating', 'get_product_review_count', 'decrease_product_stock', 'increase_product_stock', 'increment_product_view')
      ORDER BY routine_name
    `);
    
    console.log('\n[Migration] 已创建的函数:');
    functionsResult.rows.forEach(row => {
      console.log('  ✅', row.routine_name);
    });
    
    // 检查创建的视图
    const viewsResult = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
      AND table_name IN ('product_details', 'order_details')
      ORDER BY table_name
    `);
    
    console.log('\n[Migration] 已创建的视图:');
    viewsResult.rows.forEach(row => {
      console.log('  ✅', row.table_name);
    });
    
    // 检查商品分类数据
    const categoriesResult = await client.query(`
      SELECT name, slug FROM product_categories ORDER BY sort_order
    `);
    
    console.log('\n[Migration] 已插入的商品分类:');
    categoriesResult.rows.forEach(row => {
      console.log('  ✅', row.name, `(${row.slug})`);
    });
    
    console.log('\n[Migration] 🎉 数据库迁移完成!');
    
  } catch (error) {
    console.error('[Migration] ❌ 执行失败:', error.message);
    if (error.detail) {
      console.error('[Migration] 详细错误:', error.detail);
    }
    if (error.hint) {
      console.error('[Migration] 提示:', error.hint);
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

executeMigration();
