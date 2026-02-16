// 修复时间戳（秒级转毫秒级）
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

async function fixTimestamps() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('数据库连接成功\n');

    // 检查当前数据
    console.log('=== 当前时间戳数据 ===');
    const checkResult = await client.query(`
      SELECT 
        id,
        title,
        start_date::text as start_date_str,
        end_date::text as end_date_str,
        start_time,
        end_time
      FROM events
    `);

    for (const row of checkResult.rows) {
      const startDateNum = parseInt(row.start_date_str);
      const isSeconds = startDateNum < 2000000000;

      console.log(`\n活动: ${row.title}`);
      console.log(`  start_date (bigint): ${row.start_date_str}`);
      console.log(`  start_time (timestamp): ${row.start_time}`);
      console.log(`  单位: ${isSeconds ? '秒级' : '毫秒级'}`);

      if (isSeconds) {
        const secDate = new Date(startDateNum * 1000);
        console.log(`  秒级解读: ${secDate.toISOString()}`);
      }
    }

    // 执行修复 - 将秒级时间戳转为毫秒级
    console.log('\n=== 执行修复 ===');

    // 先检查哪些记录需要修复
    const needsFixResult = await client.query(`
      SELECT id, title, start_date
      FROM events
      WHERE start_date < 2000000000
    `);

    console.log(`需要修复的记录数: ${needsFixResult.rows.length}`);

    if (needsFixResult.rows.length > 0) {
      // 执行修复
      const fixResult = await client.query(`
        UPDATE events
        SET 
          start_date = start_date * 1000,
          end_date = end_date * 1000,
          created_at = created_at * 1000,
          registration_deadline = CASE WHEN registration_deadline IS NOT NULL THEN registration_deadline * 1000 ELSE NULL END,
          review_start_date = CASE WHEN review_start_date IS NOT NULL THEN review_start_date * 1000 ELSE NULL END,
          result_date = CASE WHEN result_date IS NOT NULL THEN result_date * 1000 ELSE NULL END,
          published_at = CASE WHEN published_at IS NOT NULL THEN published_at * 1000 ELSE NULL END
        WHERE start_date < 2000000000
        RETURNING id, title, start_date, end_date
      `);

      console.log(`\n修复了 ${fixResult.rows.length} 条记录:`);
      for (const row of fixResult.rows) {
        console.log(`  - ${row.title}`);
        console.log(`    start_date: ${row.start_date}`);
        console.log(`    end_date: ${row.end_date}`);
      }
    }

    // 验证修复结果
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

    const now = Date.now();
    console.log(`当前时间: ${new Date(now).toISOString()}\n`);

    for (const row of verifyResult.rows) {
      const startDate = parseInt(row.start_date);
      const endDate = parseInt(row.end_date);

      let status = '进行中';
      if (now > endDate) {
        status = '已结束';
      } else if (now < startDate) {
        status = '即将开始';
      }

      console.log(`${row.title}`);
      console.log(`  状态: ${status}`);
      console.log(`  开始: ${row.start_date_readable}`);
      console.log(`  结束: ${row.end_date_readable}`);
      console.log('');
    }

    console.log('✅ 修复完成！');

  } catch (err) {
    console.error('修复失败:', err.message);
    console.error(err);
  } finally {
    await client.end();
  }
}

fixTimestamps();
