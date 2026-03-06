import { Pool } from 'pg';

// 手动输入Neon控制台中的连接字符串
// 请从Neon控制台复制正确的连接字符串
const connectionString = 'postgres://neon_owner:your_password@ep-purple-mountain-68284575.us-east-2.aws.neon.tech:5432/neondb';

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
    console.log('Connected successfully!');
    
    const res = await client.query('SELECT 1');
    console.log('Query result:', res.rows);
    
    // 测试扩展
    const extensions = await client.query('SELECT * FROM pg_extension');
    console.log('Installed extensions:', extensions.rows.map(e => e.extname));
    
    client.release();
    await pool.end();
    console.log('Connection test completed successfully!');
  } catch (error) {
    console.error('Connection error:', error.message);
    console.error('Error details:', error);
    await pool.end();
  }
}

testConnection();
