import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const result = await pool.query("SELECT proname FROM pg_proc WHERE proname = 'moderate_content'");
    if (result.rows.length > 0) {
      console.log('✅ moderate_content 函数存在');
      
      // 测试函数
      const testResult = await pool.query(
        "SELECT * FROM moderate_content($1, $2, $3, $4, $5)",
        ['test-id', 'work', '测试标题', '测试描述', 'test-user']
      );
      console.log('✅ 函数测试成功:', testResult.rows[0]);
    } else {
      console.log('❌ moderate_content 函数不存在');
    }
  } catch (err) {
    console.error('❌ 错误:', err.message);
  } finally {
    pool.end();
  }
}

check();
