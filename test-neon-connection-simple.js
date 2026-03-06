import { Pool } from 'pg';

// 直接使用正确的连接字符串格式
// 从Neon控制台复制的连接字符串应该类似于：postgres://neondb_owner:password@host:5432/neondb
const connectionString = 'postgresql://neondb_owner:npg_fV0Tzot3RCxh@ep-shy-bar-ajp9o0kn-pooler.c-3.us-east-2.aws.neon.tech/neondb';

console.log('Using connection string:', connectionString);

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('Testing Neon database connection...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!');
    
    const res = await client.query('SELECT 1');
    console.log('✅ Query result:', res.rows);
    
    // 测试扩展
    const extensions = await client.query('SELECT * FROM pg_extension');
    console.log('✅ Installed extensions:', extensions.rows.map(e => e.extname));
    
    client.release();
    await pool.end();
    console.log('🎉 Connection test completed successfully!');
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    console.error('Error details:', error);
    await pool.end();
  }
}

testConnection();
