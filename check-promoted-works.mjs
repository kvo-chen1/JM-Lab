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
  console.log('  检查 promoted_works 表数据');
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
    // 检查 promoted_works 表结构
    console.log('🔄 检查 promoted_works 表结构...');
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'promoted_works' 
      ORDER BY ordinal_position;
    `);
    console.log('📋 promoted_works 表结构:');
    columnsResult.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type}`);
    });
    console.log('');

    // 检查 promotion_orders 表结构
    console.log('🔄 检查 promotion_orders 表结构...');
    const poColumnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'promotion_orders' 
      ORDER BY ordinal_position;
    `);
    console.log('📋 promotion_orders 表结构:');
    poColumnsResult.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type}`);
    });
    console.log('');

    // 检查 works 表结构
    console.log('🔄 检查 works 表结构...');
    const worksColumnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'works' 
      ORDER BY ordinal_position;
    `);
    console.log('📋 works 表结构:');
    worksColumnsResult.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type}`);
    });
    console.log('');

    // 检查 promoted_works 中的数据
    console.log('🔄 检查 promoted_works 数据...');
    const dataResult = await pool.query(`
      SELECT id, order_id, work_id, user_id, status 
      FROM promoted_works 
      LIMIT 5;
    `);
    console.log('📄 promoted_works 数据样本:');
    dataResult.rows.forEach(row => {
      console.log(`   id: ${row.id}`);
      console.log(`   order_id: ${row.order_id} (类型: ${typeof row.order_id})`);
      console.log(`   work_id: ${row.work_id} (类型: ${typeof row.work_id})`);
      console.log(`   user_id: ${row.user_id} (类型: ${typeof row.user_id})`);
      console.log(`   status: ${row.status}`);
      console.log('   ---');
    });
    console.log('');

    // 尝试直接执行查询来定位问题
    console.log('🔄 尝试执行简化查询...');
    try {
      const simpleResult = await pool.query(`
        SELECT pw.work_id, po.id as order_id
        FROM promoted_works pw
        JOIN promotion_orders po ON pw.order_id = po.id
        WHERE pw.status = 'active'
        LIMIT 1;
      `);
      console.log('✅ 简化查询成功:', simpleResult.rows);
    } catch (e) {
      console.log('❌ 简化查询失败:', e.message);
    }

    // 尝试将 work_id 转换为 UUID
    console.log('🔄 尝试将 work_id 转换为 UUID...');
    try {
      const castResult = await pool.query(`
        SELECT pw.work_id::uuid
        FROM promoted_works pw
        LIMIT 1;
      `);
      console.log('✅ work_id 可以转换为 UUID:', castResult.rows);
    } catch (e) {
      console.log('❌ work_id 转换为 UUID 失败:', e.message);
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
