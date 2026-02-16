// 执行时间戳修复
import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
const envPath = '.env.local';
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const dbUrl = process.env.DATABASE_URL;

async function fixTimestamps() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('数据库连接成功\n');

    // 1. 检查当前时间戳数据
    console.log('=== 检查当前时间戳数据 ===');
    const checkResult = await client.query(`
      SELECT 
        id,
        title,
        start_date,
        end_date,
        to_timestamp(start_date) as start_date_sec,
        to_timestamp(start_date / 1000) as start_date_ms
      FROM events
    `);

    for (const row of checkResult.rows) {
      const isSeconds = row.start_date < 2000000000;
      console.log(`\n活动: ${row.title}`);
      console.log(`  当前时间戳: ${row.start_date}`);
      console.log(`  时间戳单位: ${isSeconds ? '秒级' : '毫秒级'}`);
      if (isSeconds) {
        console.log(`  秒级解读: ${row.start_date_sec}`);
        console.log(`  毫秒级解读: ${row.start_date_ms}`);
      }
    }

    // 2. 执行修复
    console.log('\n=== 执行时间戳修复 ===');
    const fixResult = await client.query(`
      UPDATE events
      SET 
        start_date = start_date * 1000,
        end_date = end_date * 1000,
        created_at = created_at * 1000,
        updated_at = updated_at * 1000
      WHERE start_date < 2000000000
      RETURNING id, title
    `);

    console.log(`修复了 ${fixResult.rows.length} 条记录`);
    for (const row of fixResult.rows) {
      console.log(`  - ${row.title}`);
    }

    // 3. 验证修复结果
    console.log('\n=== 验证修复结果 ===');
    const verifyResult = await client.query(`
      SELECT 
        id,
        title,
        start_date,
        end_date,
        to_timestamp(start_date / 1000) as start_date_readable,
        to_timestamp(end_date / 1000) as end_date_readable
      FROM events
    `);

    for (const row of verifyResult.rows) {
      console.log(`\n活动: ${row.title}`);
      console.log(`  开始时间: ${row.start_date_readable}`);
      console.log(`  结束时间: ${row.end_date_readable}`);
    }

    // 4. 检查当前时间下的活动状态
    console.log('\n=== 当前活动状态 ===');
    const now = Date.now();
    console.log(`当前时间: ${new Date(now).toISOString()}`);

    for (const row of verifyResult.rows) {
      const startDate = parseInt(row.start_date);
      const endDate = parseInt(row.end_date);

      let status = '进行中';
      if (now > endDate) {
        status = '已结束';
      } else if (now < startDate) {
        status = '即将开始';
      }

      console.log(`\n${row.title}: ${status}`);
      console.log(`  开始: ${new Date(startDate).toISOString()}`);
      console.log(`  结束: ${new Date(endDate).toISOString()}`);
    }

    console.log('\n✅ 时间戳修复完成！');

  } catch (err) {
    console.error('修复失败:', err.message);
  } finally {
    await client.end();
  }
}

fixTimestamps();
