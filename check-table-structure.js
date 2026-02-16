// 检查表结构
import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';
import fs from 'fs';

const envPath = '.env.local';
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const dbUrl = process.env.DATABASE_URL;

async function checkStructure() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // 检查 events 表结构
    const result = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'events'
      ORDER BY ordinal_position
    `);

    console.log('=== events 表结构 ===');
    for (const row of result.rows) {
      console.log(`${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    }

    // 查看实际数据类型
    const sampleResult = await client.query(`
      SELECT pg_typeof(start_date) as start_date_type,
             pg_typeof(end_date) as end_date_type,
             pg_typeof(created_at) as created_at_type
      FROM events LIMIT 1
    `);

    console.log('\n=== 实际数据类型 ===');
    console.log(sampleResult.rows[0]);

    // 查看原始数据
    const rawResult = await client.query(`
      SELECT start_date, end_date, created_at
      FROM events LIMIT 1
    `);

    console.log('\n=== 原始数据 ===');
    console.log(rawResult.rows[0]);

  } catch (err) {
    console.error('查询失败:', err.message);
  } finally {
    await client.end();
  }
}

checkStructure();
