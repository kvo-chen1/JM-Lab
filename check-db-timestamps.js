// 检查数据库中的实际时间戳
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

async function checkTimestamps() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('数据库连接成功\n');

    const result = await client.query(`
      SELECT 
        id,
        title,
        start_date,
        end_date,
        -- 检查时间戳大小
        CASE 
          WHEN start_date > 1000000000000 THEN '毫秒级'
          ELSE '秒级'
        END as timestamp_type,
        -- 转换为可读日期
        to_timestamp(start_date / 1000) as start_ms,
        to_timestamp(start_date) as start_sec,
        start_time
      FROM events
      WHERE id = 'f1251821-5738-48ed-91b7-5d4b59287219'
    `);

    const now = Date.now();
    console.log(`当前时间戳: ${now}`);
    console.log(`当前时间: ${new Date(now).toISOString()}\n`);

    for (const row of result.rows) {
      console.log(`活动: ${row.title}`);
      console.log(`  start_date 原始值: ${row.start_date}`);
      console.log(`  时间戳类型: ${row.timestamp_type}`);
      console.log(`  作为毫秒解读: ${row.start_ms}`);
      console.log(`  作为秒解读: ${row.start_sec}`);
      console.log(`  start_time (timestamp类型): ${row.start_time}`);
      console.log('');

      // 计算如果前端用这个数字创建Date会是什么结果
      const asNumber = parseInt(row.start_date);
      console.log(`  前端 new Date(${asNumber}): ${new Date(asNumber).toISOString()}`);
      console.log(`  前端 new Date(${asNumber * 1000}): ${new Date(asNumber * 1000).toISOString()}`);
    }

  } catch (err) {
    console.error('查询失败:', err.message);
  } finally {
    await client.end();
  }
}

checkTimestamps();
