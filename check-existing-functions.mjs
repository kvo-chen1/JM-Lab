import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 
                     process.env.NEON_DATABASE_URL || 
                     process.env.POSTGRES_URL_NON_POOLING;

async function checkFunctions() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔍 检查数据库中的函数');
    console.log('='.repeat(60));

    // 获取所有函数
    const result = await client.query(`
      SELECT 
        p.proname as function_name,
        pg_get_function_arguments(p.oid) as arguments,
        pg_get_function_result(p.oid) as return_type
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
      ORDER BY p.proname
    `);

    console.log(`\n📊 找到 ${result.rows.length} 个函数:\n`);
    
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.function_name}`);
      console.log(`   参数: ${row.arguments || '无'}`);
      console.log(`   返回: ${row.return_type}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ 查询失败:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkFunctions();
