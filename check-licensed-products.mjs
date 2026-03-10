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

async function checkData() {
  const connectionString = getConnectionString();
  
  if (!connectionString) {
    console.error('❌ 未找到数据库连接字符串');
    process.exit(1);
  }
  
  console.log('=================================');
  console.log('  检查授权产品相关表');
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
    // 检查表是否存在
    console.log('🔄 检查 licensed_ip_products 表是否存在...');
    const tableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'licensed_ip_products'
      );
    `);
    console.log(`   表存在: ${tableResult.rows[0].exists}\n`);

    if (tableResult.rows[0].exists) {
      // 检查表结构
      console.log('🔄 检查 licensed_ip_products 表结构...');
      const columnsResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'licensed_ip_products' 
        ORDER BY ordinal_position;
      `);
      console.log('📋 表结构:');
      columnsResult.rows.forEach(row => {
        console.log(`   ${row.column_name}: ${row.data_type}`);
      });
      console.log('');

      // 检查数据
      console.log('🔄 检查数据...');
      const countResult = await pool.query('SELECT COUNT(*) FROM licensed_ip_products');
      console.log(`   总记录数: ${countResult.rows[0].count}\n`);

      if (parseInt(countResult.rows[0].count) > 0) {
        const dataResult = await pool.query(`
          SELECT id, product_name, status, brand_id 
          FROM licensed_ip_products 
          LIMIT 3
        `);
        console.log('📄 数据样本:');
        dataResult.rows.forEach(row => {
          console.log(`   ${JSON.stringify(row)}`);
        });
      }
    }

    // 测试 API 查询
    console.log('\n🔄 测试 API 查询...');
    try {
      const query = `SELECT p.*, r.brand_name, r.brand_logo 
                     FROM licensed_ip_products p
                     JOIN copyright_license_requests r ON p.brand_id = r.brand_id
                     WHERE p.status = 'on_sale'
                     ORDER BY p.sales_count DESC
                     LIMIT 8`;
      const result = await pool.query(query);
      console.log(`✅ 查询成功，返回 ${result.rows.length} 条记录`);
    } catch (e) {
      console.log('❌ 查询失败:', e.message);
    }

    await pool.end();
    
    console.log('\n=================================');
    console.log('  ✅ 检查完成！');
    console.log('=================================');
    
  } catch (error) {
    console.error('\n❌ 检查失败!');
    console.error(`   错误信息: ${error.message}`);
    await pool.end();
    process.exit(1);
  }
}

checkData();
