import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING || 
                    'postgresql://neondb_owner:npg_fV0Tzot3RCxh@ep-shy-bar-ajp9o0kn-pooler.c-3.us-east-2.aws.neon.tech/neondb',
  ssl: { rejectUnauthorized: false }
});

try {
  // 检查兑换记录表
  const tableResult = await pool.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename LIKE '%exchange%'
    ORDER BY tablename
  `);
  
  console.log('=== 兑换相关表 ===');
  console.log(tableResult.rows);
  
  // 检查 RPC 函数
  const funcResult = await pool.query(`
    SELECT proname as function_name
    FROM pg_proc
    WHERE proname LIKE '%exchange%'
    ORDER BY proname
  `);
  
  console.log('\n=== 兑换相关函数 ===');
  console.log(funcResult.rows);
  
  await pool.end();
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
