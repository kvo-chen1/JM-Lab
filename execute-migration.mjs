import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '.env') });
const envLocalPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

// 获取连接字符串
function getConnectionString() {
  return process.env.POSTGRES_URL_NON_POOLING || 
         process.env.DATABASE_URL || 
         process.env.POSTGRES_URL ||
         process.env.NEON_DATABASE_URL;
}

async function executeMigration() {
  const connectionString = getConnectionString();
  
  if (!connectionString) {
    console.error('❌ 未找到数据库连接字符串');
    process.exit(1);
  }
  
  console.log('=================================');
  console.log('  执行数据库迁移');
  console.log('=================================\n');
  
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
      requestCert: true,
      agent: false
    }
  });
  
  try {
    // 读取 SQL 文件
    const sqlPath = path.join(__dirname, 'migrations', 'create_missing_tables.sql');
    if (!fs.existsSync(sqlPath)) {
      console.error(`❌ SQL 文件不存在: ${sqlPath}`);
      process.exit(1);
    }
    
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    console.log('🔄 正在执行 SQL 迁移...\n');
    
    // 执行 SQL
    await pool.query(sql);
    
    console.log('✅ 迁移执行成功！\n');
    
    // 验证创建的表
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'user_history', 'tags', 'original_protection_applications',
        'points_products', 'product_categories', 'product_details',
        'product_reviews', 'shopping_carts', 'orders',
        'after_sales_requests', 'reviews', 'merchants',
        'merchant_todos', 'merchant_notifications', 'video_tasks'
      )
      ORDER BY table_name
    `);
    
    console.log('📋 已创建的表:');
    result.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.table_name}`);
    });
    
    console.log(`\n✅ 共创建 ${result.rows.length} 个表`);
    
    await pool.end();
    
    console.log('\n=================================');
    console.log('  迁移完成！');
    console.log('=================================');
    
    return true;
  } catch (error) {
    console.error('\n❌ 迁移执行失败!');
    console.error(`   错误信息: ${error.message}`);
    
    if (error.message.includes('already exists')) {
      console.log('\n💡 提示: 某些表可能已经存在，可以安全忽略。');
    }
    
    await pool.end();
    process.exit(1);
  }
}

executeMigration();
