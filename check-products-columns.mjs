import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING || 
                    'postgresql://neondb_owner:npg_fV0Tzot3RCxh@ep-shy-bar-ajp9o0kn-pooler.c-3.us-east-2.aws.neon.tech/neondb',
  ssl: { rejectUnauthorized: false }
});

try {
  // 检查 products 表的列
  const result = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'products'
    ORDER BY ordinal_position
  `);
  
  console.log('=== products 表列信息 ===');
  result.rows.forEach(row => {
    console.log(`${row.column_name}: ${row.data_type}`);
  });
  
  await pool.end();
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
