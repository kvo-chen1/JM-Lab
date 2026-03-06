import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env' });

const connectionString = process.env.NEON_DATABASE_URL || process.env.NEON_URL;

console.log('Testing Neon database connection...');
console.log('Connection string exists:', !!connectionString);
console.log('Connection string (masked):', connectionString ? connectionString.replace(/:([^@]+)@/, ':***@') : 'N/A');

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 3,
  min: 0,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 30000, // 增加到30秒
  statement_timeout: 30000
});

async function testConnection() {
  const startTime = Date.now();
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    const connectTime = Date.now() - startTime;
    console.log(`✅ Connected successfully in ${connectTime}ms`);

    const queryStart = Date.now();
    const res = await client.query('SELECT 1 as test');
    const queryTime = Date.now() - queryStart;
    console.log(`✅ Query executed in ${queryTime}ms:`, res.rows[0]);

    // 测试查询 works 表
    const worksStart = Date.now();
    const worksRes = await client.query('SELECT COUNT(*) as count FROM works');
    const worksTime = Date.now() - worksStart;
    console.log(`✅ Works count query in ${worksTime}ms:`, worksRes.rows[0]);

    client.release();
    await pool.end();
    console.log('🎉 All tests passed!');
  } catch (error) {
    const failTime = Date.now() - startTime;
    console.error(`❌ Connection failed after ${failTime}ms:`, error.message);
    console.error('Error details:', error);
    await pool.end();
    process.exit(1);
  }
}

testConnection();
