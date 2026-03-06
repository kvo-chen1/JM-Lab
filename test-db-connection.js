import { Pool } from 'pg';

// 使用环境变量中的连接字符串
const connectionString = 'postgres://neondb_owner:npq_pBX0eXfDq2g@ep-rough-star-ajio93xk.us-east-2.aws.neon.tech:5432/neondb';

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
