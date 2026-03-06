import { Pool } from 'pg';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 使用环境变量中的连接字符串
const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

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
