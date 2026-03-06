import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.NEON_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkPerformance() {
  const client = await pool.connect();
  
  try {
    console.log('=== Database Performance Check ===\n');
    
    // 检查表的数据量
    const tables = ['users', 'points_records', 'user_achievements'];
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`${table}: ${result.rows[0].count} rows`);
    }
    
    console.log('\n=== Checking Indexes ===');
    
    // 检查 points_records 表的索引
    const indexResult = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'points_records'
    `);
    console.log('\npoints_records indexes:');
    indexResult.rows.forEach(row => console.log(`  - ${row.indexname}`));
    
    // 测试简单查询的性能
    console.log('\n=== Query Performance Tests ===');
    
    const tests = [
      {
        name: 'Simple user count',
        sql: 'SELECT COUNT(*) FROM users'
      },
      {
        name: 'Simple points_records count',
        sql: 'SELECT COUNT(*) FROM points_records'
      },
      {
        name: 'Distinct user_id from points_records (30 days)',
        sql: `SELECT DISTINCT user_id FROM points_records 
              WHERE created_at > NOW() - INTERVAL '30 days' LIMIT 100`
      },
      {
        name: 'Sum points by user',
        sql: `SELECT user_id, SUM(points) FROM points_records 
              GROUP BY user_id LIMIT 10`
      }
    ];
    
    for (const test of tests) {
      const start = Date.now();
      await client.query(test.sql);
      const duration = Date.now() - start;
      console.log(`${test.name}: ${duration}ms`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkPerformance();
