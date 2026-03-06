// 快速测试 Neon 数据库连接
import { Pool } from 'pg';

const connectionString = 'postgresql://neondb_owner:npg_fV0Tzot3RCxh@ep-shy-bar-ajp9o0kn-pooler.c-3.us-east-2.aws.neon.tech/neondb';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW() as time, current_database() as db');
    console.log('✅ 连接成功！');
    console.log('🕐 服务器时间:', res.rows[0].time);
    console.log('💾 数据库:', res.rows[0].db);
    client.release();
  } catch (err) {
    console.error('❌ 连接失败:', err.message);
  } finally {
    await pool.end();
  }
}

test();
