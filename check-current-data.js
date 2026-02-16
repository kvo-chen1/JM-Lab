// 检查当前时间戳数据
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

async function checkData() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    const result = await client.query(`
      SELECT 
        id,
        title,
        start_date,
        end_date,
        to_timestamp(start_date / 1000) as start_ms,
        to_timestamp(start_date) as start_sec,
        start_time
      FROM events
    `);

    console.log('=== 当前活动数据 ===\n');
    const now = Date.now();
    console.log(`当前时间戳: ${now}`);
    console.log(`当前时间: ${new Date(now).toISOString()}\n`);

    for (const row of result.rows) {
      console.log(`活动: ${row.title}`);
      console.log(`  start_date 值: ${row.start_date}`);
      console.log(`  作为毫秒解读: ${row.start_ms}`);
      console.log(`  作为秒解读: ${row.start_sec}`);
      console.log(`  start_time: ${row.start_time}`);
      console.log('');
    }

  } catch (err) {
    console.error('查询失败:', err.message);
  } finally {
    await client.end();
  }
}

checkData();
