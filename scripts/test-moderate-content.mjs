import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    // 测试 moderate_content 函数
    const result = await pool.query(
      'SELECT * FROM moderate_content($1, $2, $3, $4, $5)',
      ['test-id', 'work', '测试标题', '测试描述', 'test-user']
    );
    console.log('✅ moderate_content 函数测试成功:', result.rows[0]);
  } catch (err) {
    console.error('❌ moderate_content 函数测试失败:', err.message);
  } finally {
    pool.end();
  }
}

test();
