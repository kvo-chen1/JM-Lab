// 检查活动数量和状态
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

async function checkEvents() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('数据库连接成功\n');

    // 查询所有活动
    const result = await client.query(`
      SELECT 
        id,
        title,
        status,
        visibility,
        is_public,
        to_timestamp(start_date / 1000) as start_date_readable,
        to_timestamp(end_date / 1000) as end_date_readable
      FROM events
      ORDER BY created_at DESC
    `);

    console.log('=== 所有活动数据 ===');
    console.log(`数据库中共有 ${result.rows.length} 个活动\n`);

    const now = Date.now();
    console.log(`当前时间: ${new Date(now).toISOString()}\n`);

    for (const event of result.rows) {
      console.log(`- ${event.title}`);
      console.log(`  ID: ${event.id}`);
      console.log(`  状态: ${event.status}`);
      console.log(`  可见性: ${event.visibility}`);
      console.log(`  is_public: ${event.is_public}`);
      console.log(`  开始: ${event.start_date_readable}`);
      console.log(`  结束: ${event.end_date_readable}`);
      console.log('');
    }

    // 检查筛选条件
    console.log('\n=== 筛选分析 ===');
    const publishedCount = result.rows.filter(e => e.status === 'published').length;
    const publicCount = result.rows.filter(e => e.visibility === 'public' || e.is_public === true).length;
    console.log(`status='published' 的活动: ${publishedCount} 个`);
    console.log(`visibility='public' 或 is_public=true 的活动: ${publicCount} 个`);

  } catch (err) {
    console.error('查询失败:', err.message);
  } finally {
    await client.end();
  }
}

checkEvents();
