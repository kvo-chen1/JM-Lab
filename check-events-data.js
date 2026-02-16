// 检查活动数据
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
        phase_status,
        start_date,
        end_date,
        created_at,
        updated_at,
        to_timestamp(start_date / 1000) as start_date_readable,
        to_timestamp(end_date / 1000) as end_date_readable,
        to_timestamp(created_at / 1000) as created_at_readable
      FROM events
      ORDER BY created_at DESC
    `);

    console.log('=== 活动数据 ===');
    console.log(`共找到 ${result.rows.length} 个活动\n`);

    const now = Date.now();
    console.log(`当前时间: ${new Date().toISOString()}`);
    console.log(`当前时间戳: ${now}\n`);

    for (const event of result.rows) {
      const startDate = parseInt(event.start_date);
      const endDate = parseInt(event.end_date);

      let computedStatus = 'ongoing';
      if (now > endDate) {
        computedStatus = 'ended';
      } else if (now < startDate) {
        computedStatus = 'upcoming';
      }

      console.log(`活动: ${event.title}`);
      console.log(`  ID: ${event.id}`);
      console.log(`  数据库状态: ${event.status}`);
      console.log(`  可见性: ${event.visibility}`);
      console.log(`  阶段状态: ${event.phase_status}`);
      console.log(`  开始时间: ${event.start_date_readable} (${startDate})`);
      console.log(`  结束时间: ${event.end_date_readable} (${endDate})`);
      console.log(`  计算状态: ${computedStatus}`);
      console.log(`  创建时间: ${event.created_at_readable}`);
      console.log('---');
    }

    // 检查 event_submissions 表
    console.log('\n=== 作品提交数据 ===');
    const submissionsResult = await client.query(`
      SELECT 
        es.id,
        es.status,
        es.event_id,
        es.user_id,
        e.title as event_title
      FROM event_submissions es
      LEFT JOIN events e ON es.event_id = e.id
      LIMIT 10
    `);
    console.log(`共找到 ${submissionsResult.rows.length} 条提交记录`);
    for (const sub of submissionsResult.rows) {
      console.log(`  提交ID: ${sub.id}, 状态: ${sub.status}, 活动: ${sub.event_title}`);
    }

    // 检查 event_participants 表
    console.log('\n=== 活动参与数据 ===');
    const participantsResult = await client.query(`
      SELECT 
        ep.id,
        ep.status,
        ep.current_step,
        ep.progress,
        ep.event_id,
        e.title as event_title
      FROM event_participants ep
      LEFT JOIN events e ON ep.event_id = e.id
      LIMIT 10
    `);
    console.log(`共找到 ${participantsResult.rows.length} 条参与记录`);
    for (const part of participantsResult.rows) {
      console.log(`  参与ID: ${part.id}, 状态: ${part.status}, 步骤: ${part.current_step}, 进度: ${part.progress}%, 活动: ${part.event_title}`);
    }

  } catch (err) {
    console.error('查询失败:', err.message);
  } finally {
    await client.end();
  }
}

checkEvents();
