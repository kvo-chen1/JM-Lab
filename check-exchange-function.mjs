import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING || 
                    'postgresql://neondb_owner:npg_fV0Tzot3RCxh@ep-shy-bar-ajp9o0kn-pooler.c-3.us-east-2.aws.neon.tech/neondb',
  ssl: { rejectUnauthorized: false }
});

try {
  // 检查 exchange_product 函数的参数
  const result = await pool.query(`
    SELECT 
      p.proname as function_name,
      pg_get_function_arguments(p.oid) as arguments,
      pg_get_function_result(p.oid) as result_type
    FROM pg_proc p
    WHERE p.proname = 'exchange_product'
  `);
  
  console.log('=== exchange_product 函数信息 ===');
  console.log(result.rows);
  
  await pool.end();
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
